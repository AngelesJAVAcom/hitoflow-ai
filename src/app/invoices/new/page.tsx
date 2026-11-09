import { InvoiceWorkspace } from "@/components/invoice/InvoiceWorkspace";
import { AppHeader } from "@/components/layout/AppHeader";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_0%,rgba(8,120,249,0.1),transparent_34%),radial-gradient(ellipse_at_92%_8%,rgba(111,57,237,0.09),transparent_28%),linear-gradient(180deg,#f8faff_0%,#f4f7ff_58%,#f9fbff_100%)] text-hito-ink">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
        <WorkspaceHero
          variant="newInvoice"
          eyebrow="Envío seguro en Sandbox"
          title="Convierte el hito"
          highlight="en una factura."
          description="Elige una entrega aprobada, confirma el correo del cliente y envía la factura de prueba. El importe se toma del plan guardado."
          primaryHref="#formulario-factura"
          primaryLabel="Ir al formulario"
          secondaryHref="/invoices"
          secondaryLabel="Ver historial"
          steps={[
            { title: "Entrega aprobada", description: "Solo aparecen hitos disponibles", accent: "blue" },
            { title: "Datos del cliente", description: "Confirma el correo de destino", accent: "violet" },
            { title: "Envío de prueba", description: "PayPal Sandbox, sin cobro real", accent: "cyan" },
          ]}
        />
        <InvoiceWorkspace />
      </main>
    </div>
  );
}
