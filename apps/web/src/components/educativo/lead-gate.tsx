'use client';

import { useState, type FormEvent } from 'react';
import type { BlogSection } from '@/data/blog-posts';

type LeadGateProps = {
  postSlug: string;
  postTitle: string;
  sections: BlogSection[];
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function LeadGate({ postSlug, postTitle, sections }: LeadGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get('fullName') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      phoneWhatsapp: String(formData.get('phoneWhatsapp') ?? '').trim(),
      postSlug,
      postTitle,
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? 'Não foi possível liberar o conteúdo agora.');
      }

      setUnlocked(true);
      setStatus('success');
    } catch (submissionError) {
      setStatus('error');
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível liberar o conteúdo agora.');
    }
  }

  if (!unlocked) {
    return (
      <section className="mt-8 rounded-3xl border border-[#14508B]/14 bg-[#F4F9FF] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#15A7DD]">Acesso ao conteúdo educativo</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#103E6A] sm:text-3xl">
          Informe seus dados para continuar a leitura
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          A Nogueira Cardiologia usa esses dados para organizar o acesso aos materiais educativos e enviar orientações relacionadas à saúde cardiovascular.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
              Nome completo
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                minLength={3}
                required
                className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
                placeholder="Digite seu nome"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
              E-mail
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
                placeholder="seuemail@exemplo.com"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
            Telefone / WhatsApp
            <input
              name="phoneWhatsapp"
              type="tel"
              autoComplete="tel"
              minLength={10}
              required
              className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
              placeholder="(17) 99999-9999"
            />
          </label>

          <p className="text-xs leading-5 text-slate-500">
            Ao continuar, você autoriza o contato da Nogueira Cardiologia por e-mail ou WhatsApp com conteúdos educativos e informações relacionadas à clínica.
          </p>

          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === 'submitting' ? 'Liberando conteúdo...' : 'Liberar conteúdo educativo'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <div className="prose prose-slate mt-8 max-w-none">
      {sections.map((section) => (
        <section key={section.heading} className="mt-8 first:mt-0">
          <h2 className="text-2xl font-semibold text-[#103E6A]">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-base leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
