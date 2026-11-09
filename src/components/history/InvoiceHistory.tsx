"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";

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

function formatMoney(value: number, language: "en" | "es") {
  return new Intl.NumberFormat(language === "en" ? "en-US" : "es-EC", { style: "currency", currency: "USD" }).format(value);
}

function formatDate(value: string, language: "en" | "es") {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-EC", { dateStyle: "medium" }).format(new Date(value));
}

function invoiceCategory(invoice: InvoiceRecord): Exclude<InvoiceFilter, "ALL"> {
  const remoteStatus = invoice.paypalStatus?.toUpperCase();
  if (invoice.paymentStatus === "PAID" || remoteStatus === "PAID") return "PAID";
  const statuses = [remoteStatus, invoice.paymentStatus?.toUpperCase()];
  if (statuses.some((status) => ["CANCELLED", "VOIDED"].includes(status ?? ""))) return "CANCELLED";
  return "PENDING";
}

function paymentLabel(invoice: InvoiceRecord, t: (key: import("@/lib/translations").TranslationKey) => string) {
  if (invoiceCategory(invoice) === "PAID") return t("invoices.paidLabel");
  if (invoiceCategory(invoice) === "CANCELLED") return t("invoices.cancelledLabel");
  return t("invoices.unpaidLabel");
}

