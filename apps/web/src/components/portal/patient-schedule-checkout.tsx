'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type PatientScheduleCheckoutProps = {
  user: {
    fullName: string;
    email: string;
  };
  amountCents: number;
};

const healthQuestions = [
  ['hasHypertension', 'Você tem hipertensão arterial, também conhecida como pressão alta?'],
  ['hasDiabetes', 'Você tem diabetes?'],
  ['hasHighCholesterol', 'Você tem colesterol alto?'],
  ['isSmoker', 'Você fuma ou e tabagista?'],
] as const;

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function PatientScheduleCheckout({ user, amountCents }: PatientScheduleCheckoutProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const amountLabel = useMemo(() => formatMoney(amountCents), [amountCents]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        cpf: onlyDigits(String(payload.cpf ?? '')),
        phoneWhatsapp: onlyDigits(String(payload.phoneWhatsapp ?? '')),
        cardNumber: onlyDigits(String(payload.cardNumber ?? '')),
        cardCvv: onlyDigits(String(payload.cardCvv ?? '')),
        holderCpf: onlyDigits(String(payload.holderCpf ?? '')),
        holderPostalCode: onlyDigits(String(payload.holderPostalCode ?? '')),
      }),
    });

    const result = (await response.json().catch(() => null)) as
      | { ok?: boolean; message?: string; data?: { paymentId?: string } }
      | null;

    if (!response.ok || !result?.ok || !result.data?.paymentId) {
      setError(result?.message ?? 'Não foi possível concluir o pagamento. Confira os dados e tente novamente.');
      setSubmitting(false);
      return;
    }

    router.push(`/portal/paciente/agendar/confirmacao?paymentId=${result.data.paymentId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6 rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo" name="fullName" autoComplete="name" defaultValue={user.fullName} />
        <Field label="CPF" name="cpf" placeholder="000.000.000-00" inputMode="numeric" />
        <Field label="WhatsApp" name="phoneWhatsapp" type="tel" autoComplete="tel" />
        <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={user.email} />
        <Field label="Data de nascimento" name="birthDate" type="date" />
        <Field label="Altura em cm" name="heightCm" type="number" placeholder="Ex: 175" />
        <Field label="Peso em kg" name="weightKg" type="number" placeholder="Ex: 82" />
        <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
          Médico de preferência
          <select name="doctorPreference" className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2">
            <option value="paulo">Dr. Paulo Roberto Nogueira</option>
            <option value="cristiani">Dra. Cristiani Nogueira</option>
            <option value="first-available">Primeiro horário disponivel</option>
          </select>
        </label>
      </div>

      <section className="rounded-2xl bg-[#F4F9FF] p-5">
        <h2 className="font-semibold text-[#0F3760]">Informações de saúde</h2>
        <div className="mt-4 grid gap-3">
          {healthQuestions.map(([name, label]) => (
            <label key={name} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
              <input name={name} type="checkbox" value="true" className="mt-1 h-4 w-4 accent-[#14508B]" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-5 rounded-2xl border border-[#14508B]/12 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#0F3760]">Pagamento da consulta</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Cartao de credito processado diretamente pelo Asaas.</p>
          </div>
          <strong className="text-xl text-[#14508B]">{amountLabel}</strong>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome impresso no cartão" name="cardHolderName" autoComplete="cc-name" />
          <Field label="Número do cartão" name="cardNumber" autoComplete="cc-number" inputMode="numeric" />
          <Field label="Mês de validade" name="cardExpiryMonth" placeholder="MM" autoComplete="cc-exp-month" inputMode="numeric" maxLength={2} />
          <Field label="Ano de validade" name="cardExpiryYear" placeholder="AAAA" autoComplete="cc-exp-year" inputMode="numeric" maxLength={4} />
          <Field label="CVV" name="cardCvv" autoComplete="cc-csc" inputMode="numeric" maxLength={4} />
          <Field label="CPF do titular" name="holderCpf" inputMode="numeric" />
          <Field label="CEP do titular" name="holderPostalCode" inputMode="numeric" />
          <Field label="Número do endereço" name="holderAddressNumber" />
          <label className="grid gap-2 text-sm font-semibold text-[#103E6A] sm:col-span-2">
            Complemento
            <input
              name="holderAddressComplement"
              className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
            />
          </label>
        </div>
      </section>

      <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
        <input name="lgpdConsent" type="checkbox" value="true" required className="mt-1 h-4 w-4 accent-[#14508B]" />
        <span>Autorizo o uso dos meus dados para cadastro, agendamento, contato da clínica, processamento de pagamento e organização do atendimento, conforme a política de privacidade.</span>
      </label>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760] disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? 'Processando...' : 'Confirmar e pagar'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  defaultValue,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  inputMode?: 'numeric';
  maxLength?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={name !== 'holderAddressComplement'}
        placeholder={placeholder}
        defaultValue={defaultValue}
        inputMode={inputMode}
        maxLength={maxLength}
        className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
      />
    </label>
  );
}
