import { AppHeader } from "@/components/layout/AppHeader";
import { WorkspaceHero } from "@/components/layout/WorkspaceHero";
import { InvoiceHistory } from "@/components/history/InvoiceHistory";

export default function InvoicesPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_12%_0%,rgba(8,120,249,0.1),transparent_34%),radial-gradient(ellipse_at_92%_8%,rgba(111,57,237,0.09),transparent_28%),linear-gradient(180deg,#f8faff_0%,#f4f7ff_58%,#f9fbff_100%)] text-hito-ink">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8 lg:pt-12">
        <WorkspaceHero
          eyebrow="Facturación PayPal Sandbox"
          title="Tus entregas,"
          highlight="listas para cobrar."
          description="Consulta los importes y el estado de cada factura. Cuando necesites, sincroniza con PayPal para confirmar los pagos."
          primaryHref="/invoices/new"
          primaryLabel="Crear una factura"
          secondaryHref="#historial-facturas"
          secondaryLabel="Ver facturas enviadas"
          steps={[
            { title: "Hito aprobado", description: "Factura ligada a una entrega real", accent: "blue" },
            { title: "Envío por PayPal", description: "Sandbox para pruebas controladas", accent: "violet" },
            { title: "Estado sincronizado", description: "Consulta cambios desde PayPal", accent: "cyan" },
          ]}
        />
        <InvoiceHistory />
      </main>
    </div>
  );
}