async function fetchInvoices() {
  const response = await fetch("/api/projects", { cache: "no-store" });
  const data = (await response.json()) as ProjectsResponse;
  if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudieron cargar las facturas.");

  return (data.projects ?? []).flatMap((project) =>
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
}

export function InvoiceHistory() {
  const { t, language } = useLanguage();
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
      setInvoices(await fetchInvoices());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("api.loadInvoicesError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchInvoices()
      .then((records) => { if (active) setInvoices(records); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : t("api.loadInvoicesError")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredInvoices = invoices.filter((invoice) => statusFilter === "ALL" || invoiceCategory(invoice) === statusFilter);
  const filters: Array<{ id: InvoiceFilter; label: string; count: number }> = [
    { id: "ALL", label: t("invoices.all"), count: invoices.length },
    { id: "PENDING", label: t("invoices.pending"), count: invoices.filter((invoice) => invoiceCategory(invoice) === "PENDING").length },
    { id: "PAID", label: t("invoices.paid"), count: invoices.filter((invoice) => invoiceCategory(invoice) === "PAID").length },
    { id: "CANCELLED", label: t("invoices.cancelled"), count: invoices.filter((invoice) => invoiceCategory(invoice) === "CANCELLED").length },
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
      const message = cause instanceof Error ? cause.message : t("api.syncInvoiceError");
      setInvoices((current) => current.map((invoice) => invoice.id === id ? { ...invoice, syncError: message } : invoice));
    } finally {
      setSyncingId("");
    }
  }

  return (
    <div id="historial-facturas" className="scroll-mt-32">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-hito-violet">{t("invoices.center")}</p>
          <h2 className="mt-1 text-xl font-black text-hito-navy">{t("invoices.sent")}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{t("invoices.description")}</p>
        </div>
        <button type="button" onClick={() => void loadInvoices(true)} disabled={loading || refreshing}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d5e1f6] bg-white/85 px-4 py-2.5 text-xs font-extrabold text-hito-navy shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c6f5] hover:bg-white disabled:opacity-60">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`size-4 ${refreshing ? "animate-spin" : ""}`}><path d="M16.5 8A6.7 6.7 0 0 0 4.8 5.2L3.5 6.5M3.5 6.5V3.8m0 2.7h2.7m-2.7 3.5a6.7 6.7 0 0 0 11.7 2.8l1.3-1.3m0 0v2.7m0-2.7h-2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {refreshing ? t("invoices.refreshing") : t("invoices.refresh")}
        </button>
      </div>

      {!loading && !error && invoices.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: t("invoices.registered"), count: invoices.length, panel: "from-white to-[#edf4ff]", tone: "text-hito-navy" },
            { label: t("invoices.pending"), count: invoices.filter((invoice) => invoiceCategory(invoice) === "PENDING").length, panel: "from-white to-[#fff8eb]", tone: "text-amber-700" },
            { label: t("invoices.paid"), count: invoices.filter((invoice) => invoiceCategory(invoice) === "PAID").length, panel: "from-white to-[#effaf5]", tone: "text-emerald-700" },
          ].map((item) => (
            <div key={item.label} className={`relative overflow-hidden rounded-2xl border border-white bg-gradient-to-br ${item.panel} px-5 py-4 shadow-[0_10px_28px_rgba(25,56,118,0.06)] ring-1 ring-[#e2eafa]`}>
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              <p className={`mt-1 text-3xl font-black tracking-tight ${item.tone}`}>{item.count}</p>
            </div>
          ))}
        </div>
      )}

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading && <p className="rounded-2xl border border-hito-border bg-white p-6 text-sm text-hito-muted">{t("invoices.loading")}</p>}

      {!loading && invoices.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("invoices.filterAria")}>
          {filters.map((filter) => (
            <button key={filter.id} type="button" aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold transition sm:text-sm ${statusFilter === filter.id ? "border-transparent bg-gradient-to-r from-[#0878f9] to-[#7038ed] text-white shadow-md shadow-blue-700/15" : "border-[#dce5f3] bg-white/85 text-slate-600 hover:border-[#c4d5f0] hover:bg-white"}`}>
              {filter.label} <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusFilter === filter.id ? "bg-white/20 text-white" : "bg-[#f0f4fb] text-slate-500"}`}>{filter.count}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && invoices.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-[#cad8ef] bg-white/80 p-9 text-center shadow-sm">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#e8f4ff] to-[#f2ecff] text-xl font-black text-hito-violet">$</span>
          <h3 className="mt-4 font-semibold text-hito-navy">{t("invoices.emptyTitle")}</h3>
          <p className="mt-2 text-sm text-hito-muted">{t("invoices.emptyDescription")}</p>
          <Link href="/invoices/new" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#0878f9] to-[#7038ed] px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-700/15 transition hover:-translate-y-0.5">{t("invoices.create")}</Link>
        </div>
      )}

      {!loading && !error && invoices.length > 0 && filteredInvoices.length === 0 && (
        <p className="rounded-2xl border border-[#dce5f3] bg-white/85 p-6 text-sm text-hito-muted">{t("invoices.emptyFilter")}</p>
      )}

      <div className="space-y-4">
        {filteredInvoices.map((invoice) => (
          <article key={invoice.id} className="relative overflow-hidden rounded-[1.6rem] border border-white bg-white/90 p-5 shadow-[0_16px_42px_rgba(23,54,113,0.07)] ring-1 ring-[#e2eafa] transition hover:shadow-[0_20px_50px_rgba(23,54,113,0.1)] sm:p-6">
            <div className={`absolute inset-x-0 top-0 h-1 ${invoiceCategory(invoice) === "PAID" ? "bg-gradient-to-r from-[#12bacb] to-[#0878f9]" : invoiceCategory(invoice) === "CANCELLED" ? "bg-slate-300" : "bg-gradient-to-r from-[#0878f9] via-[#7041ed] to-[#12bacb]"}`} />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-hito-muted">{invoice.projectName}</p>
                <h3 className="mt-1 text-lg font-bold text-hito-navy">{invoice.milestoneName}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1.5 text-xs font-extrabold ${invoiceCategory(invoice) === "PAID" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : invoiceCategory(invoice) === "CANCELLED" ? "border-slate-200 bg-slate-100 text-slate-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                {paymentLabel(invoice, t)}
              </span>
            </div>

            <dl className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-[#f5f8ff] px-3.5 py-3 ring-1 ring-[#e8eef8]"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("invoices.amount")}</dt><dd className="mt-1 font-black text-hito-navy">{formatMoney(invoice.amount, language)}</dd></div>
              <div className="rounded-xl bg-[#f7f9ff] px-3.5 py-3 ring-1 ring-[#e8eef8]"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("invoices.paypalId")}</dt><dd className="mt-1 break-all text-xs font-semibold text-hito-ink">{invoice.id}</dd></div>
              <div className="rounded-xl bg-[#f8f5ff] px-3.5 py-3 ring-1 ring-[#eee8fb]"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("invoices.dueDate")}</dt><dd className="mt-1 text-sm font-semibold text-hito-ink">{formatDate(invoice.dueDate, language)}</dd></div>
              {invoice.recipientEmail && <div className="rounded-xl bg-[#f1fbfb] px-3.5 py-3 ring-1 ring-[#def3f4]"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("invoices.recipient")}</dt><dd className="mt-1 break-all text-xs font-semibold text-hito-ink">{invoice.recipientEmail}</dd></div>}
              {invoice.paypalStatus && <div className="rounded-xl bg-[#f1fbfb] px-3.5 py-3 ring-1 ring-[#def3f4]"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t("invoices.paypalStatus")}</dt><dd className="mt-1 text-sm font-extrabold text-hito-ink">{invoice.paypalStatus}</dd></div>}
            </dl>

            {invoice.syncError && <p role="alert" className="mt-4 text-sm text-rose-700">{invoice.syncError}</p>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e8edf6] pt-4">
              <button type="button" onClick={() => void syncInvoice(invoice.id)} disabled={Boolean(syncingId)}
                className="rounded-full bg-gradient-to-r from-[#0878f9] to-[#315cf1] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-blue-700/15 transition hover:-translate-y-0.5 disabled:opacity-60">
                {syncingId === invoice.id ? t("invoices.syncing") : t("invoices.sync")}
              </button>
              {invoice.paymentUrl && <a href={invoice.paymentUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#dce5f3] bg-white px-4 py-2.5 text-xs font-bold text-hito-navy transition hover:border-[#b4caee] hover:bg-[#f4f8ff]">{t("invoices.open")}</a>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
