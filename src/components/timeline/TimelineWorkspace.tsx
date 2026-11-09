"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useTodayInGuayaquil } from "@/lib/useTodayInGuayaquil";

const BryntumTimelineCanvas = dynamic(
  () => import("./BryntumTimelineCanvas").then((module) => module.BryntumTimelineCanvas),
  {
    ssr: false,
    loading: () => <div className="h-[360px] animate-pulse rounded-2xl bg-hito-tint" aria-label="Cargando cronograma" />,
  }
);

type Project = {
  id: string;
  name: string;
  total_amount: number | string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;
  milestones: Array<{
    id: string;
    name: string;
    amount: number | string;
    startDate: string;
    endDate: string;
    paymentStatus: string;
  }>;
};

type RescheduleProposal = {
  projectId: string;
  asOf: string;
  summary: string;
  milestones: Array<{
    id: string;
    name: string;
    paymentStatus: string;
    oldStartDate: string;
    oldEndDate: string;
    startDate: string;
    endDate: string;
    reason: string;
  }>;
};

const projectStatusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Pendiente de aprobación",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(new Date(year, month - 1, day));
}

function statusClass(status: string) {
  if (status === "APPROVED" || status === "COMPLETED") return "bg-emerald-50 text-emerald-800";
  if (status === "IN_PROGRESS") return "bg-sky-50 text-sky-800";
  if (status === "PENDING_APPROVAL") return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

async function fetchProjects() {
  const response = await fetch("/api/projects", { cache: "no-store" });
  const data = await response.json() as { success: boolean; message?: string; projects?: Project[] };
  if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudieron cargar los proyectos.");
  return data.projects ?? [];
}

export function TimelineWorkspace() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState<RescheduleProposal | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalApplying, setProposalApplying] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetchProjects()
      .then((nextProjects) => {
        if (!active) return;
        setProjects(nextProjects);
        setSelectedProjectId((current) => current && nextProjects.some((project) => project.id === current)
          ? current
          : (nextProjects.find((project) => project.status !== "CANCELLED") ?? nextProjects[0])?.id ?? "");
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  async function refreshProjects() {
    setRefreshing(true);
    setError("");
    try {
      const nextProjects = await fetchProjects();
      setProjects(nextProjects);
      setSelectedProjectId((current) => current && nextProjects.some((project) => project.id === current)
        ? current
        : (nextProjects.find((project) => project.status !== "CANCELLED") ?? nextProjects[0])?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los proyectos.");
    } finally {
      setRefreshing(false);
    }
  }

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const paidMilestones = selectedProject?.milestones.filter((milestone) => milestone.paymentStatus === "PAID").length ?? 0;
  const today = useTodayInGuayaquil();
  const overdueMilestones = selectedProject?.milestones.filter(
    (milestone) => milestone.endDate.slice(0, 10) < today && milestone.paymentStatus !== "PAID"
  ) ?? [];
  const canReschedule = selectedProject && ["APPROVED", "IN_PROGRESS"].includes(selectedProject.status);

  async function generateRescheduleProposal() {
    if (!selectedProject) return;
    setProposalLoading(true);
    setProposal(null);
    setRescheduleMessage("");
    setError("");
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/reschedule-suggestion`, { method: "POST" });
      const data = await response.json() as { success: boolean; message?: string; proposal?: RescheduleProposal };
      if (!response.ok || !data.success || !data.proposal) {
        throw new Error(data.message ?? "No se pudo generar la propuesta.");
      }
      setProposal(data.proposal);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo generar la propuesta.");
    } finally {
      setProposalLoading(false);
    }
  }

  async function applyRescheduleProposal() {
    if (!proposal || proposal.projectId !== selectedProjectId) return;
    setProposalApplying(true);
    setError("");
    setRescheduleMessage("");
    try {
      const response = await fetch(`/api/projects/${proposal.projectId}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestones: proposal.milestones.map(({ id, oldStartDate, oldEndDate, startDate, endDate }) => ({
            id, oldStartDate, oldEndDate, startDate, endDate,
          })),
        }),
      });
      const data = await response.json() as { success: boolean; message?: string };
      if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudo aplicar la propuesta.");
      setProposal(null);
      setRescheduleMessage(data.message ?? "Se aplicó la reprogramación.");
      await refreshProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo aplicar la propuesta.");
    } finally {
      setProposalApplying(false);
    }
  }

  return (
    <section id="cronograma" className="scroll-mt-32 space-y-6" aria-label="Cronograma de hitos">
      <div className="relative overflow-hidden rounded-3xl border border-hito-border bg-white p-5 shadow-[0_16px_45px_rgba(0,46,128,0.07)] sm:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-[#edf4ff] to-transparent sm:block" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[min(100%,20rem)] flex-1">
            <label htmlFor="timeline-project" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-hito-muted">Proyecto activo</label>
          <select
            id="timeline-project"
            value={selectedProjectId}
            onChange={(event) => {
              setSelectedProjectId(event.target.value);
              setProposal(null);
              setRescheduleMessage("");
              setError("");
            }}
            disabled={loading || projects.length === 0}
            className="w-full rounded-2xl border border-hito-border bg-white px-4 py-3.5 text-sm font-semibold text-hito-ink shadow-sm outline-none transition focus:border-hito-blue focus:ring-4 focus:ring-[#0878f9]/15 sm:max-w-2xl"
          >
            {projects.length === 0 && <option value="">Sin proyectos disponibles</option>}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => void refreshProjects()}
          disabled={loading || refreshing}
          className="rounded-full bg-gradient-to-r from-hito-blue to-hito-violet px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-wait disabled:opacity-60"
        >
          {refreshing ? "Actualizando…" : "Actualizar cronograma"}
        </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
      {rescheduleMessage && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{rescheduleMessage}</p>}

      {selectedProject && !loading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="relative overflow-hidden rounded-2xl border border-[#d9e3f4] bg-gradient-to-br from-white to-[#edf4ff] p-5 shadow-[0_8px_24px_rgba(0,46,128,0.05)]">
            <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-hito-blue" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hito-muted">Estado</p>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${statusClass(selectedProject.status)}`}>
              {projectStatusLabels[selectedProject.status] ?? selectedProject.status}
            </span>
          </article>
          <article className="rounded-2xl border border-hito-border bg-white p-5 shadow-[0_8px_24px_rgba(0,46,128,0.05)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hito-muted">Hitos del plan</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-hito-navy">{selectedProject.milestones.length}</p>
          </article>
          <article className="rounded-2xl border border-[#bdebf0] bg-gradient-to-br from-white to-[#effcfd] p-5 shadow-[0_8px_24px_rgba(18,186,203,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hito-muted">Hitos pagados</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#078b9b]">{paidMilestones}<span className="ml-2 text-sm font-semibold text-hito-muted">de {selectedProject.milestones.length}</span></p>
          </article>
          <article className="rounded-2xl border border-[#e3dcfb] bg-gradient-to-br from-white to-[#f6f2ff] p-5 shadow-[0_8px_24px_rgba(111,57,237,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hito-muted">Periodo del proyecto</p>
            <p className="mt-2 text-sm font-bold leading-6 text-hito-navy">{formatDate(selectedProject.start_date)}<span className="mx-1.5 text-hito-violet">→</span>{formatDate(selectedProject.end_date)}</p>
          </article>
        </div>
      )}

      {canReschedule && overdueMilestones.length > 0 && !proposal && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-[#f6f2ff] p-5 shadow-sm sm:p-6" aria-label="Hitos vencidos">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-lg text-amber-800" aria-hidden="true">!</span>
            <div>
              <h2 className="font-bold text-hito-navy">Hay {overdueMilestones.length} {overdueMilestones.length === 1 ? "hito vencido" : "hitos vencidos"} sin pago</h2>
              <p className="mt-1 text-sm text-hito-muted">Pide a Gemini una propuesta de nuevas fechas; el cronograma original no cambia hasta que la aceptes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void generateRescheduleProposal()}
            disabled={proposalLoading}
            className="rounded-full bg-gradient-to-r from-hito-blue to-hito-violet px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
          >
            {proposalLoading ? "Preparando propuesta…" : "Proponer nuevas fechas"}
          </button>
        </section>
      )}

      {proposal && proposal.projectId === selectedProjectId && (
        <section className="rounded-3xl border border-[#d9e3f4] bg-white p-5 shadow-[0_14px_40px_rgba(0,46,128,0.07)] sm:p-6" aria-label="Propuesta de reprogramación">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-hito-violet">Propuesta de Gemini · {formatDate(proposal.asOf)}</p>
              <h2 className="mt-1 text-xl font-bold text-hito-navy">Revisa las nuevas fechas</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-hito-muted">{proposal.summary}</p>
            </div>
            <span className="rounded-full bg-[#f3efff] px-3 py-1.5 text-xs font-bold text-hito-violet">Pendiente de tu aprobación</span>
          </div>

          <div className="mt-5 grid gap-3">
            {proposal.milestones.map((milestone) => (
              <article key={milestone.id} className="grid gap-3 rounded-2xl border border-hito-border bg-[#f9fbff] p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
                <div>
                  <h3 className="font-bold text-hito-navy">{milestone.name}</h3>
                  <p className="mt-1 text-xs text-hito-muted">{milestone.paymentStatus === "UNPAID" ? "Factura pendiente" : "Sin factura"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-hito-muted">Fechas actuales</p>
                  <p className="mt-1 text-sm font-semibold text-hito-ink">{formatDate(milestone.oldStartDate)} → {formatDate(milestone.oldEndDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-hito-violet">Propuesta</p>
                  <p className="mt-1 text-sm font-bold text-hito-navy">{formatDate(milestone.startDate)} → {formatDate(milestone.endDate)}</p>
                  <p className="mt-1 text-xs leading-5 text-hito-muted">{milestone.reason}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setProposal(null)} disabled={proposalApplying} className="rounded-full border border-hito-border px-5 py-3 text-sm font-semibold text-hito-navy transition hover:bg-hito-tint disabled:opacity-60">Descartar</button>
            <button type="button" onClick={() => void applyRescheduleProposal()} disabled={proposalApplying} className="rounded-full bg-gradient-to-r from-hito-blue to-hito-violet px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-900/15 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{proposalApplying ? "Aplicando…" : "Aceptar y actualizar cronograma"}</button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[28px] border border-hito-border bg-white p-4 shadow-[0_22px_65px_rgba(0,46,128,0.09)] sm:p-7" aria-label="Gráfico Gantt">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-hito-violet">Vista de planificación</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-hito-navy">Cronograma de hitos</h2>
            <p className="mt-1 text-sm text-hito-muted">Compara fechas, duración y avance de pago en una sola vista.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-[#f7f9ff] px-4 py-3 text-xs font-semibold text-hito-muted">
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-hito-violet" />Pendiente</span>
            <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-hito-cyan" />Pagado</span>
            {selectedProject && <span className="rounded-full border border-hito-border bg-white px-3 py-1 text-hito-navy">Solo lectura</span>}
          </div>
        </div>

        {loading ? (
          <div className="h-[360px] animate-pulse rounded-2xl bg-hito-tint" aria-label="Cargando proyectos" />
        ) : selectedProject && selectedProject.milestones.length > 0 ? (
          <BryntumTimelineCanvas key={selectedProject.id} project={selectedProject} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-hito-border bg-hito-tint/50 px-6 text-center">
            <h3 className="text-base font-bold text-hito-navy">{selectedProject ? "Este proyecto aún no tiene hitos" : "Aún no hay proyectos"}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-hito-muted">Crea un plan para generar los hitos y sus fechas; después aparecerán aquí en el cronograma.</p>
          </div>
        )}
      </section>
    </section>
  );
}
