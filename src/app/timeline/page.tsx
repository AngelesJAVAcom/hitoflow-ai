import { AppHeader } from "@/components/layout/AppHeader";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { TimelineWorkspace } from "@/components/timeline/TimelineWorkspace";

export default function TimelinePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_0%,rgba(8,120,249,0.1),transparent_34%),radial-gradient(ellipse_at_92%_8%,rgba(111,57,237,0.09),transparent_28%),linear-gradient(180deg,#f8faff_0%,#f4f7ff_58%,#f9fbff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
        <WorkspaceHero
          eyebrow="Planificación visual"
          title="El trabajo avanza,"
          highlight="hito por hito."
          description="Compara las fechas y la duración de cada entrega, consulta el estado de pago y revisa propuestas de reprogramación con control humano."
          primaryHref="#cronograma"
          primaryLabel="Explorar cronograma"
          secondaryHref="/projects"
          secondaryLabel="Ver proyectos"
          steps={[
            { title: "Fechas y duración", description: "Observa el recorrido de cada entrega", accent: "blue" },
            { title: "Estado de pago", description: "Distingue hitos pagados y pendientes", accent: "cyan" },
            { title: "Fechas vencidas", description: "Revisa sugerencias antes de aplicarlas", accent: "violet" },
          ]}
        />
        <TimelineWorkspace />
      </main>
    </div>
  );
}
