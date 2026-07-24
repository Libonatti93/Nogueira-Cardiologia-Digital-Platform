'use client';

import { useEffect, useState } from 'react';

const whatsappMessage = encodeURIComponent(
  'Olá! Estou no portal da Nogueira Cardiologia e preciso de ajuda para concluir meu agendamento.',
);
const whatsappUrl = `https://wa.me/5517997440223?text=${whatsappMessage}`;

export function SchedulingHelp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 15_000);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Ajuda da secretaria"
      className="fixed bottom-5 right-4 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,55,96,0.45)] sm:bottom-6 sm:right-6"
    >
      <div className="flex items-start gap-3 bg-gradient-to-r from-[#0F3760] to-[#14508B] p-4 text-white">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-xl" aria-hidden="true">
          ♡
          <i className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#14508B] bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Secretaria Nogueira Cardiologia</p>
          <p className="mt-0.5 text-xs text-white/75">Estou aqui para ajudar</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Fechar ajuda" className="grid h-8 w-8 place-items-center rounded-full text-xl text-white/75 hover:bg-white/10 hover:text-white">
          ×
        </button>
      </div>

      <div className="p-5">
        <p className="text-sm font-semibold leading-6 text-[#0F3760]">
          Pode continuar com tranquilidade. Este agendamento é seguro.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Escolha o médico, o dia e o horário. Depois, confira seus dados e selecione PIX ou cartão. Assim que você concluir, nossa secretaria receberá a solicitação e acompanhará a confirmação da sua consulta.
        </p>
        <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
          🔒 Seus dados são protegidos e o pagamento é processado em ambiente seguro pelo Asaas.
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#1FB85A]"
        >
          Chamar a secretaria no WhatsApp
        </a>
        <p className="mt-2 text-center text-[11px] leading-4 text-slate-500">
          Se tiver alguma dúvida, pode chamar. Respondemos sempre em horário comercial.
        </p>
      </div>
    </aside>
  );
}
