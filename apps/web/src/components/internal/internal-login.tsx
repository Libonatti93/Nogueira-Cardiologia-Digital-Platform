'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Feedback = {
  status: Status;
  message: string;
};

const initialFeedback: Feedback = { status: 'idle', message: '' };

export function InternalLogin() {
  const [feedback, setFeedback] = useState<Feedback>(initialFeedback);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback({ status: 'submitting', message: 'Validando acesso interno...' });

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, portal: 'admin' }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? 'Nao foi possivel entrar.');
      }

      setFeedback({ status: 'success', message: 'Acesso validado. Abrindo dashboard...' });
      window.location.href = body?.redirectTo ?? '/interno/dashboard';
    } catch (error) {
      setFeedback({
        status: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel entrar.',
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
        E-mail institucional
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
          placeholder="medico@nogueira..."
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
        Senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
          placeholder="Sua senha"
        />
      </label>

      <button
        type="submit"
        disabled={feedback.status === 'submitting'}
        className="inline-flex w-fit rounded-lg bg-[#14508B] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {feedback.status === 'submitting' ? 'Validando...' : 'Entrar na dashboard'}
      </button>

      {feedback.status !== 'idle' ? (
        <p className={`text-sm font-semibold ${feedback.status === 'error' ? 'text-red-700' : 'text-[#14508B]'}`}>
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}
