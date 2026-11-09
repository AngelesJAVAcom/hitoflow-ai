import { AppHeader } from "@/components/layout/AppHeader";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { ProjectHistory } from "@/components/history/ProjectHistory";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_0%,rgba(8,120,249,0.1),transparent_34%),radial-gradient(ellipse_at_92%_8%,rgba(111,57,237,0.09),transparent_28%),linear-gradient(180deg,#f8faff_0%,#f4f7ff_58%,#f9fbff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
        <WorkspaceHero
          eyebrow="Seguimiento de tu trabajo"
          title="Cada proyecto,"
          highlight="bajo control."
          description="Consulta las propuestas, aprueba los planes y mantén a la vista el estado de cada colaboración desde un mismo lugar."
          primaryHref="/"
          primaryLabel="Crear un plan"
          secondaryHref="#historial-proyectos"
          secondaryLabel="Ir a mis proyectos"
          visualEyebrow="Cartera de proyectos"
          visualTitle="Etapas bajo seguimiento"
          visualBadge="ESTADOS"
          visualFooter="project-lifecycle"
          steps={[
            { title: "Por revisar", description: "Aprueba o rechaza propuestas", accent: "blue" },
            { title: "En desarrollo", description: "Revisa hitos y cronograma", accent: "violet" },
            { title: "En historial", description: "Consulta el estado de cada proyecto", accent: "cyan" },
          ]}
        />
        <ProjectHistory />
      </main>
    </div>
  );
}
