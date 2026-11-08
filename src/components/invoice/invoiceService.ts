import type {
  CreateInvoicePayload,
  InvoiceResult,
} from "@/types/invoice";

type CreateInvoiceResponse = {
  success: boolean;
  message?: string;
  invoice?: {
    id: string;
    status: string;
    paymentUrl: string | null;
  };
};

export async function createInvoice(
  payload: CreateInvoicePayload,
): Promise<InvoiceResult> {
  const response = await fetch("/api/paypal/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: CreateInvoiceResponse;

  try {
    data = (await response.json()) as CreateInvoiceResponse;
  } catch {
    throw new Error("El servidor devolvió una respuesta inesperada.");
  }

  if (
    !response.ok ||
    !data.success ||
    !data.invoice?.id ||
    !data.invoice.status
  ) {
    throw new Error(
      data.message ?? "No se pudo crear el borrador de factura.",
    );
  }

  return {
    invoiceId: data.invoice.id,
    status: data.invoice.status,
    message: data.message ?? "Factura creada y enviada correctamente.",
    paymentUrl: data.invoice.paymentUrl,
  };
}
