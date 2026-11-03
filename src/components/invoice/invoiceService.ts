import type {
  CreateInvoicePayload,
  InvoiceResult,
} from "@/types/invoice";

type CreateInvoiceResponse = {
  success: boolean;
  message?: string;
  invoiceId?: string;
  status?: string;
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
    !data.invoiceId ||
    !data.status
  ) {
    throw new Error(
      data.message ?? "No se pudo crear el borrador de factura.",
    );
  }

  return {
    invoiceId: data.invoiceId,
    status: data.status,
    message: data.message ?? "Borrador de factura creado correctamente.",
  };
}
