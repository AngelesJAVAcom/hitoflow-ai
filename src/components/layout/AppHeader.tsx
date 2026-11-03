import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-600 font-bold text-white">
            H
          </span>

          <div>
            <p className="font-semibold text-white">HitoFlow AI</p>
            <p className="text-xs text-slate-400">
              Proyectos, hitos y facturación
            </p>
          </div>
        </Link>

        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
          PayPal Sandbox
        </span>
      </div>
    </header>
  );
}