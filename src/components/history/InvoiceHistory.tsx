"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type InvoiceRecord = {
  id: string;
  projectName: string;
  milestoneName: string;
  amount: number;
  paymentStatus: string | null;
  paymentUrl: string | null;
  dueDate: string;
  recipientEmail?: string;
  paypalStatus?: string;
  syncError?: string;
};

type ProjectsResponse = {
  success: boolean;
  message?: string;
  projects?: Array<{
    name: string;
    milestones?: Array<{
      name: string;
      amount: number | string;
      endDate: string;
      paymentStatus: string | null;
      paypalInvoiceId: string | null;
      paypalInvoiceUrl: string | null;
    }>;
  }>;
};

type InvoiceFilter = "ALL" | "PENDING" | "PAID" | "CANCELLED";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value));
}

function invoiceCategory(invoice: InvoiceRecord): Exclude<InvoiceFilter, "ALL"> {
  const remoteStatus = invoice.paypalStatus?.toUpperCase();
  if (invoice.paymentStatus === "PAID" || remoteStatus === "PAID") return "PAID";
  const statuses = [remoteStatus, invoice.paymentStatus?.toUpperCase()];
  if (statuses.some((status) => ["CANCELLED", "VOIDED"].includes(status ?? ""))) return "CANCELLED";
  return "PENDING";
}

