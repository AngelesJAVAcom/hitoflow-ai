import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { ProjectHistory } from "@/components/history/ProjectHistory";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eaf3ff_0%,_#f6f8ff_45%,_#ffffff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-hito-violet">Seguimiento</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-hito-navy sm:text-4xl">Tus proyectos</h1>
            <p className="mt-3 max-w-2xl leading-7 text-hito-muted">Consulta los planes guardados, cuáles esperan tu aprobación y cuáles ya aceptaste.</p>
          </div>
          <Link href="/" className="rounded-full bg-hito-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-hito-navy">Crear proyecto</Link>
        </div>
        <ProjectHistory />
      </main>
    </div>
  );
}
