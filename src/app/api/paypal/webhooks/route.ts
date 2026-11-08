import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type PayPalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
  };
};

export async function POST(request: Request) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL;
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!clientId || !clientSecret || !baseUrl || !webhookId) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuración de PayPal incompleta.",
        },
        { status: 500 }
      );
    }

    // Leer el cuerpo original recibido de PayPal.
    const rawBody = await request.text();

    let event: PayPalWebhookEvent;

    try {
      event = JSON.parse(rawBody) as PayPalWebhookEvent;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "El cuerpo del webhook no contiene JSON válido.",
        },
        { status: 400 }
      );
    }

    if (!event.id || !event.event_type) {
      return NextResponse.json(
        {
          success: false,
          message: "El evento recibido está incompleto.",
        },
        { status: 400 }
      );
    }

    // Obtener encabezados originales enviados por PayPal.
    const transmissionId = request.headers.get(
      "paypal-transmission-id"
    );
    const transmissionTime = request.headers.get(
      "paypal-transmission-time"
    );
    const certUrl = request.headers.get("paypal-cert-url");
    const authAlgo = request.headers.get("paypal-auth-algo");
    const transmissionSig = request.headers.get(
      "paypal-transmission-sig"
    );

    if (
      !transmissionId ||
      !transmissionTime ||
      !certUrl ||
      !authAlgo ||
      !transmissionSig
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan encabezados de verificación de PayPal.",
        },
        { status: 400 }
      );
    }

    // Obtener token de acceso de PayPal.
    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      `${baseUrl}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        cache: "no-store",
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo autenticar con PayPal.",
        },
        { status: 502 }
      );
    }

    // Verificar la autenticidad de la notificación.
    const verificationResponse = await fetch(
      `${baseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: event,
        }),
        cache: "no-store",
      }
    );

    const verificationData = await verificationResponse.json();

    if (
      !verificationResponse.ok ||
      verificationData.verification_status !== "SUCCESS"
    ) {
      console.error(
        "Firma de webhook no válida:",
        verificationData
      );

      return NextResponse.json(
        {
          success: false,
          message: "No se pudo verificar la autenticidad del webhook.",
        },
        { status: 401 }
      );
    }

    // La notificación ya fue verificada.
    // Registrar y procesar el evento en una transacción.
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insertedEvent = await client.query(
        `
        INSERT INTO webhook_events (
          event_id,
          event_type,
          paypal_resource_id,
          processing_status
        )
        VALUES ($1, $2, $3, 'RECEIVED')
        ON CONFLICT (event_id) DO NOTHING
        RETURNING id
        `,
        [
          event.id,
          event.event_type,
          event.resource?.id ?? null,
        ]
      );

      // Si ya existe, PayPal está reenviando un evento duplicado.
      if (insertedEvent.rowCount === 0) {
        await client.query("COMMIT");

        return NextResponse.json({
          success: true,
          message: "El evento ya había sido recibido.",
          duplicate: true,
        });
      }

      // Procesar únicamente los pagos confirmados de facturas.
      if (event.event_type === "INVOICING.INVOICE.PAID") {
        const invoiceId = event.resource?.id;

        if (!invoiceId) {
          await client.query(
            `
            UPDATE webhook_events
            SET
              processing_status = 'FAILED',
              error_message = $1
            WHERE event_id = $2
            `,
            ["El evento no contiene un ID de factura.", event.id]
          );

          await client.query("COMMIT");

          return NextResponse.json({
            success: true,
            message: "Evento recibido, pero falta el ID de factura.",
          });
        }

        const milestoneResult = await client.query(
          `
          UPDATE milestones
          SET
            payment_status = 'PAID',
            updated_at = CURRENT_TIMESTAMP
          WHERE paypal_invoice_id = $1
          RETURNING id, name, amount, status, payment_status
          `,
          [invoiceId]
        );

        if (milestoneResult.rowCount === 0) {
          await client.query(
            `
            UPDATE webhook_events
            SET
              processing_status = 'FAILED',
              error_message = $1
            WHERE event_id = $2
            `,
            [
              "No se encontró un hito asociado a la factura.",
              event.id,
            ]
          );

          await client.query("COMMIT");

          return NextResponse.json({
            success: true,
            message: "Evento recibido, pero no se encontró el hito.",
          });
        }

        await client.query(
          `
          UPDATE webhook_events
          SET
            processing_status = 'PROCESSED',
            processed_at = CURRENT_TIMESTAMP
          WHERE event_id = $1
          `,
          [event.id]
        );

        await client.query("COMMIT");

        return NextResponse.json({
          success: true,
          message: "Pago recibido y hito actualizado correctamente.",
          milestone: milestoneResult.rows[0],
        });
      }

      // Registrar otros eventos sin modificar el estado del hito.
      await client.query(
        `
        UPDATE webhook_events
        SET
          processing_status = 'IGNORED',
          processed_at = CURRENT_TIMESTAMP
        WHERE event_id = $1
        `,
        [event.id]
      );

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "Evento recibido y registrado.",
        eventType: event.event_type,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al procesar webhook de PayPal:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error interno al procesar el webhook.",
      },
      { status: 500 }
    );
  }
}
