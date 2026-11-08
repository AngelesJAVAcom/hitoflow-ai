import type { FormEvent } from "react";

import type { InvoiceFormValues, MilestoneOption } from "@/types/invoice";

type InvoiceFormProps = {
  milestones: MilestoneOption[];
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function InvoiceForm({ milestones, onSubmit, isSubmitting }: InvoiceFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const milestoneId = String(values.get("milestoneId") ?? "");
    const milestone = milestones.find((item) => item.id === milestoneId);

    if (!milestone) return;

    await onSubmit({
      customerEmail: String(values.get("customerEmail") ?? "").trim(),
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      amount: milestone.amount,
    });
  }

  return (
    <section className="h-full rounded-[28px] border border-paypal-border bg-paypal-surface p-6 shadow-[0_20px_60px_rgba(0,48,135,0.08)] sm:p-8">
      <div>
        <p className="text-sm font-semibold text-paypal-blue">Facturación del proyecto</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-paypal-ink">Datos de la factura</h2>
        <p className="mt-2 text-sm leading-6 text-paypal-muted">Elige un hito aprobado. El importe y el concepto se toman del plan revisado.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-6" aria-busy={isSubmitting}>
        <div>
          <label htmlFor="milestoneId" className="mb-2 block text-sm font-semibold text-paypal-ink">Hito aprobado</label>
          <select id="milestoneId" name="milestoneId" required disabled={isSubmitting || milestones.length === 0}
            className="w-full rounded-2xl border border-paypal-border bg-white px-4 py-3.5 text-paypal-ink shadow-sm outline-none focus:border-paypal-focus focus:ring-4 focus:ring-[#0057ff]/15 disabled:cursor-not-allowed disabled:bg-slate-100">
            {milestones.length === 0 ? <option value="">No hay hitos disponibles</option> : <option value="">Selecciona proyecto e hito</option>}
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.projectName} · {milestone.name} · USD {milestone.amount.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="customerEmail" className="mb-2 block text-sm font-semibold text-paypal-ink">Correo del cliente</label>
          <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" required disabled={isSubmitting}
            placeholder="cliente@correo.com"
            className="w-full rounded-2xl border border-paypal-border bg-white px-4 py-3.5 text-paypal-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-paypal-focus focus:ring-4 focus:ring-[#0057ff]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70" />
        </div>

        <button type="submit" disabled={isSubmitting || milestones.length === 0}
          className="w-full rounded-full bg-paypal-blue px-5 py-3.5 font-bold text-white shadow-[0_10px_24px_rgba(0,112,186,0.24)] transition hover:-translate-y-0.5 hover:bg-paypal-navy focus:outline-none focus:ring-4 focus:ring-[#0057ff]/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          {isSubmitting ? "Creando y enviando…" : "Crear y enviar factura"}
        </button>
        <p className="text-xs leading-5 text-paypal-muted">La factura se enviará al correo indicado mediante PayPal Sandbox.</p>
      </form>
    </section>
  );
}
