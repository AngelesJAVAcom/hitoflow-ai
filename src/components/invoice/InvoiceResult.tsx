import type {
  InvoiceFormValues,
  InvoiceRequestStatus,
  InvoiceResult as InvoiceResultData,
} from "@/types/invoice";

type InvoiceResultProps = {
  draft: InvoiceFormValues | null;
  requestStatus: InvoiceRequestStatus;
  result: InvoiceResultData | null;
  errorMessage: string | null;
};

export function InvoiceResult({
  draft,
  requestStatus,
  result,
  errorMessage,
}: InvoiceResultProps) {
  return (
    <aside className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Resultado
      </p>

      {requestStatus === "idle" && (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-800 text-2xl font-semibold text-violet-400"
          >
            $
          </div>

          <h2 className="text-lg font-semibold text-white">
            Todavía no hay una factura
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Completa el formulario para crear un borrador en PayPal Sandbox.
          </p>
        </div>
      )}

      {requestStatus === "loading" && (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 size-12 animate-pulse rounded-full bg-violet-500/30"
          />
          <h2 className="text-lg font-semibold text-white">
            Creando el borrador
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Estamos conectando con PayPal Sandbox.
          </p>
        </div>
      )}

      {requestStatus === "error" && (
        <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
          <p className="text-sm font-semibold text-rose-300">
            No se pudo crear el borrador
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-200/80">
            {errorMessage}
          </p>
        </div>
      )}

      {requestStatus === "success" && result && (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="text-sm font-semibold text-emerald-300">
            {result.message}
          </p>

          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-emerald-200/60">
                Identificador
              </dt>
              <dd className="mt-1 break-all text-sm text-white">
                {result.invoiceId}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-emerald-200/60">
                Estado
              </dt>
              <dd className="mt-1 text-sm font-semibold text-white">
                {result.status}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {draft && requestStatus !== "idle" && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-950 p-4 sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Cliente
            </dt>
            <dd className="mt-1 break-all text-sm text-slate-200">
              {draft.customerEmail}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-950 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Hito
            </dt>
            <dd className="mt-1 text-sm text-slate-200">
              {draft.milestoneName}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-950 p-4">
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              Importe
            </dt>
            <dd className="mt-1 text-sm font-semibold text-white">
              USD {draft.amount}
            </dd>
          </div>
        </dl>
      )}
    </aside>
  );
}
