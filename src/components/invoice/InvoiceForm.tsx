"use client";

import type { FormEvent } from "react";
import { useLanguage } from "@/lib/language";

import type { InvoiceFormValues, MilestoneOption } from "@/types/invoice";

type InvoiceFormProps = {
  milestones: MilestoneOption[];
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function InvoiceForm({ milestones, onSubmit, isSubmitting }: InvoiceFormProps) {
  const { t } = useLanguage();
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
    <section id="formulario-factura" className="scroll-mt-32 relative h-full overflow-hidden rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_20px_55px_rgba(20,54,117,0.09)] ring-1 ring-[#dce7fa] sm:p-7">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0878f9] via-[#7041ed] to-[#12bacb]" />
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-hito-violet"><span className="grid size-6 place-items-center rounded-lg bg-[#f1edff] text-[10px]">01</span>{t("invoiceForm.eyebrow")}</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-hito-navy">{t("invoiceForm.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("invoiceForm.description")}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-6" aria-busy={isSubmitting}>
        <div>
          <label htmlFor="milestoneId" className="mb-2 block text-[13px] font-bold text-hito-navy">{t("invoiceForm.approvedMilestone")}</label>
          <select id="milestoneId" name="milestoneId" required disabled={isSubmitting || milestones.length === 0}
            className="w-full rounded-2xl border border-[#dce5f3] bg-[#f9fbff] px-4 py-3.5 text-sm text-hito-ink shadow-sm outline-none transition focus:border-hito-blue focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:bg-slate-100">
            {milestones.length === 0 ? <option value="">{t("invoiceForm.none")}</option> : <option value="">{t("invoiceForm.choose")}</option>}
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.projectName} · {milestone.name} · USD {milestone.amount.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="customerEmail" className="mb-2 block text-[13px] font-bold text-hito-navy">{t("invoiceForm.clientEmail")}</label>
          <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" required disabled={isSubmitting}
            placeholder={t("invoiceForm.emailPlaceholder")}
            className="w-full rounded-2xl border border-[#dce5f3] bg-[#f9fbff] px-4 py-3.5 text-sm text-hito-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-hito-blue focus:bg-white focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70" />
        </div>

        <button type="submit" disabled={isSubmitting || milestones.length === 0}
          className="w-full rounded-full bg-gradient-to-r from-[#0878f9] via-[#385df0] to-[#7038ed] px-5 py-4 text-sm font-extrabold text-white shadow-[0_12px_25px_rgba(57,91,222,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(57,91,222,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/50 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
          {isSubmitting ? t("invoiceForm.submitting") : t("invoiceForm.submit")}
        </button>
        <p className="rounded-2xl bg-[#f5f8ff] px-3.5 py-3 text-xs leading-5 text-slate-500 ring-1 ring-[#e7edf8]">{t("invoiceForm.sandboxNote")}</p>
      </form>
    </section>
  );
}
