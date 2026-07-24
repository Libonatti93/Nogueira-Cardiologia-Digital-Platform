'use client';

import { useState } from 'react';

export function PixPaymentDetails({ code, checkoutUrl }: { code: string; checkoutUrl?: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="text-lg font-semibold text-emerald-900">Pague com PIX para confirmar</h2>
      <p className="mt-2 text-sm leading-6 text-emerald-800">
        Copie o código abaixo, abra o aplicativo do seu banco e escolha “PIX Copia e Cola”.
      </p>
      <textarea
        readOnly
        value={code}
        aria-label="Código PIX Copia e Cola"
        className="mt-4 h-24 w-full resize-none rounded-xl border border-emerald-200 bg-white p-3 text-xs text-slate-700 outline-none"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={copyCode} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
          {copied ? 'Código copiado ✓' : 'Copiar código PIX'}
        </button>
        {checkoutUrl ? (
          <a href={checkoutUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
            Abrir cobrança segura
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-xs leading-5 text-emerald-700">Após o pagamento, a confirmação pode levar alguns instantes.</p>
    </section>
  );
}
