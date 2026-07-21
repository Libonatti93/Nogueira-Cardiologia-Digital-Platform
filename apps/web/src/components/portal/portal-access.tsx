'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Feedback = {
  status: Status;
  message: string;
  verifyUrl?: string;
};

const initialFeedback: Feedback = { status: 'idle', message: '' };

class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function submitJson(endpoint: string, form: HTMLFormElement, extra?: Record<string, string>) {
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ...extra }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(body?.message ?? 'Não foi possível concluir agora.', body?.code);
  }

  return body;
}

export function PortalAccess({ initialNotice }: { initialNotice?: string }) {
  const [mode, setMode] = useState<'signup' | 'login' | 'forgot'>(initialNotice ? 'login' : 'signup');
  const [patientSignup, setPatientSignup] = useState<Feedback>(initialFeedback);
  const [patientLogin, setPatientLogin] = useState<Feedback>(
    initialNotice ? { status: 'success', message: initialNotice } : initialFeedback,
  );
  const [passwordReset, setPasswordReset] = useState<Feedback>(initialFeedback);
  const [resendEmail, setResendEmail] = useState('');

  async function handlePatientSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPatientSignup({ status: 'submitting', message: 'Criando cadastro...' });

    try {
      const body = await submitJson('/api/auth/signup', event.currentTarget);
      setResendEmail(String(new FormData(event.currentTarget).get('email') ?? ''));
      setPatientSignup({
        status: 'success',
        message: body?.message ?? 'Cadastro criado com sucesso.',
        verifyUrl: body?.verifyUrl,
      });
      setMode('login');
      event.currentTarget.reset();
    } catch (error) {
      setPatientSignup({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível criar o cadastro.' });
    }
  }

  async function handlePatientLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPatientLogin({ status: 'submitting', message: 'Entrando no portal...' });

    try {
      const body = await submitJson('/api/auth/login', event.currentTarget, { portal: 'patient' });
      setPatientLogin({ status: 'success', message: 'Acesso liberado. Abrindo o portal do paciente...' });
      window.location.href = body?.redirectTo ?? '/portal/paciente';
    } catch (error) {
      if (error instanceof ApiError && error.code === 'email_not_verified') {
        setResendEmail(String(new FormData(event.currentTarget).get('email') ?? ''));
      }
      setPatientLogin({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível entrar.' });
    }
  }

  async function handleResendVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPatientLogin({ status: 'submitting', message: 'Enviando novo link...' });

    try {
      const body = await submitJson('/api/auth/resend-verification', event.currentTarget);
      setPatientLogin({
        status: 'success',
        message: body?.message ?? 'Se houver cadastro pendente, enviaremos um novo link.',
        verifyUrl: body?.verifyUrl,
      });
    } catch (error) {
      setPatientLogin({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível reenviar o link.' });
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordReset({ status: 'submitting', message: 'Enviando link de recuperação...' });

    try {
      const body = await submitJson('/api/auth/forgot-password', event.currentTarget);
      setPasswordReset({
        status: 'success',
        message: body?.message ?? 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.',
      });
    } catch (error) {
      setPasswordReset({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível enviar o link.' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Paciente</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#0F3760] sm:text-3xl">
          Crie seu acesso gratuito para marcar consulta e preparar seus exames.
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Entre com e-mail e senha ou cadastre-se em poucos segundos. A confirmação por e-mail protege seu acesso e libera recursos do portal.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#F4F9FF] p-1">
          <ModeButton active={mode === 'signup'} onClick={() => setMode('signup')}>
            Criar cadastro
          </ModeButton>
          <ModeButton active={mode === 'login' || mode === 'forgot'} onClick={() => setMode('login')}>
            Já tenho acesso
          </ModeButton>
        </div>

        {mode === 'signup' ? (
          <form onSubmit={handlePatientSignup} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" name="fullName" autoComplete="name" placeholder="Seu nome" />
              <Field label="WhatsApp" name="phoneWhatsapp" type="tel" autoComplete="tel" placeholder="(17) 99999-9999" />
            </div>
            <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" />
            <Field
              label="Senha"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              helpText="Use pelo menos 6 caracteres. Você pode trocar essa senha depois se precisar."
              minLength={6}
            />
            <SubmitButton loading={patientSignup.status === 'submitting'}>Criar acesso</SubmitButton>
            <FeedbackMessage feedback={patientSignup} />
          </form>
        ) : mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="mt-6 grid gap-4 rounded-2xl border border-[#14508B]/12 bg-[#F4F9FF] p-4">
            <div>
              <h3 className="font-semibold text-[#0F3760]">Esqueci minha senha</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Informe o e-mail cadastrado. Se ele existir no portal, enviaremos um link para criar uma nova senha.
              </p>
            </div>
            <Field label="E-mail cadastrado" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SubmitButton loading={passwordReset.status === 'submitting'}>Enviar link de recuperação</SubmitButton>
              <button type="button" onClick={() => setMode('login')} className="w-fit text-sm font-bold text-[#14508B] hover:text-[#0F3760]">
                Voltar para login
              </button>
            </div>
            <FeedbackMessage feedback={passwordReset} />
          </form>
        ) : (
          <>
            <form onSubmit={handlePatientLogin} className="mt-4 grid gap-4">
              <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" />
              <Field label="Senha" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SubmitButton loading={patientLogin.status === 'submitting'}>Entrar no portal do paciente</SubmitButton>
                <button type="button" onClick={() => setMode('forgot')} className="w-fit text-sm font-bold text-[#14508B] hover:text-[#0F3760]">
                  Esqueci minha senha
                </button>
              </div>
              <FeedbackMessage feedback={patientLogin} />
            </form>
          {resendEmail ? (
            <form onSubmit={handleResendVerification} className="mt-4 rounded-2xl border border-[#14508B]/12 bg-[#F4F9FF] p-4">
              <input type="hidden" name="email" value={resendEmail} />
              <p className="text-sm leading-6 text-slate-600">
                Precisa de outro link de confirmação para <strong>{resendEmail}</strong>?
              </p>
              <button
                type="submit"
                disabled={patientLogin.status === 'submitting'}
                className="mt-3 inline-flex w-fit rounded-full border border-[#14508B]/20 bg-white px-4 py-2 text-xs font-bold text-[#14508B] hover:border-[#14508B]/55 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Reenviar confirmação
              </button>
            </form>
          ) : null}
          </>
        )}
      </section>

      <section className="rounded-3xl bg-[#0A2C4D] p-6 text-white shadow-[0_26px_70px_-48px_rgba(20,80,139,0.85)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9FE6FF]">Jornada digital</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
          Tecnologia para facilitar consulta, exames e cuidado cardiológico.
        </h2>
        <div className="mt-6 grid gap-4">
          {[
            ['Cadastro seguro', 'Crie sua conta com e-mail confirmado, WhatsApp e senha protegida.'],
            ['Consulta cardiológica', 'Solicite atendimento e organize dados importantes antes da avaliação médica.'],
            ['Envio de exames', 'Anexe laudos, PDFs e imagens para adiantar sua documentação clínica.'],
            ['Conteúdo educativo', 'Acesse informações sobre pressão alta, check-up cardiológico, prevenção e saúde do coração.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/14 bg-white/8 p-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/78">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
        active ? 'bg-white text-[#0F3760] shadow-[0_12px_28px_-24px_rgba(20,80,139,0.9)]' : 'text-slate-500 hover:text-[#14508B]'
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  helpText,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  helpText?: string;
  minLength?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
        placeholder={placeholder}
      />
      {helpText ? <span className="text-xs font-normal leading-5 text-slate-500">{helpText}</span> : null}
    </label>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0F3760] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? 'Aguarde...' : children}
    </button>
  );
}

function FeedbackMessage({ feedback, dark = false }: { feedback: Feedback; dark?: boolean }) {
  if (feedback.status === 'idle') return null;

  const color = feedback.status === 'error' ? (dark ? 'text-red-100' : 'text-red-700') : dark ? 'text-[#9FE6FF]' : 'text-[#14508B]';

  return (
    <div className={`grid gap-2 text-sm font-semibold ${color}`}>
      <p>{feedback.message}</p>
      {feedback.verifyUrl ? (
        <a className="break-all rounded-2xl bg-[#EAF7FF] p-3 text-xs text-[#0F3760] underline" href={feedback.verifyUrl}>
          Link de teste: {feedback.verifyUrl}
        </a>
      ) : null}
    </div>
  );
}
