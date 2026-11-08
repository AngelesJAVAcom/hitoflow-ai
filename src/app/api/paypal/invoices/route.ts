
import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";

const invoiceSchema = z.object({
  milestoneId: z.string().uuid(),
  customerEmail: z.string().email(),
});

export async function POST(request: Request) {
  let client;
  let transactionStarted = false;

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      return NextResponse.json(
        { success: false, message: "Configuración PayPal incompleta." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validation = invoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Los datos de la factura no son válidos.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { milestoneId, customerEmail } = validation.data;

    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    const milestoneResult = await client.query(
      `
      SELECT
        m.id AS milestone_id,
        m.name AS milestone_name,
        m.amount,
        m.payment_status,
        m.paypal_invoice_id,
        p.status AS project_status
      FROM milestones m
      INNER JOIN projects p ON p.id = m.project_id
      WHERE m.id = $1
      FOR UPDATE OF m, p
      `,
      [milestoneId]
    );

    if (milestoneResult.rowCount === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        { success: false, message: "No se encontró el hito solicitado." },
        { status: 404 }
      );
    }

    const milestone = milestoneResult.rows[0];

    if (!["APPROVED", "IN_PROGRESS"].includes(milestone.project_status)) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: "El proyecto debe estar aprobado o en curso.",
        },
        { status: 409 }
      );
    }

    if (
      milestone.paypal_invoice_id ||
      milestone.payment_status !== "NOT_INVOICED"
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: "Este hito ya tiene una factura asociada.",
        },
        { status: 409 }
      );
    }

    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    // 1. Obtener token de PayPal.
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
      throw new Error("No se pudo autenticar con PayPal.");
    }

    const authorization = `Bearer ${tokenData.access_token}`;

    // 2. Crear factura con los datos reales del hito.
    const invoicePayload = {
      detail: {
        currency_code: "USD",
        note: "Factura generada mediante HitoFlow AI.",
        payment_term: {
          term_type: "DUE_ON_RECEIPT",
        },
      },
      invoicer: {
        name: {
          given_name: "HitoFlow",
          surname: "Demo",
        },
      },
      primary_recipients: [
        {
          billing_info: {
            email_address: customerEmail,
          },
        },
      ],
      items: [
        {
          name: milestone.milestone_name,
          quantity: "1",
          unit_amount: {
            currency_code: "USD",
            value: Number(milestone.amount).toFixed(2),
          },
        },
      ],
    };

    const invoiceResponse = await fetch(
      `${baseUrl}/v2/invoicing/invoices`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
          "PayPal-Request-Id": crypto.randomUUID(),
          Prefer: "return=representation",
        },
        body: JSON.stringify(invoicePayload),
        cache: "no-store",
      }
    );

    const createdData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
      console.error("Error PayPal Invoicing:", createdData);
      throw new Error("PayPal no pudo crear la factura.");
    }

    // 3. Obtener el ID, incluso si PayPal devuelve solamente un enlace.
    let invoiceId = createdData.id;

    if (!invoiceId && typeof createdData.href === "string") {
      const invoiceUrl = new URL(createdData.href);
      invoiceId = invoiceUrl.pathname.split("/").pop();
    }

    if (!invoiceId) {
      console.error("Respuesta de creación de PayPal:", createdData);
      throw new Error("PayPal no devolvió el identificador de la factura.");
    }

    // 4. Consultar la factura completa.
    const invoiceDetailsResponse = await fetch(
      `${baseUrl}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const invoiceDetails = await invoiceDetailsResponse.json();

    if (!invoiceDetailsResponse.ok) {
      console.error("Error consultando factura:", invoiceDetails);
      throw new Error("No se pudieron consultar los datos de la factura.");
    }

    // 5. Enviar la factura al cliente.
    const sendResponse = await fetch(
      `${baseUrl}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}/send`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!sendResponse.ok) {
      const sendError = await sendResponse.text();
      console.error("Error al enviar factura:", sendError);
      throw new Error("La factura se creó, pero no pudo enviarse.");
    }

    // 6. Consultar nuevamente para obtener el enlace actualizado.
    const sentInvoiceResponse = await fetch(
      `${baseUrl}/v2/invoicing/invoices/${encodeURIComponent(invoiceId)}`,
      {
        method: "GET",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const sentInvoice = await sentInvoiceResponse.json();

    if (!sentInvoiceResponse.ok) {
      console.error("Error consultando factura enviada:", sentInvoice);
      throw new Error("La factura se envió, pero no se pudo verificar.");
    }

    const payerViewLink = sentInvoice.links?.find(
      (link: { rel: string; href: string }) =>
        link.rel === "payer-view"
    )?.href;

    // 7. Guardar la factura en PostgreSQL.
    await client.query(
      `
      UPDATE milestones
      SET
        paypal_invoice_id = $1,
        paypal_invoice_url = $2,
        payment_status = 'UNPAID',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      `,
      [invoiceId, payerViewLink || null, milestoneId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        message: "Factura creada y enviada correctamente.",
        invoice: {
          id: invoiceId,
          status: sentInvoice.status || "SENT",
          amount: Number(milestone.amount),
          milestoneId,
          milestoneName: milestone.milestone_name,
          paymentStatus: "UNPAID",
          paymentUrl: payerViewLink || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (transactionStarted && client) {
      await client.query("ROLLBACK");
    }

    console.error("Error al crear factura:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error interno al crear la factura.",
      },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
