"use client";

import { useState } from "react";

import { createInvoice } from "./invoiceService";
import type {
  InvoiceFormValues,
  InvoiceRequestStatus,
  InvoiceResult as InvoiceResultData,
} from "@/types/invoice";

import { InvoiceForm } from "./InvoiceForm";
import { InvoiceResult } from "./InvoiceResult";

export function InvoiceWorkspace() {
  const [draft, setDraft] = useState<InvoiceFormValues | null>(null);
  const [requestStatus, setRequestStatus] =
    useState<InvoiceRequestStatus>("idle");
  const [result, setResult] = useState<InvoiceResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(values: InvoiceFormValues) {
    setDraft(values);
    setRequestStatus("loading");
    setResult(null);
    setErrorMessage(null);

    try {
      const createdInvoice = await createInvoice({
        customerEmail: values.customerEmail,
        milestoneName: values.milestoneName,
        amount: Number(values.amount),
      });

      setResult(createdInvoice);
      setRequestStatus("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al crear la factura.",
      );
      setRequestStatus("error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <InvoiceForm
        onSubmit={handleSubmit}
        isSubmitting={requestStatus === "loading"}
      />
      <InvoiceResult
        draft={draft}
        requestStatus={requestStatus}
        result={result}
        errorMessage={errorMessage}
      />
    </div>
  );
}
