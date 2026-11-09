"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  total_amount: number | string;
  duration_days: number;
  start_date: string;
  end_date: string;
  ai_summary: string;
  status: string;
  created_at: string;
  milestones: Array<{
    id: string;
    name: string;
    amount: number | string;
    percentage: number | string;
    startDate: string;
    endDate: string;
    status: string;
    paymentStatus: string;
    paypalInvoiceId: string | null;
  }>;
};

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: "Pendiente de aprobación",
  APPROVED: "Aprobado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Rechazado",
};

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(value));
}

function statusStyle(status: string) {
  if (status === "APPROVED" || status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "PENDING_APPROVAL") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "IN_PROGRESS") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

async function fetchProjects() {
  const response = await fetch("/api/projects", { cache: "no-store" });
  const data = (await response.json()) as { success: boolean; message?: string; projects?: Project[] };
  if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudo cargar el historial.");
  return data.projects ?? [];
}

export function ProjectHistory() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [workingProjectId, setWorkingProjectId] = useState("");

  const loadProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setProjects(await fetchProjects());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchProjects()
      .then((records) => { if (active) setProjects(records); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "No se pudo cargar el historial."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function decideProject(id: string, action: "APPROVE" | "REJECT") {
    setWorkingProjectId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/projects/${id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { success: boolean; message?: string };
      if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudo actualizar el proyecto.");
      setProjects((current) => current.map((project) => project.id === id
        ? { ...project, status: action === "APPROVE" ? "APPROVED" : "CANCELLED" }
        : project));
      setNotice(data.message ?? "Estado del proyecto actualizado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el proyecto.");
    } finally {
      setWorkingProjectId("");
    }
  }

  const totals = useMemo(() => ({
    total: projects.length,
    approved: projects.filter((project) => ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(project.status)).length,
    pending: projects.filter((project) => project.status === "PENDING_APPROVAL").length,
  }), [projects]);

  const filteredProjects = useMemo(() => {
    if (statusFilter === "ALL") return projects;
    if (statusFilter === "APPROVED") {
      return projects.filter((project) => ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(project.status));
    }
    return projects.filter((project) => project.status === statusFilter);
  }, [projects, statusFilter]);

  const filters = [
    { id: "ALL", label: "Todos", count: projects.length },
    { id: "PENDING_APPROVAL", label: "Pendientes", count: totals.pending },
    { id: "APPROVED", label: "Aprobados", count: totals.approved },
    { id: "CANCELLED", label: "Rechazados", count: projects.filter((project) => project.status === "CANCELLED").length },
  ];

  return (
    <div id="historial-proyectos" className="scroll-mt-32">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Proyectos guardados", value: totals.total, tone: "text-hito-navy", panel: "from-white to-[#edf4ff]", icon: "▤" },
          { label: "Aceptados o en curso", value: totals.approved, tone: "text-emerald-700", panel: "from-white to-[#effaf5]", icon: "✓" },
          { label: "Pendientes de revisión", value: totals.pending, tone: "text-amber-700", panel: "from-white to-[#fff8eb]", icon: "◷" },
        ].map((item) => (
          <div key={item.label} className={`relative overflow-hidden rounded-2xl border border-white bg-gradient-to-br ${item.panel} px-5 py-4 shadow-[0_10px_28px_rgba(25,56,118,0.06)] ring-1 ring-[#e2eafa]`}>
            <span aria-hidden="true" className="absolute -right-4 -top-5 size-20 rounded-full bg-white/65 blur-xl" />
            <div className="relative flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-slate-500">{item.label}</p><p className={`mt-1 text-3xl font-black tracking-tight ${item.tone}`}>{item.value}</p></div>
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-white/85 text-lg font-black text-hito-violet shadow-sm ring-1 ring-white">{item.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-hito-violet">Tu cartera</p><h2 className="mt-1 text-xl font-black text-hito-navy">Historial de proyectos</h2></div>
        <button type="button" onClick={() => void loadProjects(true)} disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-[#d5e1f6] bg-white/85 px-4 py-2.5 text-xs font-extrabold text-hito-navy shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c6f5] hover:bg-white disabled:opacity-60">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`size-4 ${refreshing ? "animate-spin" : ""}`}><path d="M16.5 8A6.7 6.7 0 0 0 4.8 5.2L3.5 6.5M3.5 6.5V3.8m0 2.7h2.7m-2.7 3.5a6.7 6.7 0 0 0 11.7 2.8l1.3-1.3m0 0v2.7m0-2.7h-2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {refreshing ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      {loading && <p className="rounded-2xl border border-hito-border bg-white p-6 text-sm text-hito-muted">Cargando proyectos guardados…</p>}

      {!loading && projects.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar proyectos por estado">
          {filters.map((filter) => (
            <button key={filter.id} type="button" aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold transition sm:text-sm ${statusFilter === filter.id ? "border-transparent bg-gradient-to-r from-[#0878f9] to-[#7038ed] text-white shadow-md shadow-blue-700/15" : "border-[#dce5f3] bg-white/85 text-slate-600 hover:border-[#c4d5f0] hover:bg-white"}`}>
              {filter.label} <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${statusFilter === filter.id ? "bg-white/20 text-white" : "bg-[#f0f4fb] text-slate-500"}`}>{filter.count}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-[1.75rem] border border-dashed border-[#cad8ef] bg-white/80 p-9 text-center shadow-sm">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#e8f4ff] to-[#f2ecff] text-2xl text-hito-violet">✦</span>
          <h3 className="mt-4 font-semibold text-hito-navy">Todavía no hay proyectos</h3>
          <p className="mt-2 text-sm text-hito-muted">Los planes generados con Gemini aparecerán aquí.</p>
          <Link href="/" className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#0878f9] to-[#7038ed] px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-700/15 transition hover:-translate-y-0.5">Crear un plan</Link>
        </div>
      )}

      {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
        <p className="rounded-2xl border border-[#dce5f3] bg-white/85 p-6 text-sm text-hito-muted">No hay proyectos con este estado.</p>
      )}

      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <article key={project.id} className="relative overflow-hidden rounded-[1.6rem] border border-white bg-white/90 p-5 shadow-[0_16px_42px_rgba(23,54,113,0.07)] ring-1 ring-[#e2eafa] transition hover:shadow-[0_20px_50px_rgba(23,54,113,0.1)] sm:p-6">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0878f9] via-[#7041ed] to-[#12bacb]" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-hito-muted">Creado {formatDate(project.created_at)}</p>
                <h3 className="mt-1 text-lg font-bold text-hito-navy">{project.name}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(project.status)}`}>
                {statusLabels[project.status] ?? project.status}
              </span>
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">{project.ai_summary || project.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f5f8ff] px-3.5 py-3 ring-1 ring-[#e8eef8]"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Presupuesto</span><strong className="mt-1 block text-sm font-extrabold text-hito-navy">{formatMoney(project.total_amount)}</strong></div>
              <div className="rounded-xl bg-[#f8f5ff] px-3.5 py-3 ring-1 ring-[#eee8fb]"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Plazo</span><strong className="mt-1 block text-sm font-extrabold text-hito-navy">{project.duration_days} días</strong></div>
              <div className="rounded-xl bg-[#f1fbfb] px-3.5 py-3 ring-1 ring-[#def3f4]"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Hitos</span><strong className="mt-1 block text-sm font-extrabold text-hito-navy">{project.milestones.length}</strong></div>
            </div>
            {project.status === "PENDING_APPROVAL" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void decideProject(project.id, "APPROVE")} disabled={Boolean(workingProjectId)}
                  className="rounded-full bg-gradient-to-r from-[#0878f9] to-[#315cf1] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-blue-700/15 transition hover:-translate-y-0.5 disabled:opacity-60">
                  {workingProjectId === project.id ? "Guardando…" : "Aprobar proyecto"}
                </button>
                <button type="button" onClick={() => void decideProject(project.id, "REJECT")} disabled={Boolean(workingProjectId)}
                  className="rounded-full border border-[#dce5f3] bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60">
                  Rechazar
                </button>
              </div>
            )}
            <details className="mt-4 border-t border-[#e8edf6] pt-4">
              <summary className="cursor-pointer text-sm font-bold text-hito-blue marker:text-hito-violet">Ver hitos del proyecto</summary>
              <ol className="mt-3 space-y-2">
                {project.milestones.map((milestone, index) => (
                  <li key={milestone.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-hito-tint/70 px-4 py-3 text-sm">
                    <span className="font-medium text-hito-ink">{index + 1}. {milestone.name}</span>
                    <span className="font-semibold text-hito-navy">{formatMoney(milestone.amount)} · {milestone.paymentStatus === "PAID" ? "Pagado" : milestone.paymentStatus === "UNPAID" ? "Factura pendiente" : "Sin factura"}</span>
                  </li>
                ))}
              </ol>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
