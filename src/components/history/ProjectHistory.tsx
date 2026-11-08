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
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = (await response.json()) as { success: boolean; message?: string; projects?: Project[] };
      if (!response.ok || !data.success) throw new Error(data.message ?? "No se pudo cargar el historial.");
      setProjects(data.projects ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

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
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Proyectos guardados", value: totals.total, tone: "text-hito-navy" },
          { label: "Aceptados o en curso", value: totals.approved, tone: "text-emerald-700" },
          { label: "Pendientes de revisión", value: totals.pending, tone: "text-amber-700" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-hito-border bg-white px-5 py-4 shadow-sm">
            <p className="text-sm text-hito-muted">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-hito-navy">Historial de proyectos</h2>
        <button type="button" onClick={() => void loadProjects(true)} disabled={loading || refreshing}
          className="rounded-full border border-hito-border bg-white px-4 py-2 text-sm font-semibold text-hito-navy transition hover:bg-hito-tint disabled:opacity-60">
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
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${statusFilter === filter.id ? "border-hito-blue bg-hito-blue text-white" : "border-hito-border bg-white text-hito-muted hover:bg-hito-tint"}`}>
              {filter.label} <span className="ml-1 opacity-75">{filter.count}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="rounded-3xl border border-dashed border-hito-border bg-white p-8 text-center">
          <h3 className="font-semibold text-hito-navy">Todavía no hay proyectos</h3>
          <p className="mt-2 text-sm text-hito-muted">Los planes generados con Gemini aparecerán aquí.</p>
          <Link href="/" className="mt-5 inline-flex rounded-full bg-hito-blue px-5 py-3 text-sm font-bold text-white hover:bg-hito-navy">Crear un plan</Link>
        </div>
      )}

      {!loading && !error && projects.length > 0 && filteredProjects.length === 0 && (
        <p className="rounded-2xl border border-hito-border bg-white p-6 text-sm text-hito-muted">No hay proyectos con este estado.</p>
      )}

      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <article key={project.id} className="rounded-3xl border border-hito-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-hito-muted">Creado {formatDate(project.created_at)}</p>
                <h3 className="mt-1 text-lg font-bold text-hito-navy">{project.name}</h3>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(project.status)}`}>
                {statusLabels[project.status] ?? project.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-hito-muted">{project.ai_summary || project.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span><span className="text-hito-muted">Presupuesto:</span> <strong className="text-hito-ink">{formatMoney(project.total_amount)}</strong></span>
              <span><span className="text-hito-muted">Plazo:</span> <strong className="text-hito-ink">{project.duration_days} días</strong></span>
              <span><span className="text-hito-muted">Hitos:</span> <strong className="text-hito-ink">{project.milestones.length}</strong></span>
            </div>
            {project.status === "PENDING_APPROVAL" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void decideProject(project.id, "APPROVE")} disabled={Boolean(workingProjectId)}
                  className="rounded-full bg-hito-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-hito-navy disabled:opacity-60">
                  {workingProjectId === project.id ? "Guardando…" : "Aprobar proyecto"}
                </button>
                <button type="button" onClick={() => void decideProject(project.id, "REJECT")} disabled={Boolean(workingProjectId)}
                  className="rounded-full border border-hito-border px-4 py-2 text-sm font-semibold text-hito-muted transition hover:bg-slate-50 disabled:opacity-60">
                  Rechazar
                </button>
              </div>
            )}
            <details className="mt-4 border-t border-hito-border pt-4">
              <summary className="cursor-pointer text-sm font-semibold text-hito-blue">Ver hitos del proyecto</summary>
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
