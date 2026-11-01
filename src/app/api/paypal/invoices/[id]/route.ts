import { NextResponse } from "next/server";

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

    return NextResponse.json({
      success: true,
      message: "Factura consultada correctamente.",
      invoice: {
        id: invoiceData.id,
        status: invoiceData.status,
        currencyCode: invoiceData.detail?.currency_code,
        invoiceDate: invoiceData.detail?.invoice_date,
        recipientEmail:
          invoiceData.primary_recipients?.[0]?.billing_info?.email_address,
        amount: invoiceData.amount?.value,
      },
    });
  } catch (error) {
    console.error("Error al consultar factura:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error interno al consultar la factura.",
      },
      { status: 500 }
    );
  }
}
