import type { FormEvent } from "react";

import type { InvoiceFormValues } from "@/types/invoice";

type InvoiceFormProps = {
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function InvoiceForm({
  onSubmit,
  isSubmitting,
}: InvoiceFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await onSubmit({
      customerEmail: String(formData.get("customerEmail") ?? "").trim(),
      milestoneName: String(formData.get("milestoneName") ?? ""),
      amount: String(formData.get("amount") ?? ""),
    });
  }

  return (
    <section className="h-full rounded-[28px] border border-paypal-border bg-paypal-surface p-6 shadow-[0_20px_60px_rgba(0,48,135,0.08)] sm:p-8">
      <div>
        <p className="text-sm font-semibold text-paypal-blue">
          Facturación del proyecto
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-paypal-ink">
          Datos de la factura
        </h2>

        <p className="mt-2 text-sm leading-6 text-paypal-muted">
          Introduce los datos del cliente y del hito que deseas facturar.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 space-y-6"
        aria-busy={isSubmitting}
      >
        <div>
          <label
            htmlFor="customerEmail"
            className="mb-2 block text-sm font-semibold text-paypal-ink"
          >
            Correo del cliente
          </label>

          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            autoComplete="email"
            required
            pattern="^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$"
            title="Escribe un correo completo, por ejemplo: cliente@correo.com"
            disabled={isSubmitting}
            placeholder="cliente@correo.com"
            className="w-full rounded-2xl border border-paypal-border bg-white px-4 py-3.5 text-paypal-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-paypal-focus focus:ring-4 focus:ring-[#0057ff]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
          />

          <p className="mt-2 text-xs text-paypal-muted">
            Ejemplo: cliente@correo.com
          </p>
        </div>

        <div>
          <label
            htmlFor="milestoneName"
            className="mb-2 block text-sm font-semibold text-paypal-ink"
          >
            Nombre del hito
          </label>

          <input
            id="milestoneName"
            name="milestoneName"
            type="text"
            required
            minLength={3}
            maxLength={200}
            disabled={isSubmitting}
            placeholder="Diseño y aprobación de la propuesta"
            className="w-full rounded-2xl border border-paypal-border bg-white px-4 py-3.5 text-paypal-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-paypal-focus focus:ring-4 focus:ring-[#0057ff]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-semibold text-paypal-ink"
          >
            Importe
          </label>

          <div className="flex rounded-2xl border border-paypal-border bg-white shadow-sm transition focus-within:border-paypal-focus focus-within:ring-4 focus-within:ring-[#0057ff]/15">
            <span className="border-r border-paypal-border px-4 py-3.5 font-semibold text-paypal-navy">
              USD
            </span>

            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              required
              min="0.01"
              max="100000"
              step="0.01"
              disabled={isSubmitting}
              placeholder="0.00"
              className="w-full rounded-r-2xl bg-transparent px-4 py-3.5 text-paypal-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-paypal-blue px-5 py-3.5 font-bold text-white shadow-[0_10px_24px_rgba(0,112,186,0.24)] transition hover:-translate-y-0.5 hover:bg-paypal-navy focus:outline-none focus:ring-4 focus:ring-[#0057ff]/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          {isSubmitting ? "Creando borrador..." : "Crear borrador de factura"}
        </button>
      </form>
    </section>
  );
}
