"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

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

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00.000Z`),
  );
}

export function PlanWorkspace() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [startDate, setStartDate] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setStartDate(localDate());
  }, []);

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
    };

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as PlanResponse;

      if (!response.ok || !data.success || !data.project || !data.plan) {
        throw new Error(data.message ?? "No se pudo generar el plan.");
      }

      setPlanResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
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
        throw new Error(data.message ?? "No se pudo actualizar el proyecto.");
      }

      setNotice(data.message ?? "Estado actualizado.");
      setPlanResult({
        ...planResult,
        project: {
          ...planResult.project,
          status: action === "APPROVE" ? "APPROVED" : "CANCELLED",
        },
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
    } finally {
      setIsUpdating(false);
    }
  }

  const pending = planResult?.project?.status === "PENDING_APPROVAL";
  const milestones = planResult?.plan?.milestones ?? [];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-hito-border bg-white p-6 shadow-xl shadow-blue-950/[0.06] sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-hito-violet">Nuevo proyecto</p>
          <h2 className="mt-1 text-xl font-bold text-hito-navy">Cuéntanos el trabajo</h2>
          <p className="mt-2 text-sm leading-6 text-hito-muted">
            Gemini propondrá hasta tres entregables con fechas e importes. Puedes
            revisar la propuesta antes de aprobarla.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5" aria-busy={isGenerating}>
          <div>
            <label htmlFor="projectName" className="mb-2 block text-sm font-semibold text-hito-ink">
              Nombre del proyecto <span className="font-normal text-hito-muted">(opcional)</span>
            </label>
            <input id="projectName" name="projectName" maxLength={150} placeholder="Tienda en línea para Aurora" disabled={isGenerating}
              className="w-full rounded-xl border border-hito-border bg-white px-4 py-3 text-sm text-hito-ink outline-none placeholder:text-slate-400 focus:border-hito-blue focus:ring-2 focus:ring-sky-500/15 disabled:opacity-60" />
          </div>

          <div>
            <label htmlFor="projectDescription" className="mb-2 block text-sm font-semibold text-hito-ink">
              Descripción del trabajo
            </label>
            <textarea id="projectDescription" name="projectDescription" required minLength={20} maxLength={3000} rows={5} disabled={isGenerating}
              placeholder="Describe el trabajo, sus entregables y cualquier fecha importante..."
              className="w-full resize-y rounded-xl border border-hito-border bg-white px-4 py-3 text-sm leading-6 text-hito-ink outline-none placeholder:text-slate-400 focus:border-hito-blue focus:ring-2 focus:ring-sky-500/15 disabled:opacity-60" />
            <p className="mt-1 text-xs text-hito-muted">Incluye el alcance que acordaste con tu cliente.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="totalAmount" className="mb-2 block text-sm font-semibold text-hito-ink">Presupuesto total</label>
              <div className="flex rounded-xl border border-hito-border bg-white focus-within:border-hito-blue">
                <span className="border-r border-hito-border px-3 py-3 text-xs font-bold text-hito-blue">USD</span>
                <input id="totalAmount" name="totalAmount" type="number" required min="0.01" max="100000" step="0.01" placeholder="1200" disabled={isGenerating}
                  className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-3 text-sm text-hito-ink outline-none placeholder:text-slate-400 disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="durationDays" className="mb-2 block text-sm font-semibold text-hito-ink">Duración</label>
              <div className="flex rounded-xl border border-hito-border bg-white focus-within:border-hito-blue">
                <input id="durationDays" name="durationDays" type="number" required min="1" max="365" defaultValue="30" disabled={isGenerating}
                  className="min-w-0 flex-1 rounded-l-xl bg-transparent px-3 py-3 text-sm text-hito-ink outline-none disabled:opacity-60" />
                <span className="border-l border-hito-border px-3 py-3 text-xs text-hito-muted">días</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-hito-ink">Fecha de inicio</label>
            <input id="startDate" name="startDate" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={isGenerating}
              className="w-full rounded-xl border border-hito-border bg-white px-4 py-3 text-sm text-hito-ink outline-none focus:border-hito-blue focus:ring-2 focus:ring-sky-500/15 disabled:opacity-60" />
          </div>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button type="submit" disabled={isGenerating}
            className="w-full rounded-full bg-hito-blue px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:bg-hito-navy focus:outline-none focus:ring-4 focus:ring-sky-500/20 disabled:cursor-wait disabled:opacity-60">
            {isGenerating ? "Gemini está preparando el plan…" : "Generar propuesta con Gemini"}
          </button>
        </form>
      </section>

      <section aria-live="polite" className="rounded-3xl border border-hito-border bg-white/80 p-6 shadow-xl shadow-blue-950/[0.04] sm:p-8">
        {!planResult && !isGenerating && (
          <div className="flex min-h-80 flex-col justify-center">
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-violet-100 text-xl font-bold text-hito-violet">AI</div>
            <h2 className="text-xl font-semibold text-hito-navy">Tu propuesta aparecerá aquí</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-hito-muted">
              Los hitos deben sumar el presupuesto y quedar dentro del periodo. Revisa cada fecha e importe antes de aprobar.
            </p>
          </div>
        )}
        {isGenerating && (
          <div className="flex min-h-80 flex-col items-center justify-center text-center">
            <div className="mb-5 size-10 animate-pulse rounded-full bg-hito-violet/30" />
            <h2 className="text-lg font-semibold text-hito-navy">Preparando una propuesta revisable</h2>
            <p className="mt-2 text-sm text-hito-muted">Validando hitos, presupuesto y fechas.</p>
          </div>
        )}
        {planResult?.plan && planResult.project && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-hito-violet">Propuesta de Gemini</p>
                <h2 className="mt-2 text-xl font-bold text-hito-navy">{planResult.project.name}</h2>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {planResult.project.status === "PENDING_APPROVAL" ? "Pendiente de revisión" : planResult.project.status === "APPROVED" ? "Aprobado" : "Rechazado"}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-hito-muted">{planResult.plan.summary}</p>

            <ol className="mt-6 space-y-3">
              {milestones.map((milestone, index) => (
                <li key={`${milestone.name}-${index}`} className="rounded-2xl border border-hito-border bg-white p-4">
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
                    <span>{milestone.percentage}% del presupuesto</span>
                    <span>{formatDate(milestone.startDate)} – {formatDate(milestone.endDate)}</span>
                  </div>
                </li>
              ))}
            </ol>

            {notice && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{notice}</p>}
            {pending && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" disabled={isUpdating} onClick={() => handleDecision("APPROVE")}
                  className="flex-1 rounded-full bg-hito-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-hito-navy disabled:opacity-60">
                  {isUpdating ? "Guardando…" : "Aprobar plan"}
                </button>
                <button type="button" disabled={isUpdating} onClick={() => handleDecision("REJECT")}
                  className="rounded-full border border-hito-border px-5 py-3 text-sm font-semibold text-hito-muted transition hover:bg-slate-50 disabled:opacity-60">
                  Rechazar
                </button>
              </div>
            )}
            {planResult.project.status === "APPROVED" && (
              <Link href="/invoices/new" className="mt-6 inline-flex rounded-full bg-hito-violet px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700">
                Continuar a facturación
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
