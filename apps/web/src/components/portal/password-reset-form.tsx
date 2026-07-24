'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

type Status = 'checking' | 'ready' | 'submitting' | 'success' | 'error';

const browserSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const browserSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasBrowserSupabaseConfig = Boolean(browserSupabaseUrl && browserSupabaseKey);

export function PasswordResetForm() {
  const [status, setStatus] = useState<Status>(hasBrowserSupabaseConfig ? 'checking' : 'error');
  const [message, setMessage] = useState(
    hasBrowserSupabaseConfig
      ? 'Validando link de recuperação...'
      : 'A recuperação de senha ainda não está configurada.',
  );

  const supabase = useMemo(() => {
    if (!browserSupabaseUrl || !browserSupabaseKey) return null;

    return createClient(browserSupabaseUrl, browserSupabaseKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      if (data.session) {
        setStatus('ready');
        setMessage('Digite uma nova senha para concluir a recuperação.');
      } else {
        setStatus('error');
        setMessage('Este link expirou ou já foi usado. Solicite um novo link no portal.');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready');
        setMessage('Digite uma nova senha para concluir a recuperação.');
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!supabase) return;

    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (password.length < 6) {
      setStatus('error');
      setMessage('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('As senhas não conferem.');
      return;
    }

    setStatus('submitting');
    setMessage('Atualizando sua senha...');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus('error');
      setMessage('Não foi possível atualizar a senha. Solicite um novo link e tente novamente.');
      return;
    }

    await supabase.auth.signOut();
    form.reset();
    setStatus('success');
    setMessage('Senha atualizada com sucesso. Volte ao portal e entre com sua nova senha.');
  }

  const isReady = status === 'ready' || status === 'submitting' || status === 'error';

  return (
    <section className="rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Recuperação de senha</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] sm:text-4xl">
        Crie uma nova senha para acessar o portal.
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        Use uma senha com pelo menos 6 caracteres. Depois, volte ao portal e entre normalmente.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <Field label="Nova senha" name="password" type="password" autoComplete="new-password" disabled={!isReady || status === 'submitting'} />
        <Field label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" disabled={!isReady || status === 'submitting'} />
        <button
          type="submit"
          disabled={!isReady || status === 'submitting'}
          className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'submitting' ? 'Atualizando...' : 'Salvar nova senha'}
        </button>
      </form>

      <p className={`mt-4 text-sm font-semibold ${status === 'error' ? 'text-red-700' : 'text-[#14508B]'}`}>
        {message}
      </p>

      <a href="/portal" className="mt-6 inline-flex w-fit rounded-full border border-[#14508B]/20 px-5 py-2.5 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
        Voltar ao portal
      </a>
    </section>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  disabled,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        minLength={6}
        className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}
