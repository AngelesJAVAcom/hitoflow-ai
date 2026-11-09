"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language";

type WorkspaceHeroProps = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  steps: Array<{ title: string; description: string; accent: "blue" | "violet" | "cyan" }>;
  visualEyebrow?: string;
  visualTitle?: string;
  visualBadge?: string;
  visualFooter?: "logo" | "project-lifecycle";
  variant?: "projects" | "timeline" | "invoices" | "newInvoice";
};

const stepAccent = {
  blue: { card: "border-[#deebff] bg-[linear-gradient(110deg,#f5f9ff,#ffffff)]", dot: "from-[#0878f9] to-[#569fff]", icon: "text-blue-700" },
  violet: { card: "border-[#e8e1ff] bg-[linear-gradient(110deg,#faf8ff,#ffffff)]", dot: "from-[#6236e9] to-[#a075ff]", icon: "text-violet-700" },
  cyan: { card: "border-[#d8f3f4] bg-[linear-gradient(110deg,#f2fcfc,#ffffff)]", dot: "from-[#12bacb] to-[#0878f9]", icon: "text-cyan-800" },
} as const;

export function WorkspaceHero({
  eyebrow,
  title,
  highlight,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  steps,
  visualEyebrow = "HitoFlow · PayPal Sandbox",
  visualTitle = "Un flujo claro de principio a fin",
  visualBadge = "TU ESPACIO",
  visualFooter = "logo",
  variant,
}: WorkspaceHeroProps) {
  const { t } = useLanguage();
  const prefix = variant ? `hero.${variant}.` : null;
  const translatedSteps = variant ? [1, 2, 3].map((number, index) => ({
    title: t(`${prefix}step${number}` as import("@/lib/translations").TranslationKey),
    description: t(`${prefix}step${number}Description` as import("@/lib/translations").TranslationKey),
    accent: steps[index]?.accent ?? "blue",
  })) : steps;
  return (
    <section className="hero-panel relative isolate mb-7 overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(115deg,rgba(255,255,255,0.97)_0%,rgba(246,250,255,0.95)_48%,rgba(245,241,255,0.92)_100%)] p-6 shadow-[0_24px_70px_rgba(37,73,143,0.09)] ring-1 ring-[#dce7fa] sm:p-9 lg:p-10">
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 z-0 opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 z-0 size-96 rounded-full bg-[radial-gradient(circle,rgba(112,67,239,0.16),rgba(8,120,249,0.08)_42%,transparent_70%)] blur-2xl" />
      <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e5ff] bg-white/85 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-hito-violet shadow-sm sm:text-xs">
            <span className="size-2 rounded-full bg-gradient-to-r from-hito-blue to-hito-violet" />
            {variant ? t(`hero.${variant}.eyebrow` as import("@/lib/translations").TranslationKey) : eyebrow}
          </div>
          <h1 className="mt-4 text-[2.35rem] font-black leading-[1.08] tracking-[-0.04em] text-hito-navy sm:text-4xl lg:text-[3.15rem]">
            {variant ? t(`hero.${variant}.title` as import("@/lib/translations").TranslationKey) : title}{" "}
            <span className="bg-gradient-to-r from-[#0878f9] via-[#425cf4] to-[#7138ed] bg-clip-text text-transparent">
              {variant ? t(`hero.${variant}.highlight` as import("@/lib/translations").TranslationKey) : highlight}
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            {variant ? t(`hero.${variant}.description` as import("@/lib/translations").TranslationKey) : description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={primaryHref} className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0878f9] via-[#345ff4] to-[#7038ed] px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(60,91,226,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(60,91,226,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/50">
              {variant ? t(`hero.${variant}.primary` as import("@/lib/translations").TranslationKey) : primaryLabel}
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </Link>
            <Link href={secondaryHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d5e1f6] bg-white/80 px-5 py-3.5 text-sm font-bold text-hito-navy shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9c6f5] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/15">
              {variant ? t(`hero.${variant}.secondary` as import("@/lib/translations").TranslationKey) : secondaryLabel} <span aria-hidden="true" className="text-hito-violet">↗</span>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[28rem] lg:ml-auto">
          <div aria-hidden="true" className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#5db4ff]/25 via-[#8271ff]/15 to-[#36d6dc]/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.7rem] border border-white/90 bg-white/85 p-4 shadow-[0_24px_60px_rgba(28,55,111,0.13)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-hito-violet">{variant ? t(`hero.${variant}.visualEyebrow` as import("@/lib/translations").TranslationKey) : visualEyebrow}</p>
                <p className="mt-1 text-sm font-bold text-hito-navy">{variant ? t(`hero.${variant}.visualTitle` as import("@/lib/translations").TranslationKey) : visualTitle}</p>
              </div>
              <span className="rounded-full bg-[#e9f7ff] px-2.5 py-1 text-[9px] font-extrabold text-[#0873c8]">{variant ? t(`hero.${variant}.visualBadge` as import("@/lib/translations").TranslationKey) : visualBadge}</span>
            </div>

            <div className="relative mt-4">
              <span aria-hidden="true" className="absolute bottom-6 left-[1.1rem] top-6 w-px bg-gradient-to-b from-[#0878f9] via-[#7041ed] to-[#12bacb]" />
              <ol className="grid gap-2.5">
                {translatedSteps.map((step, index) => {
                  const accent = stepAccent[step.accent];
                  return (
                    <li key={step.title} className={`relative flex items-center gap-3 rounded-2xl border p-3 ${accent.card}`}>
                      <span className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-gradient-to-br ${accent.dot} text-white shadow-md`}>
                        <span className="text-[10px] font-black">{index + 1}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-hito-navy">{step.title}</span>
                        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{step.description}</span>
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`size-4 shrink-0 ${accent.icon}`}><path d="m5 10 3.1 3L15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </li>
                  );
                })}
              </ol>
            </div>

            {visualFooter === "logo" ? (
              <div className="mt-3 overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-[#e4ebf8]">
                <Image src="/hitoflow-logo.jpeg" alt="" width={240} height={160} className="mx-auto h-[4.8rem] w-52 rounded-xl object-contain sm:h-[5.2rem] sm:w-56" />
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-[linear-gradient(110deg,#f5f9ff,#fbf9ff,#f2fcfc)] p-3.5 ring-1 ring-[#e4ebf8]">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-500">{t("hero.projects.footer")}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="rounded-full bg-[#fff5df] px-2.5 py-1 text-[9px] font-extrabold text-amber-800">{t("hero.projects.pending")}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-amber-300 via-violet-300 to-cyan-300" />
                  <span className="rounded-full bg-[#f2edff] px-2.5 py-1 text-[9px] font-extrabold text-violet-800">{t("projects.statusProgress")}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-violet-300 to-cyan-300" />
                  <span className="rounded-full bg-[#e9f9f7] px-2.5 py-1 text-[9px] font-extrabold text-teal-800">{t("hero.projects.completed")}</span>
                </div>
              </div>
            )}
          </div>
          <span aria-hidden="true" className="absolute -right-2 -top-2 grid size-9 place-items-center rounded-2xl bg-white text-base text-hito-violet shadow-lg ring-1 ring-violet-100">✦</span>
          <span aria-hidden="true" className="absolute -bottom-2 -left-2 size-6 rounded-full bg-hito-cyan ring-4 ring-white" />
        </div>
      </div>
    </section>
  );
}
