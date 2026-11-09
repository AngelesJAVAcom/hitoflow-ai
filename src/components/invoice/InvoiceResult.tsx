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
    <aside className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_20px_55px_rgba(20,54,117,0.07)] ring-1 ring-[#dce7fa] sm:p-7">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#12bacb] via-[#0878f9] to-[#7041ed]" />
      <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-hito-violet">
        <span className="grid size-6 place-items-center rounded-lg bg-[#eaf8fa] text-[10px] text-cyan-700">02</span>
        Resultado
      </p>

      {requestStatus === "idle" && (
        <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 flex size-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-[#e7f3ff] via-[#f1edff] to-[#e5fbfb] text-2xl font-black text-hito-violet shadow-sm ring-1 ring-[#e3eafa]"
          >
            $
          </div>

          <h2 className="text-lg font-black text-hito-navy">
            Todavía no hay una factura
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-hito-muted">
            Completa el formulario para crear y enviar una factura en PayPal Sandbox.
          </p>
        </div>
      )}

      {requestStatus === "loading" && (
        <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 size-12 animate-pulse rounded-2xl bg-gradient-to-br from-[#0878f9]/20 via-[#7041ed]/20 to-[#12bacb]/20"
          />
          <h2 className="text-lg font-black text-hito-navy">
            Creando y enviando la factura
          </h2>
          <p className="mt-2 text-sm text-hito-muted">
            Estamos conectando con PayPal Sandbox.
          </p>
        </div>
      )}

      {requestStatus === "error" && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5">
          <p className="text-sm font-bold text-rose-700">
            No se pudo crear el borrador
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-700/80">
            {errorMessage}
          </p>
        </div>
      )}

      {requestStatus === "success" && result && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
          <p className="text-sm font-bold text-emerald-800">
            {result.message}
          </p>

          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs uppercase tracking-wider text-emerald-800/70">
                Identificador
              </dt>
              <dd className="mt-1 break-all text-sm text-hito-ink">
                {result.invoiceId}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-emerald-800/70">
                Estado
              </dt>
              <dd className="mt-1 text-sm font-semibold text-hito-ink">
                {result.status}
              </dd>
            </div>
            {result.paymentUrl && (
              <div className="pt-2">
                <a
                  href={result.paymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-gradient-to-r from-[#0878f9] to-[#7038ed] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5"
                >
                  Abrir enlace de PayPal
                </a>
              </div>
            )}
          </dl>
        </div>
      )}

      {draft && requestStatus !== "idle" && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f5f8ff] p-4 ring-1 ring-[#e8eef8] sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-hito-muted">
              Cliente
            </dt>
            <dd className="mt-1 break-all text-sm text-hito-ink">
              {draft.customerEmail}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f8f5ff] p-4 ring-1 ring-[#eee8fb]">
            <dt className="text-xs uppercase tracking-wider text-hito-muted">
              Hito
            </dt>
            <dd className="mt-1 text-sm text-hito-ink">
              {draft.milestoneName}
            </dd>
          </div>
          <div className="rounded-xl bg-[#f1fbfb] p-4 ring-1 ring-[#def3f4]">
            <dt className="text-xs uppercase tracking-wider text-hito-muted">
              Importe
            </dt>
            <dd className="mt-1 text-sm font-semibold text-hito-navy">
              USD {draft.amount}
            </dd>
          </div>
        </dl>
      )}
    </aside>
  );
}
