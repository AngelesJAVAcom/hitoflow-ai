import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { InvoiceHistory } from "@/components/history/InvoiceHistory";

export default function InvoicesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eaf3ff_0%,_#f6f8ff_45%,_#ffffff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-hito-violet">PayPal Sandbox</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-hito-navy sm:text-4xl">Facturas</h1>
            <p className="mt-3 max-w-2xl leading-7 text-hito-muted">Revisa las facturas enviadas y sincroniza su estado con PayPal cuando quieras comprobar si se pagaron.</p>
          </div>
          <Link href="/invoices/new" className="rounded-full bg-hito-blue px-5 py-3 text-sm font-bold text-white transition hover:bg-hito-navy">Nueva factura</Link>
        </div>
        <InvoiceHistory />
      </main>
    </div>
  );
}
