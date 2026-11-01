import { NextResponse } from "next/server";


export async function POST() {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL;

    if (!clientId || !clientSecret || !baseUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan variables de entorno de PayPal.",
        },
        { status: 500 }
      );
    }

    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const response = await fetch(
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de autenticación PayPal:", data);

      return NextResponse.json(
        {
          success: false,
          message: "No fue posible autenticar con PayPal Sandbox.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conexión con PayPal Sandbox exitosa.",
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error("Error al conectar con PayPal:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error interno al conectar con PayPal.",
      },
      { status: 500 }
    );
  }
}
