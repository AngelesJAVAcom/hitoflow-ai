import Image from "next/image";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { PlanWorkspace } from "@/components/planner/PlanWorkspace";

const shortcuts = [
  { href: "/projects", label: "Proyectos", description: "Revisa aprobaciones y estados", gradient: "from-[#0878f9] to-[#49a2ff]", icon: "M4 6.5 12 3l8 3.5v11L12 21l-8-3.5v-11Zm0 0 8 3.5m0 0 8-3.5m-8 3.5V21" },
  { href: "/timeline", label: "Cronograma", description: "Explora fechas e hitos", gradient: "from-[#6338ed] to-[#986cff]", icon: "M4 6h16M4 12h10M4 18h7m9-3v6m-3-3h6" },
  { href: "/invoices", label: "Facturas", description: "Consulta pagos y facturación", gradient: "from-[#0cb4c4] to-[#51d3d6]", icon: "M6 3h9l4 4v14H6V3Zm9 0v5h4m-9 4h5m-5 4h5" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_0%,rgba(8,120,249,0.1),transparent_34%),radial-gradient(ellipse_at_92%_8%,rgba(111,57,237,0.09),transparent_28%),linear-gradient(180deg,#f8faff_0%,#f4f7ff_58%,#f9fbff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
        <section className="hero-panel relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(115deg,rgba(255,255,255,0.97)_0%,rgba(246,250,255,0.95)_48%,rgba(245,241,255,0.92)_100%)] p-6 shadow-[0_28px_80px_rgba(37,73,143,0.1)] ring-1 ring-[#dce7fa] sm:p-9 lg:p-12">
          <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 z-0 opacity-60" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 z-0 size-[26rem] rounded-full bg-[radial-gradient(circle,rgba(112,67,239,0.17),rgba(8,120,249,0.08)_42%,transparent_70%)] blur-2xl" />
          <div className="relative z-10 grid items-center gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e5ff] bg-white/85 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-hito-violet shadow-sm shadow-blue-900/[0.04] sm:text-xs">
                <span className="size-2 rounded-full bg-gradient-to-r from-hito-blue to-hito-violet" />
                Tu espacio de trabajo inteligente
              </div>
              <h1 className="mt-5 max-w-2xl text-[2.6rem] font-black leading-[1.06] tracking-[-0.045em] text-hito-navy sm:text-5xl lg:text-[3.65rem]">
                De un buen plan a un pago{" "}
                <span className="bg-gradient-to-r from-[#0878f9] via-[#425cf4] to-[#7138ed] bg-clip-text text-transparent">sin perder el hilo.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Organiza proyectos por entregables, revisa cada fecha y conecta los hitos aprobados con la facturación de PayPal.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="#nuevo-plan" className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#0878f9] via-[#345ff4] to-[#7038ed] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(60,91,226,0.25)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(60,91,226,0.32)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/50">
                  Crear un plan de trabajo
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                </a>
                <Link href="/projects" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e1f6] bg-white/80 px-6 py-3.5 text-sm font-bold text-hito-navy shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c6f5] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/15">
                  Ver mis proyectos <span aria-hidden="true" className="text-hito-violet">↗</span>
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500 sm:text-sm">
                <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-hito-blue" /> IA como asistente</span>
                <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-hito-violet" /> Aprobación bajo tu control</span>
                <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-hito-cyan" /> PayPal Sandbox</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[29rem] lg:ml-auto">
              <div aria-hidden="true" className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#5db4ff]/30 via-[#8271ff]/20 to-[#36d6dc]/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/80 p-4 shadow-[0_24px_65px_rgba(28,55,111,0.16)] backdrop-blur-xl sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-hito-violet">Flujo HitoFlow</p><p className="mt-1 text-sm font-bold text-hito-navy">Cada entrega, en su lugar</p></div>
                  <span className="rounded-full bg-[#e9f7ff] px-2.5 py-1 text-[10px] font-extrabold text-[#0873c8]">PLAN → PAGO</span>
                </div>
                <div className="relative mt-4 grid gap-3">
                  <div aria-hidden="true" className="absolute bottom-7 left-[1.15rem] top-7 w-px bg-gradient-to-b from-[#0878f9] via-[#7041ed] to-[#12bacb]" />
                  <div className="relative flex items-center gap-3 rounded-2xl border border-[#deebff] bg-[linear-gradient(110deg,#f5f9ff,#ffffff)] p-3.5">
                    <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0878f9] to-[#569fff] text-white shadow-md"><CheckMark /></span>
                    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-hito-navy">Plan de trabajo</p><p className="mt-0.5 text-[11px] text-slate-500">Gemini propone hitos y fechas</p></div><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">IA</span>
                  </div>
                  <div className="relative flex items-center gap-3 rounded-2xl border border-[#e8e1ff] bg-[linear-gradient(110deg,#faf8ff,#ffffff)] p-3.5">
                    <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6236e9] to-[#a075ff] text-white shadow-md"><CheckMark /></span>
                    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-hito-navy">Revisión y aprobación</p><p className="mt-0.5 text-[11px] text-slate-500">Tú decides qué se acepta</p></div><span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700">TÚ</span>
                  </div>
                  <div className="relative flex items-center gap-3 rounded-2xl border border-[#d8f3f4] bg-[linear-gradient(110deg,#f2fcfc,#ffffff)] p-3.5">
                    <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#12bacb] to-[#0878f9] text-white shadow-md"><CheckMark /></span>
                    <div className="min-w-0 flex-1"><p className="text-xs font-bold text-hito-navy">Factura por hito</p><p className="mt-0.5 text-[11px] text-slate-500">Seguimiento de pago en Sandbox</p></div><span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-bold text-cyan-800">PAYPAL</span>
                  </div>
                </div>
                <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#eef6ff] via-white to-[#f4efff] p-2.5 ring-1 ring-[#e4ebf8]">
                  <div aria-hidden="true" className="absolute -right-10 -top-12 size-36 rounded-full bg-violet-300/25 blur-2xl" />
                  <Image src="/hitoflow-logo.jpeg" alt="" width={240} height={160} className="relative mx-auto h-[5.2rem] w-52 rounded-xl object-contain sm:h-24 sm:w-60" />
                </div>
              </div>
              <span aria-hidden="true" className="absolute -right-3 -top-3 grid size-10 place-items-center rounded-2xl bg-white text-lg text-hito-violet shadow-lg ring-1 ring-violet-100">✦</span>
              <span aria-hidden="true" className="absolute -bottom-3 -left-3 size-7 rounded-full bg-hito-cyan shadow-lg ring-4 ring-white" />
            </div>
          </div>
        </section>

        <section aria-label="Accesos rápidos" className="mt-5 grid gap-3 sm:grid-cols-3">
          {shortcuts.map((shortcut) => (
            <Link key={shortcut.href} href={shortcut.href} className="group flex items-center gap-3.5 rounded-2xl border border-white/90 bg-white/75 p-4 shadow-[0_8px_25px_rgba(26,57,117,0.045)] ring-1 ring-[#e3eafa] transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_15px_35px_rgba(26,57,117,0.1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20 sm:p-5">
              <span className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${shortcut.gradient} text-white shadow-lg`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d={shortcut.icon} /></svg>
              </span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-hito-navy">{shortcut.label}</span><span className="mt-1 block truncate text-xs text-slate-500">{shortcut.description}</span></span>
              <span aria-hidden="true" className="text-lg text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-hito-violet">→</span>
            </Link>
          ))}
        </section>

        <section id="nuevo-plan" className="scroll-mt-32 pt-12 sm:pt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-hito-violet">Empieza por aquí</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-hito-navy sm:text-3xl">Crea una propuesta de proyecto</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Describe el alcance y recibe hitos que puedes revisar antes de aprobarlos.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#dce7fa] bg-white/80 px-3 py-2 text-xs font-semibold text-slate-500 sm:inline-flex"><span className="grid size-5 place-items-center rounded-full bg-[#edf4ff] text-[10px] font-extrabold text-hito-blue">1</span>Propuesta revisable</div>
          </div>
          <PlanWorkspace />
        </section>
      </main>
    </div>
  );
}

function CheckMark() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-3.5"><path d="m5 10 3.1 3L15 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
