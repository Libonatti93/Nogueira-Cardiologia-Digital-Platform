'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type Feedback = {
  status: Status;
  message: string;
};

const initialFeedback: Feedback = { status: 'idle', message: '' };

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
    throw new Error(body?.message ?? 'Não foi possível concluir agora.');
  }

  return body;
}

export function PortalAccess() {
  const [patientSignup, setPatientSignup] = useState<Feedback>(initialFeedback);
  const [patientLogin, setPatientLogin] = useState<Feedback>(initialFeedback);
  const [adminLogin, setAdminLogin] = useState<Feedback>(initialFeedback);

  async function handlePatientSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPatientSignup({ status: 'submitting', message: 'Criando cadastro...' });

    try {
      const body = await submitJson('/api/auth/signup', event.currentTarget);
      setPatientSignup({ status: 'success', message: body?.message ?? 'Cadastro criado com sucesso.' });
    } catch (error) {
      setPatientSignup({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível criar o cadastro.' });
    }
  }

  async function handlePatientLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPatientLogin({ status: 'submitting', message: 'Entrando no portal...' });

    try {
      await submitJson('/api/auth/login', event.currentTarget, { portal: 'patient' });
      setPatientLogin({ status: 'success', message: 'Acesso liberado. Em breve esta tela exibirá agenda e conteúdos exclusivos do paciente.' });
    } catch (error) {
      setPatientLogin({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível entrar.' });
    }
  }

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminLogin({ status: 'submitting', message: 'Validando acesso médico/admin...' });

    try {
      await submitJson('/api/auth/login', event.currentTarget, { portal: 'admin' });
      setAdminLogin({ status: 'success', message: 'Acesso médico validado. O próximo passo é conectar o editor diário de conteúdos educativos.' });
    } catch (error) {
      setAdminLogin({ status: 'error', message: error instanceof Error ? error.message : 'Não foi possível entrar.' });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Paciente</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#0F3760] sm:text-3xl">
          Cadastre-se gratuitamente para marcar consulta e acessar conteúdos educativos.
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          O cadastro cria a base do portal do paciente: agendamento, comunicação com a clínica e acesso aos materiais da Nogueira Cardiologia.
        </p>

        <form onSubmit={handlePatientSignup} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" name="fullName" autoComplete="name" placeholder="Seu nome" />
            <Field label="WhatsApp" name="phoneWhatsapp" type="tel" autoComplete="tel" placeholder="(17) 99999-9999" />
          </div>
          <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" />
          <Field label="Senha" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
          <SubmitButton loading={patientSignup.status === 'submitting'}>Criar acesso e marcar consulta</SubmitButton>
          <FeedbackMessage feedback={patientSignup} />
        </form>

        <div className="mt-8 border-t border-[#14508B]/10 pt-6">
          <h3 className="font-semibold text-[#0F3760]">Já tenho cadastro</h3>
          <form onSubmit={handlePatientLogin} className="mt-4 grid gap-4">
            <Field label="E-mail" name="email" type="email" autoComplete="email" placeholder="seuemail@exemplo.com" />
            <Field label="Senha" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" />
            <SubmitButton loading={patientLogin.status === 'submitting'}>Entrar no portal do paciente</SubmitButton>
            <FeedbackMessage feedback={patientLogin} />
          </form>
        </div>
      </section>

      <section className="rounded-3xl bg-[#0A2C4D] p-6 text-white shadow-[0_26px_70px_-48px_rgba(20,80,139,0.85)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9FE6FF]">Médico / admin</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
          Acesso restrito para agenda, conteúdos educativos e gestão da clínica.
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/80">
          Este acesso será usado pelo Dr. Paulo, Dra. Cristiani e administradores para publicar materiais, gerenciar imagens e acompanhar a operação digital.
        </p>

        <form onSubmit={handleAdminLogin} className="mt-6 grid gap-4">
          <DarkField label="E-mail institucional" name="email" type="email" autoComplete="email" placeholder="medico@nogueira..." />
          <DarkField label="Senha" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" />
          <button
            type="submit"
            disabled={adminLogin.status === 'submitting'}
            className="inline-flex w-fit rounded-full bg-white px-6 py-3 text-sm font-bold text-[#14508B] transition-colors hover:bg-[#EAF6FF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {adminLogin.status === 'submitting' ? 'Validando...' : 'Entrar como médico/admin'}
          </button>
          <FeedbackMessage feedback={adminLogin} dark />
        </form>

        <div className="mt-8 rounded-2xl border border-white/14 bg-white/8 p-5">
          <h3 className="font-semibold">Próxima etapa do painel</h3>
          <p className="mt-2 text-sm leading-7 text-white/78">
            Depois das variáveis do Supabase configuradas, o painel poderá receber o editor de conteúdos com upload de imagem, rascunho, publicação e histórico.
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
        placeholder={placeholder}
      />
    </label>
  );
}

function DarkField({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#9FE6FF] focus:ring-2"
        placeholder={placeholder}
      />
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

  return <p className={`text-sm font-semibold ${color}`}>{feedback.message}</p>;
}
