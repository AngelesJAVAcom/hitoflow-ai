import { InvoiceWorkspace } from "@/components/invoice/InvoiceWorkspace";
import { AppHeader } from "@/components/layout/AppHeader";

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
            Día 2
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Crear factura de un hito
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Prepara un borrador de factura para uno de los hitos del proyecto.
            Antes de continuar podrás revisar los datos ingresados.
          </p>
        </div>

        <InvoiceWorkspace />
      </main>
    </div>
  );
}