'use client';

import { useEffect, useState } from 'react';

type GuideVariant = 'home' | 'exams';
type GuideState = 'hidden' | 'open' | 'followup';

const whatsappMessages: Record<GuideVariant, string> = {
  home: 'Olá! Estou no portal do paciente e preciso de ajuda para encontrar uma opção.',
  exams: 'Olá! Estou na página Meus exames e preciso de ajuda para enviar um arquivo.',
};

const content: Record<GuideVariant, { title: string; intro: string; steps: string[] }> = {
  home: {
    title: 'Bem-vindo ao seu portal',
    intro: 'Vou explicar rapidinho o que você encontra aqui:',
    steps: [
      'Em “Agendar consulta”, você escolhe o médico, o dia e o horário.',
      'Em “Meus exames”, você envia laudos, resultados e imagens com segurança.',
      'No calendário, você acompanha os meses, feriados, horários e suas próximas consultas.',
    ],
  },
  exams: {
    title: 'Precisa enviar um exame?',
    intro: 'É simples e seguro. Siga estes passos:',
    steps: [
      'Escolha o tipo do exame e informe a data, se souber.',
      'Selecione no celular ou computador um arquivo PDF, JPG, PNG ou WEBP.',
      'Toque em “Enviar exame”. Depois do envio, o arquivo aparecerá nesta mesma página.',
    ],
  },
};

export function PatientPageGuide({ variant }: { variant: GuideVariant }) {
  const [state, setState] = useState<GuideState>('hidden');
  const guide = content[variant];
  const whatsappUrl = `https://wa.me/5517997440223?text=${encodeURIComponent(whatsappMessages[variant])}`;

  useEffect(() => {
    const timer = window.setTimeout(() => setState('open'), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  function closeGuide() {
    setState('followup');
  }

  if (state === 'hidden') return null;

  if (state === 'followup') {
    return (
      <aside
        aria-live="polite"
        className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-xs rounded-2xl border border-emerald-200 bg-white p-4 shadow-[0_20px_55px_-20px_rgba(15,55,96,0.45)] sm:right-6"
      >
        <button type="button" onClick={() => setState('hidden')} aria-label="Fechar lembrete" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-lg text-slate-400 hover:bg-slate-100">
          ×
        </button>
        <p className="pr-6 text-sm font-semibold leading-6 text-[#0F3760]">Tudo bem! Qualquer coisa, me manda uma mensagem.</p>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1FB85A]">
          Chamar no WhatsApp
        </a>
        <p className="mt-2 text-[10px] text-slate-500">Respondemos em horário comercial.</p>
      </aside>
    );
  }

  return (
    <aside
      aria-live="polite"
      aria-label="Orientação da secretaria"
      className="fixed bottom-24 right-4 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-[0_24px_70px_-20px_rgba(15,55,96,0.45)] sm:right-6"
    >
      <header className="flex items-start gap-3 bg-gradient-to-r from-[#0F3760] to-[#14508B] p-4 text-white">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-xl" aria-hidden="true">
          ♡
          <i className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#14508B] bg-emerald-400" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Secretaria Nogueira Cardiologia</p>
          <p className="mt-0.5 text-xs text-white/75">Posso te mostrar como funciona?</p>
        </div>
        <button type="button" onClick={closeGuide} aria-label="Fechar orientação" className="grid h-8 w-8 place-items-center rounded-full text-xl text-white/75 hover:bg-white/10 hover:text-white">
          ×
        </button>
      </header>

      <div className="p-5">
        <h2 className="text-lg font-semibold text-[#0F3760]">{guide.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{guide.intro}</p>
        <ol className="mt-4 grid gap-3">
          {guide.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-slate-600">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EAF4FF] text-xs font-bold text-[#14508B]">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={closeGuide} className="mt-5 w-full rounded-xl bg-[#14508B] px-4 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
          Entendi, pode fechar
        </button>
      </div>
    </aside>
  );
}
