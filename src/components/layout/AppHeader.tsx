"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language";

const navigation = [
  { href: "/", key: "nav.createPlan", icon: "M12 5v14m-7-7h14" },
  { href: "/projects", key: "nav.projects", icon: "M4 6.5 12 3l8 3.5v11L12 21l-8-3.5v-11Zm0 0 8 3.5m0 0 8-3.5m-8 3.5V21" },
  { href: "/timeline", key: "nav.timeline", icon: "M4 6h16M4 12h10M4 18h7m9-3v6m-3-3h6" },
  { href: "/invoices", key: "nav.invoices", icon: "M6 3h9l4 4v14H6V3Zm9 0v5h4m-9 4h5m-5 4h5" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-hito-border/80 bg-white/85 shadow-[0_5px_24px_rgba(18,47,103,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" aria-label={t("brand.homeAria")} className="group flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <Image
            src="/hitoflow-logo.jpeg"
            alt={t("brand.logoAlt")}
            width={240}
            height={160}
            priority
            className="h-12 w-[72px] rounded-xl object-contain sm:h-[58px] sm:w-[87px]"
          />
          <span className="hidden border-l border-hito-border pl-3 text-xs leading-5 text-hito-muted md:block">
            {t("brand.tagline").split("\n")[0]}
            <br />
            {t("brand.tagline").split("\n")[1]}
          </span>
        </Link>

        <nav className="order-3 -mx-1 flex w-[calc(100%+0.5rem)] items-center gap-1 overflow-x-auto pb-0.5 sm:order-none sm:mx-0 sm:w-auto sm:gap-1.5 sm:overflow-visible" aria-label={t("nav.primary")}>
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500/20 sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm ${
                  active
                    ? "bg-[#edf4ff] text-hito-navy shadow-sm shadow-blue-950/[0.04] ring-1 ring-hito-blue/10"
                    : "text-slate-600 hover:bg-slate-50 hover:text-hito-navy"
                }`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`size-4 transition-colors ${active ? "text-hito-blue" : "text-slate-400 group-hover:text-hito-violet"}`}>
                  <path d={item.icon} />
                </svg>
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
        <div role="group" aria-label={t("nav.language")} className="inline-flex rounded-full border border-[#d6e3f8] bg-white p-0.5 text-[10px] font-bold shadow-sm">
          {(["en", "es"] as const).map((option) => <button key={option} type="button" lang={option} aria-pressed={language === option} onClick={() => setLanguage(option)} className={`rounded-full px-2 py-1.5 transition ${language === option ? "bg-[#edf4ff] text-hito-navy" : "text-slate-500 hover:text-hito-navy"}`}>{option.toUpperCase()}</button>)}
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#bfddff] bg-[linear-gradient(120deg,#f1f8ff,#f4f0ff)] px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[#07569c] sm:px-3.5 sm:py-2 sm:text-xs">
          <span className="size-2 rounded-full bg-gradient-to-r from-hito-blue to-hito-violet" />
          {t("nav.sandbox")}
        </span>
        </div>
      </div>
    </header>
  );
}
