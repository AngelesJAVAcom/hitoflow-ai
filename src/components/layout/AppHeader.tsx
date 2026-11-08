import Image from "next/image";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-hito-border bg-white/90 shadow-sm shadow-blue-950/[0.03] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="HitoFlow AI, inicio" className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/hitoflow-logo.jpeg"
            alt="Logo de HitoFlow"
            width={240}
            height={160}
            priority
            className="h-[54px] w-[81px] object-contain sm:h-[84px] sm:w-[126px]"
          />
          <span className="hidden text-xs font-medium text-hito-muted sm:block">
            Proyectos, hitos y facturación
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Navegación principal">
          <Link href="/" className="whitespace-nowrap rounded-full px-1.5 py-2 text-[10px] font-semibold text-hito-navy transition hover:bg-hito-tint sm:px-3 sm:text-sm">
            Crear plan
          </Link>
          <Link href="/projects" className="whitespace-nowrap rounded-full px-1.5 py-2 text-[10px] font-semibold text-hito-navy transition hover:bg-hito-tint sm:px-3 sm:text-sm">
            Proyectos
          </Link>
          <Link href="/invoices" className="whitespace-nowrap rounded-full border border-hito-border px-1.5 py-2 text-[10px] font-semibold text-hito-navy transition hover:border-hito-blue hover:bg-hito-tint sm:px-3 sm:text-sm">
            Facturas
          </Link>
          <span className="hidden rounded-full bg-[#e8f4ff] px-3 py-1.5 text-xs font-semibold text-[#07569c] sm:inline-flex">
            PayPal Sandbox
          </span>
        </nav>
      </div>
    </header>
  );
}
