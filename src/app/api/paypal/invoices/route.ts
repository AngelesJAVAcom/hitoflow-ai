import { NextResponse } from "next/server";
import { z } from "zod";

const invoiceSchema = z.object({
  customerEmail: z.string().email(),
  milestoneName: z.string().min(3).max(200),
  amount: z.number().positive().max(100000),
});

export async function POST(request: Request) {
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

    const { customerEmail, milestoneName, amount } = validation.data;

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
        { success: false, message: "No se pudo autenticar con PayPal." },
        { status: 502 }
      );
    }

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
          name: milestoneName,
          quantity: "1",
          unit_amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
    };

    const invoiceResponse = await fetch(
      `${baseUrl}/v2/invoicing/invoices`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": crypto.randomUUID(),
        },
        body: JSON.stringify(invoicePayload),
        cache: "no-store",
      }
    );

    const invoiceData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
      console.error("Error PayPal Invoicing:", invoiceData);

      return NextResponse.json(
        {
          success: false,
          message: "PayPal no pudo crear el borrador de factura.",
        },
        { status: invoiceResponse.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Borrador de factura creado correctamente.",
        invoiceId: invoiceData.id,
        status: invoiceData.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear factura:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error interno al crear la factura.",
      },
      { status: 500 }
    );
  }
}
