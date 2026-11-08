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
    <aside className="rounded-3xl border border-hito-border bg-white p-6 shadow-xl shadow-blue-950/[0.04]">
      <p className="text-sm font-bold uppercase tracking-wider text-hito-muted">
        Resultado
      </p>

      {requestStatus === "idle" && (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 flex size-14 items-center justify-center rounded-full bg-violet-100 text-2xl font-semibold text-hito-violet"
          >
            $
          </div>

          <h2 className="text-lg font-semibold text-hito-navy">
            Todavía no hay una factura
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-hito-muted">
            Completa el formulario para crear y enviar una factura en PayPal Sandbox.
          </p>
        </div>
      )}

      {requestStatus === "loading" && (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 size-12 animate-pulse rounded-full bg-hito-blue/25"
          />
          <h2 className="text-lg font-semibold text-hito-navy">
            Creando y enviando la factura
          </h2>
          <p className="mt-2 text-sm text-hito-muted">
            Estamos conectando con PayPal Sandbox.
          </p>
        </div>
      )}

      {requestStatus === "error" && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-700">
            No se pudo crear el borrador
          </p>
          <p className="mt-2 text-sm leading-6 text-rose-700/80">
            {errorMessage}
          </p>
        </div>
      )}

      {requestStatus === "success" && result && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800">
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
                  className="inline-flex rounded-full bg-hito-blue px-4 py-2 text-sm font-bold text-white transition hover:bg-hito-navy"
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
          <div className="rounded-xl bg-hito-tint p-4 sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-hito-muted">
              Cliente
            </dt>
            <dd className="mt-1 break-all text-sm text-hito-ink">
              {draft.customerEmail}
            </dd>
          </div>
          <div className="rounded-xl bg-hito-tint p-4">
            <dt className="text-xs uppercase tracking-wider text-hito-muted">
              Hito
            </dt>
            <dd className="mt-1 text-sm text-hito-ink">
              {draft.milestoneName}
            </dd>
          </div>
          <div className="rounded-xl bg-hito-tint p-4">
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
