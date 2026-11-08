import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Configuración PayPal incompleta.",
        },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    if (!/^INV2-[A-Z0-9-]+$/.test(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "El identificador de factura no es válido.",
        },
        { status: 400 }
      );
    }

    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    // Obtener token de acceso.
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

    // Consultar factura en PayPal.
    const invoiceResponse = await fetch(
      `${baseUrl}/v2/invoicing/invoices/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const invoiceData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo consultar la factura en PayPal.",
        },
        { status: invoiceResponse.status }
      );
    }

    // Obtener los enlaces proporcionados por PayPal.
    const paypalLinks = Array.isArray(invoiceData.links)
      ? invoiceData.links.map(
          (link: {
            rel: string;
            href: string;
            method?: string;
          }) => ({
            rel: link.rel,
            href: link.href,
            method: link.method,
          })
        )
      : [];

    // Buscar el enlace de visualización del comprador.
    const payerViewLink =
      invoiceData.detail?.metadata?.recipient_view_url ??
      invoiceData.detail?.metadata?.payer_view_url ??
      invoiceData.metadata?.payer_view_url ??
      paypalLinks.find(
        (link: { rel: string; href: string }) =>
          link.rel === "payer-view"
      )?.href ??
      null;

    // Sincronizar el estado de pago y el enlace en PostgreSQL.
    const paymentStatus =
      invoiceData.status === "PAID" ? "PAID" : null;

    const syncResult = await pool.query(
      `
      UPDATE milestones
      SET
        paypal_invoice_url = COALESCE($1, paypal_invoice_url),
        payment_status = CASE
          WHEN $2 = 'PAID' THEN 'PAID'
          ELSE payment_status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE paypal_invoice_id = $3
      RETURNING
        id,
        name,
        status,
        payment_status
      `,
      [payerViewLink, paymentStatus, id]
    );

    const milestone = syncResult.rows[0] ?? null;

    return NextResponse.json({
      success: true,
      message: "Factura consultada y sincronizada correctamente.",
      synchronization: {
        found: Boolean(milestone),
        updated: Boolean(milestone && paymentStatus === "PAID"),
        milestone,
      },
      invoice: {
        id: invoiceData.id,
        status: invoiceData.status,
        currencyCode: invoiceData.detail?.currency_code,
        invoiceDate: invoiceData.detail?.invoice_date,
        recipientEmail:
          invoiceData.primary_recipients?.[0]?.billing_info?.email_address,
        amount: invoiceData.amount?.value,
        paymentUrl: payerViewLink,
        paypalLinks,
        metadata:
          invoiceData.detail?.metadata ??
          invoiceData.metadata ??
          null,
      },
    });
  } catch (error) {
    console.error("Error al consultar o sincronizar factura:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error interno al consultar o sincronizar la factura.",
      },
      { status: 500 }
    );
  }
}
