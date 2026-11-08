"use client";

import { useEffect, useState } from "react";

import type {
  InvoiceFormValues,
  InvoiceRequestStatus,
  InvoiceResult as InvoiceResultData,
  MilestoneOption,
} from "@/types/invoice";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceResult } from "./InvoiceResult";
import { createInvoice } from "./invoiceService";

type ProjectResponse = {
  success: boolean;
  message?: string;
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    milestones?: Array<{
      id: string;
      name: string;
      amount: number | string;
      status: string;
      paymentStatus: string;
      paypalInvoiceId?: string | null;
    }>;
  }>;
};

export function InvoiceWorkspace() {
  const [milestones, setMilestones] = useState<MilestoneOption[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<InvoiceFormValues | null>(null);
  const [requestStatus, setRequestStatus] = useState<InvoiceRequestStatus>("idle");
  const [result, setResult] = useState<InvoiceResultData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const data = (await response.json()) as ProjectResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.message ?? "No se pudieron cargar los proyectos.");
        }

        const available = (data.projects ?? []).flatMap((project) =>
          ["APPROVED", "IN_PROGRESS"].includes(project.status)
            ? (project.milestones ?? [])
                .filter((milestone) => milestone.paymentStatus === "NOT_INVOICED" && !milestone.paypalInvoiceId)
                .map((milestone) => ({
                  id: milestone.id,
                  projectName: project.name,
                  name: milestone.name,
                  amount: Number(milestone.amount),
                  status: milestone.status,
                  paymentStatus: milestone.paymentStatus,
                }))
            : [],
        );
        if (active) setMilestones(available);
      } catch (cause) {
        if (active) {
          setLoadError(cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.");
        }
      } finally {
        if (active) setIsLoadingProjects(false);
      }
    }

    void loadProjects();
    return () => { active = false; };
  }, []);

  async function handleSubmit(values: InvoiceFormValues) {
    setDraft(values);
    setRequestStatus("loading");
    setResult(null);
    setErrorMessage(null);

    try {
      const createdInvoice = await createInvoice({
        customerEmail: values.customerEmail,
        milestoneId: values.milestoneId,
      });
      setResult(createdInvoice);
      setRequestStatus("success");
      setMilestones((current) => current.filter((item) => item.id !== values.milestoneId));
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Ocurrió un error inesperado al crear la factura.");
      setRequestStatus("error");
    }
  }

  return (
    <>
      {isLoadingProjects && <p className="mb-5 rounded-2xl border border-hito-border bg-white px-4 py-3 text-sm text-hito-muted">Cargando hitos aprobados…</p>}
      {loadError && <p role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p>}
      {!isLoadingProjects && !loadError && milestones.length === 0 && (
        <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Primero genera y aprueba un plan en la página principal. Sus hitos aparecerán aquí para facturarlos.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <InvoiceForm milestones={milestones} onSubmit={handleSubmit} isSubmitting={requestStatus === "loading"} />
        <InvoiceResult draft={draft} requestStatus={requestStatus} result={result} errorMessage={errorMessage} />
      </div>
    </>
  );
}