function paymentLabel(invoice: InvoiceRecord) {
  if (invoiceCategory(invoice) === "PAID") return "Pagada";
  if (invoiceCategory(invoice) === "CANCELLED") return "Cancelada";
  return "Pendiente de pago";
}

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [syncingId, setSyncingId] = useState("");

  const loadInvoices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = (await response.json()) as ProjectsResponse;
      if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudieron cargar las facturas.");

      const records = (data.projects ?? []).flatMap((project) =>
        (project.milestones ?? [])
          .filter((milestone) => Boolean(milestone.paypalInvoiceId))
          .map((milestone) => ({
            id: milestone.paypalInvoiceId as string,
            projectName: project.name,
            milestoneName: milestone.name,
            amount: Number(milestone.amount),
            paymentStatus: milestone.paymentStatus,
            paymentUrl: milestone.paypalInvoiceUrl,
            dueDate: milestone.endDate,
          })),
      );
      setInvoices(records);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las facturas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadInvoices(); }, [loadInvoices]);

  const filteredInvoices = invoices.filter((invoice) => statusFilter === "ALL" || invoiceCategory(invoice) === statusFilter);
  const filters: Array<{ id: InvoiceFilter; label: string; count: number }> = [
    { id: "ALL", label: "Todas", count: invoices.length },
    { id: "PENDING", label: "Pendientes de pago", count: invoices.filter((invoice) => invoiceCategory(invoice) === "PENDING").length },
    { id: "PAID", label: "Pagadas", count: invoices.filter((invoice) => invoiceCategory(invoice) === "PAID").length },
    { id: "CANCELLED", label: "Canceladas", count: invoices.filter((invoice) => invoiceCategory(invoice) === "CANCELLED").length },
  ];

  async function syncInvoice(id: string) {
    setSyncingId(id);
    setError("");
    setInvoices((current) => current.map((invoice) => invoice.id === id ? { ...invoice, syncError: undefined } : invoice));
    try {
      const response = await fetch(`/api/paypal/invoices/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        invoice?: { status?: string; recipientEmail?: string; paymentUrl?: string | null };
        synchronization?: { milestone?: { payment_status?: string } | null };
      };
      if (!response.ok || !data.success || !data.invoice) throw new Error(data.message ?? "No se pudo sincronizar con PayPal.");

      setInvoices((current) => current.map((invoice) => invoice.id === id ? {
        ...invoice,
        paypalStatus: data.invoice?.status,
        recipientEmail: data.invoice?.recipientEmail ?? invoice.recipientEmail,
        paymentUrl: data.invoice?.paymentUrl ?? invoice.paymentUrl,
        paymentStatus: data.synchronization?.milestone?.payment_status ?? invoice.paymentStatus,
      } : invoice));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se pudo sincronizar con PayPal.";
      setInvoices((current) => current.map((invoice) => invoice.id === id ? { ...invoice, syncError: message } : invoice));
    } finally {
      setSyncingId("");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-hito-navy">Facturas enviadas</h2>
          <p className="mt-1 text-sm text-hito-muted">Los datos salen de tus hitos guardados. Sincroniza una factura para consultar su estado actual en PayPal.</p>
        </div>
        <button type="button" onClick={() => void loadInvoices(true)} disabled={loading || refreshing}
          className="shrink-0 rounded-full border border-hito-border bg-white px-4 py-2 text-sm font-semibold text-hito-navy transition hover:bg-hito-tint disabled:opacity-60">
          {refreshing ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading && <p className="rounded-2xl border border-hito-border bg-white p-6 text-sm text-hito-muted">Cargando historial de facturas…</p>}

      {!loading && invoices.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar facturas por estado">
          {filters.map((filter) => (
            <button key={filter.id} type="button" aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${statusFilter === filter.id ? "border-hito-blue bg-hito-blue text-white" : "border-hito-border bg-white text-hito-muted hover:bg-hito-tint"}`}>
              {filter.label} <span className="ml-1 opacity-75">{filter.count}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="rounded-3xl border border-dashed border-hito-border bg-white p-8 text-center">
          <h3 className="font-semibold text-hito-navy">Todavía no has enviado facturas</h3>
          <p className="mt-2 text-sm text-hito-muted">Cuando envíes una factura para un hito, aparecerá aquí con su importe y estado.</p>
          <Link href="/invoices/new" className="mt-5 inline-flex rounded-full bg-hito-blue px-5 py-3 text-sm font-bold text-white hover:bg-hito-navy">Crear una factura</Link>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && filteredInvoices.length === 0 && (
        <p className="rounded-2xl border border-hito-border bg-white p-6 text-sm text-hito-muted">No hay facturas con este estado.</p>
      )}

      <div className="space-y-4">
        {filteredInvoices.map((invoice) => (
          <article key={invoice.id} className="rounded-3xl border border-hito-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-hito-muted">{invoice.projectName}</p>
                <h3 className="mt-1 text-lg font-bold text-hito-navy">{invoice.milestoneName}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${invoiceCategory(invoice) === "PAID" ? "bg-emerald-50 text-emerald-800" : invoiceCategory(invoice) === "CANCELLED" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"}`}>
                {paymentLabel(invoice)}
              </span>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-xs text-hito-muted">Importe</dt><dd className="mt-1 font-bold text-hito-ink">{formatMoney(invoice.amount)}</dd></div>
              <div><dt className="text-xs text-hito-muted">ID de PayPal</dt><dd className="mt-1 break-all text-sm font-medium text-hito-ink">{invoice.id}</dd></div>
              <div><dt className="text-xs text-hito-muted">Vencimiento del hito</dt><dd className="mt-1 text-sm font-medium text-hito-ink">{formatDate(invoice.dueDate)}</dd></div>
              {invoice.recipientEmail && <div><dt className="text-xs text-hito-muted">Destinatario</dt><dd className="mt-1 break-all text-sm font-medium text-hito-ink">{invoice.recipientEmail}</dd></div>}
              {invoice.paypalStatus && <div><dt className="text-xs text-hito-muted">Estado en PayPal</dt><dd className="mt-1 text-sm font-semibold text-hito-ink">{invoice.paypalStatus}</dd></div>}
            </dl>

            {invoice.syncError && <p role="alert" className="mt-4 text-sm text-rose-700">{invoice.syncError}</p>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-hito-border pt-4">
              <button type="button" onClick={() => void syncInvoice(invoice.id)} disabled={Boolean(syncingId)}
                className="rounded-full bg-hito-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-hito-navy disabled:opacity-60">
                {syncingId === invoice.id ? "Consultando PayPal…" : "Sincronizar estado"}
              </button>
              {invoice.paymentUrl && <a href={invoice.paymentUrl} target="_blank" rel="noreferrer" className="rounded-full border border-hito-border px-4 py-2 text-sm font-semibold text-hito-navy transition hover:bg-hito-tint">Abrir factura</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
