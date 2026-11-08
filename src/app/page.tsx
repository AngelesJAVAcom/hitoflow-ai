import { AppHeader } from "@/components/layout/AppHeader";
import { PlanWorkspace } from "@/components/planner/PlanWorkspace";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eaf3ff_0%,_#f6f8ff_45%,_#ffffff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-hito-violet">
            Planificación asistida por Gemini
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-hito-navy sm:text-5xl">
            Convierte el alcance en hitos cobrables
          </h1>
          <p className="mt-4 text-base leading-7 text-hito-muted sm:text-lg">
            Describe el trabajo, revisa la propuesta de la IA y apruébala antes
            de crear una factura de PayPal Sandbox.
          </p>
        </div>
        <PlanWorkspace />
      </main>
    </div>
  );
}
