"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useTodayInGuayaquil } from "@/lib/useTodayInGuayaquil";
import { useLanguage } from "@/lib/language";

type Milestone = {
  name: string;
  description: string;
  percentage: number;
  amount: number;
  startDate: string;
  endDate: string;
};

type PlanResponse = {
  success: boolean;
  message?: string;
  project?: { id: string; name: string; status: string };
  plan?: { summary: string; milestones: Milestone[] };
};

function formatDate(value: string, language: "en" | "es") {
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-EC", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

export function PlanWorkspace() {
  const { t, language } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const today = useTodayInGuayaquil();
  const [startDateOverride, setStartDateOverride] = useState("");
  const startDate = startDateOverride || today;
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setPlanResult(null);
    setNotice("");
    setError("");

    const values = new FormData(event.currentTarget);
    const payload = {
      projectName: String(values.get("projectName") ?? "").trim() || undefined,
      projectDescription: String(values.get("projectDescription") ?? "").trim(),
      totalAmount: Number(values.get("totalAmount")),
      durationDays: Number(values.get("durationDays")),
      startDate: String(values.get("startDate") ?? ""),
      language,
    };

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as PlanResponse;

      if (!response.ok || !data.success || !data.project || !data.plan) {
        throw new Error(data.message ?? t("plan.errorCreate"));
      }

      setPlanResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("plan.errorUnexpected"));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDecision(action: "APPROVE" | "REJECT") {
    if (!planResult?.project) return;
    setIsUpdating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/projects/${planResult.project.id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { success: boolean; message?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? t("plan.errorUpdate"));
      }

      setNotice(data.message ?? t("plan.statusUpdated"));
      setPlanResult({
        ...planResult,
        project: {
          ...planResult.project,
          status: action === "APPROVE" ? "APPROVED" : "CANCELLED",
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("plan.errorUnexpected"));
    } finally {
      setIsUpdating(false);
    }
  }

  const pending = planResult?.project?.status === "PENDING_APPROVAL";
  const milestones = planResult?.plan?.milestones ?? [];

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[0.94fr_1.06fr]">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_20px_55px_rgba(20,54,117,0.09)] ring-1 ring-[#dce7fa] sm:p-7">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0878f9] via-[#6645ed] to-[#12bacb]" />
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-hito-violet">
              <span className="grid size-6 place-items-center rounded-lg bg-[#f1edff] text-[10px]">01</span>
              {t("plan.sectionEyebrow")}
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-hito-navy">{t("plan.formTitle")}</h2>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d7e5ff] bg-[#f5f9ff] px-2.5 py-1.5 text-[10px] font-extrabold text-[#315cb3] sm:text-xs">✦ Gemini AI</span>
        </div>
        <p className="mb-6 text-sm leading-6 text-hito-muted">
            {t("plan.formDescription")}
        </p>

        <form onSubmit={handleGenerate} className="space-y-4" aria-busy={isGenerating}>
          <div>
            <label htmlFor="projectName" className="mb-2 block text-[13px] font-bold text-hito-navy">
              {t("plan.projectName")} <span className="font-medium text-slate-400">{t("plan.optional")}</span>
            </label>
            <input id="projectName" name="projectName" maxLength={150} placeholder={t("plan.projectNamePlaceholder")} disabled={isGenerating}
              className="w-full rounded-2xl border border-[#dce5f3] bg-[#f9fbff] px-4 py-3.5 text-sm text-hito-ink outline-none transition placeholder:text-slate-400 hover:border-[#bdcfee] focus:border-hito-blue focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60" />
          </div>

          <div>
            <label htmlFor="projectDescription" className="mb-2 block text-[13px] font-bold text-hito-navy">
              {t("plan.description")}
            </label>
            <textarea id="projectDescription" name="projectDescription" required minLength={20} maxLength={3000} rows={5} disabled={isGenerating}
              placeholder={t("plan.descriptionPlaceholder")}
              className="w-full resize-y rounded-2xl border border-[#dce5f3] bg-[#f9fbff] px-4 py-3.5 text-sm leading-6 text-hito-ink outline-none transition placeholder:text-slate-400 hover:border-[#bdcfee] focus:border-hito-blue focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60" />
            <p className="mt-2 text-xs text-slate-500">{t("plan.scopeHint")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="totalAmount" className="mb-2 block text-[13px] font-bold text-hito-navy">{t("plan.totalBudget")}</label>
              <div className="flex rounded-2xl border border-[#dce5f3] bg-[#f9fbff] transition focus-within:border-hito-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-500/10">
                <span className="border-r border-[#e1e9f5] px-3.5 py-3.5 text-xs font-extrabold text-hito-blue">USD</span>
                <input id="totalAmount" name="totalAmount" type="number" required min="0.01" max="100000" step="0.01" placeholder="1200" disabled={isGenerating}
                  className="min-w-0 flex-1 rounded-r-2xl bg-transparent px-3 py-3.5 text-sm text-hito-ink outline-none placeholder:text-slate-400 disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="durationDays" className="mb-2 block text-[13px] font-bold text-hito-navy">{t("plan.duration")}</label>
              <div className="flex rounded-2xl border border-[#dce5f3] bg-[#f9fbff] transition focus-within:border-hito-blue focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-500/10">
                <input id="durationDays" name="durationDays" type="number" required min="1" max="365" defaultValue="30" disabled={isGenerating}
                  className="min-w-0 flex-1 rounded-l-2xl bg-transparent px-3 py-3.5 text-sm text-hito-ink outline-none disabled:opacity-60" />
                <span className="border-l border-[#e1e9f5] px-3.5 py-3.5 text-xs font-semibold text-hito-muted">{t("plan.days")}</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="mb-2 block text-[13px] font-bold text-hito-navy">{t("plan.startDate")}</label>
            <input id="startDate" name="startDate" type="date" required value={startDate} onChange={(event) => setStartDateOverride(event.target.value)} disabled={isGenerating}
              className="w-full rounded-2xl border border-[#dce5f3] bg-[#f9fbff] px-4 py-3.5 text-sm text-hito-ink outline-none transition hover:border-[#bdcfee] focus:border-hito-blue focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60" />
          </div>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button type="submit" disabled={isGenerating}
            className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#0878f9] via-[#385df0] to-[#7038ed] px-5 py-4 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(57,91,222,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(57,91,222,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/50 disabled:cursor-wait disabled:opacity-60">
            {isGenerating ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> {t("plan.generateLoading")}</> : <>{t("plan.generate")} <span aria-hidden="true" className="text-base transition-transform group-hover:translate-x-1">✦</span></>}
          </button>
        </form>
        <p className="mt-4 rounded-2xl bg-[#f5f8ff] px-3.5 py-3 text-[11px] leading-5 text-slate-500 ring-1 ring-[#e7edf8]">
          {t("plan.safetyNote")}
        </p>
      </section>

      <section aria-live="polite" className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white/85 p-5 shadow-[0_20px_55px_rgba(20,54,117,0.07)] ring-1 ring-[#dce7fa] sm:p-7">
        <div aria-hidden="true" className="absolute -right-24 -top-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(111,57,237,0.1),transparent_68%)]" />
        {!planResult && !isGenerating && (
          <div className="relative flex min-h-[31rem] flex-col items-center justify-center text-center">
            <div className="relative mb-7 grid size-28 place-items-center rounded-[2rem] border border-white bg-gradient-to-br from-[#e4f2ff] via-[#f0ecff] to-[#e3fbfb] shadow-[0_16px_45px_rgba(43,79,152,0.1)] ring-1 ring-[#e2ebfb]">
              <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className="size-16"><path d="M12 48h40M16 42V27m16 15V16m16 26V22" stroke="#c5d4ee" strokeWidth="5" strokeLinecap="round"/><path d="m13 39 14-13 12 5 14-17" stroke="url(#hito-flow)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="53" cy="14" r="6" fill="#6f39ed"/><defs><linearGradient id="hito-flow" x1="13" y1="36" x2="54" y2="14" gradientUnits="userSpaceOnUse"><stop stopColor="#12bacb"/><stop offset=".48" stopColor="#0878f9"/><stop offset="1" stopColor="#6f39ed"/></linearGradient></defs></svg>
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-hito-violet">{t("plan.nextStep")}</p>
            <h2 className="mt-2 text-center text-xl font-black text-hito-navy">{t("plan.placeholderTitle")}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-hito-muted">{t("plan.placeholderDescription")}</p>
            <div className="mt-6 grid w-full max-w-sm grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#f4f8ff] p-3 ring-1 ring-[#e3ecfb]"><span className="mx-auto grid size-7 place-items-center rounded-xl bg-blue-100 text-xs font-black text-hito-blue">1</span><span className="mt-2 block text-[10px] font-bold text-slate-600">{t("plan.describe")}</span></div>
              <div className="rounded-2xl bg-[#f8f5ff] p-3 ring-1 ring-[#ece5ff]"><span className="mx-auto grid size-7 place-items-center rounded-xl bg-violet-100 text-xs font-black text-hito-violet">2</span><span className="mt-2 block text-[10px] font-bold text-slate-600">{t("plan.review")}</span></div>
              <div className="rounded-2xl bg-[#f1fbfb] p-3 ring-1 ring-[#def3f4]"><span className="mx-auto grid size-7 place-items-center rounded-xl bg-cyan-100 text-xs font-black text-cyan-700">3</span><span className="mt-2 block text-[10px] font-bold text-slate-600">{t("plan.approve")}</span></div>
            </div>
          </div>
        )}
        {isGenerating && (
          <div className="relative flex min-h-[31rem] flex-col items-center justify-center text-center">
            <div className="mb-6 grid size-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-[#e5f2ff] via-[#f1edff] to-[#e5fbfb] text-3xl text-hito-violet"><span className="animate-pulse">✦</span></div>
            <h2 className="text-lg font-bold text-hito-navy">{t("plan.loadingTitle")}</h2>
            <p className="mt-2 text-sm text-hito-muted">{t("plan.loadingDescription")}</p>
            <div className="mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-[#e9eef8]"><div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-hito-blue to-hito-violet" /></div>
          </div>
        )}
        {planResult?.plan && planResult.project && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-hito-violet"><span className="size-1.5 rounded-full bg-hito-violet" />{t("plan.geminiProposal")}</p>
                <h2 className="mt-3 text-xl font-black text-hito-navy">{planResult.project.name}</h2>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {planResult.project.status === "PENDING_APPROVAL" ? t("plan.statusPending") : planResult.project.status === "APPROVED" ? t("plan.statusApproved") : t("plan.statusRejected")}
              </span>
            </div>
            <p className="mt-4 rounded-2xl bg-[#f7f9ff] p-4 text-sm leading-6 text-slate-600 ring-1 ring-[#e8eef8]">{planResult.plan.summary}</p>

            <ol className="mt-6 space-y-3">
              {milestones.map((milestone, index) => (
                <li key={`${milestone.name}-${index}`} className="overflow-hidden rounded-2xl border border-[#e2eafa] bg-white p-4 shadow-sm shadow-blue-950/[0.025]">
                  <div className={`-mx-4 -mt-4 mb-4 h-1 bg-gradient-to-r ${index === 1 ? "from-[#6338ed] to-[#a579ff]" : index === 2 ? "from-[#12bacb] to-[#0878f9]" : "from-[#0878f9] to-[#53a3ff]"}`} />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-hito-violet">{index + 1}</span>
                      <div>
                        <h3 className="font-semibold text-hito-ink">{milestone.name}</h3>
                        <p className="mt-1 text-sm leading-5 text-hito-muted">{milestone.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-hito-navy">USD {milestone.amount.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-hito-border pt-3 text-xs text-hito-muted">
                    <span>{milestone.percentage}% {t("plan.percentOfBudget")}</span>
                    <span>{formatDate(milestone.startDate, language)} – {formatDate(milestone.endDate, language)}</span>
                  </div>
                  <div role="img" aria-label={t("plan.milestoneAssignedPercent", { percent: milestone.percentage })} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf2fa]">
                    <div className="h-full rounded-full bg-gradient-to-r from-hito-blue to-hito-violet" style={{ width: `${Math.min(milestone.percentage, 100)}%` }} />
                  </div>
                </li>
              ))}
            </ol>

            {notice && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{notice}</p>}
            {pending && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={isUpdating} onClick={() => handleDecision("APPROVE")}
                  className="flex-1 rounded-full bg-gradient-to-r from-[#0878f9] to-[#315cf1] px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-blue-700/15 transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60">
                  {isUpdating ? t("plan.saving") : t("plan.approvePlan")}
                </button>
                <button type="button" disabled={isUpdating} onClick={() => handleDecision("REJECT")}
                  className="rounded-full border border-[#dce5f3] bg-white px-5 py-3.5 text-sm font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60">
                  {t("plan.reject")}
                </button>
              </div>
            )}
            {planResult.project.status === "APPROVED" && (
              <Link href="/invoices/new" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#6338ed] to-[#8b4dec] px-5 py-3.5 text-sm font-extrabold text-white shadow-md shadow-violet-700/15 transition hover:-translate-y-0.5 hover:shadow-lg">
                {t("plan.continueInvoicing")} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
