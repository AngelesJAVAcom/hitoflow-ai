import { InvoiceWorkspace } from "@/components/invoice/InvoiceWorkspace";
import { AppHeader } from "@/components/layout/AppHeader";

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eaf3ff_0%,_#f6f8ff_45%,_#ffffff_100%)] text-hito-ink">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-hito-violet">
            PayPal Sandbox
          </p>

          <h1 className="mt-2 text-3xl font-bold text-hito-navy sm:text-4xl">
            Crear factura de un hito
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-hito-muted">
            Selecciona un hito de un proyecto aprobado y envía la factura al
            cliente. El importe y el concepto salen del plan revisado.
          </p>
        </div>

        <InvoiceWorkspace />
      </main>
    </div>
  );
}
