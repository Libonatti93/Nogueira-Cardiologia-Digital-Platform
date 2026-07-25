'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { resetTurnstile, TurnstileWidget } from '@/components/security/turnstile-widget';

type PatientScheduleCheckoutProps = {
  user: {
    fullName: string;
    email: string;
  };
  amountCents: number;
  occupiedSlots: Array<{ doctor: string; iso: string }>;
};

const healthQuestions = [
  ['hasHypertension', 'Você tem hipertensão arterial, também conhecida como pressão alta?'],
  ['hasDiabetes', 'Você tem diabetes?'],
  ['hasHighCholesterol', 'Você tem colesterol alto?'],
  ['isSmoker', 'Você fuma ou é tabagista?'],
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

const doctorOptions = [
  {
    value: 'paulo',
    name: 'Dr. Paulo Nogueira',
    crm: 'CRM 53.790/SP',
    focus: 'Cardiologia clínica e prevenção cardiovascular',
    image: '/brand/dr-paulo-roberto-nogueira.jpeg',
    availability: 'Ainda tenho horários disponíveis',
  },
  {
    value: 'cristiani',
    name: 'Dra. Cristiani Nogueira',
    crm: 'CRM 77.127/SP',
    focus: 'Cardiologia clínica, hipertensão e saúde da mulher',
    image: '/brand/dra-cristiani-monteiro-de-oliveira-nogueira.jpeg',
    availability: 'Ainda tenho horários disponíveis',
  },
] as const;

const appointmentTimes = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

const acceptedCardBrands = [
  { name: 'Visa', image: '/payment-brands/visa.png', width: 69, height: 38 },
  { name: 'Mastercard', image: '/payment-brands/mastercard.png', width: 50, height: 38 },
  { name: 'Elo', image: '/payment-brands/elo.png', width: 67, height: 38 },
  { name: 'American Express', image: '/payment-brands/american-express.png', width: 94, height: 38 },
] as const;

export function PatientScheduleCheckout({ user, amountCents, occupiedSlots }: PatientScheduleCheckoutProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doctor, setDoctor] = useState<'paulo' | 'cristiani'>('paulo');
  const availableDays = useMemo(() => getAvailableDays(), []);
  const [selectedDate, setSelectedDate] = useState(availableDays[0]?.value ?? '');
  const [selectedTime, setSelectedTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const amountLabel = useMemo(() => formatMoney(amountCents), [amountCents]);
  const selectedDoctor = doctorOptions.find((option) => option.value === doctor)!;
  const visibleTimes = appointmentTimes.filter((time) => !isOccupied(occupiedSlots, doctor, selectedDate, time));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!selectedDate || !selectedTime) {
      setError('Escolha uma data e um horário para continuar.');
      return;
    }

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
        doctorPreference: doctor,
        scheduledFor: `${selectedDate}T${selectedTime}:00-03:00`,
        paymentMethod,
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
      resetTurnstile();
      setSubmitting(false);
      return;
    }

    router.push(`/portal/paciente/agendar/confirmacao?paymentId=${result.data.paymentId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#14508B] text-sm font-bold text-white">1</span>
          <h2 className="text-xl font-semibold text-[#0F3760]">Escolha o cardiologista</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {doctorOptions.map((option) => {
            const active = doctor === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setDoctor(option.value);
                  setSelectedTime('');
                }}
                className={`rounded-2xl border p-5 text-left transition ${
                  active ? 'border-[#14508B] bg-[#EAF4FF] ring-2 ring-[#14508B]/10' : 'border-slate-200 hover:border-[#14508B]/35'
                }`}
              >
                <span className="flex items-center gap-4">
                  <span className="relative shrink-0">
                    <span
                      className="absolute -inset-1 animate-pulse rounded-full bg-emerald-400/45"
                      aria-hidden="true"
                    />
                    <Image
                      src={option.image}
                      alt={`Foto de ${option.name}`}
                      width={80}
                      height={80}
                      className="relative h-20 w-20 rounded-full border-[3px] border-emerald-500 object-cover shadow-md"
                    />
                    <span
                      className="absolute bottom-1 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500"
                      aria-label="Com horários disponíveis"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#0F3760]">{option.name}</span>
                    <span className="mt-1 block text-xs font-semibold text-[#15A7DD]">{option.crm}</span>
                    <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {option.availability}
                    </span>
                  </span>
                </span>
                <span className="mt-4 block border-t border-slate-200/80 pt-3 text-sm leading-6 text-slate-600">{option.focus}</span>
                <span className={`mt-3 block text-xs font-bold ${active ? 'text-[#14508B]' : 'text-slate-400'}`}>
                  {active ? '✓ Médico selecionado' : 'Escolher este médico'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#14508B] text-sm font-bold text-white">2</span>
            <div>
              <h2 className="text-xl font-semibold text-[#0F3760]">Escolha o dia e o horário</h2>
              <p className="mt-1 text-sm text-slate-500">Agenda de {selectedDoctor.name}</p>
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r sm:p-7">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {availableDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.value);
                    setSelectedTime('');
                  }}
                  className={`rounded-xl px-2 py-3 text-center transition ${
                    selectedDate === day.value ? 'bg-[#14508B] text-white shadow-md' : 'bg-[#F6F8FB] text-slate-600 hover:bg-[#EAF4FF]'
                  }`}
                >
                  <span className="block text-[11px] font-bold uppercase">{day.weekday}</span>
                  <span className="mt-1 block text-xl font-semibold">{day.day}</span>
                  <span className="block text-xs">{day.month}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {visibleTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    selectedTime === time
                      ? 'border-[#14508B] bg-[#14508B] text-white'
                      : 'border-slate-200 text-[#14508B] hover:border-[#14508B] hover:bg-[#EAF4FF]'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
            {!visibleTimes.length ? <p className="mt-5 text-sm text-slate-500">Não há horários livres neste dia. Escolha outra data.</p> : null}
          </div>
          <aside className="bg-[#F8FBFF] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Sua escolha</p>
            <p className="mt-4 font-semibold text-[#0F3760]">{selectedDoctor.name}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedDate ? formatSelectedDate(selectedDate) : 'Escolha uma data'}
              <br />
              {selectedTime ? `às ${selectedTime}` : 'Escolha um horário'}
            </p>
            <p className="mt-5 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
              Duração: 60 minutos. Chegue com 10 minutos de antecedência.
            </p>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#14508B] text-sm font-bold text-white">3</span>
          <div>
            <h2 className="text-xl font-semibold text-[#0F3760]">Confirme seus dados</h2>
            <p className="mt-1 text-sm text-slate-500">Usaremos essas informações somente para o seu atendimento.</p>
          </div>
        </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="1. Qual é o seu nome completo?" name="fullName" autoComplete="name" defaultValue={user.fullName} />
        <Field label="2. Qual é o seu CPF?" name="cpf" placeholder="000.000.000-00" inputMode="numeric" />
        <Field label="3. Qual é o seu WhatsApp?" name="phoneWhatsapp" type="tel" autoComplete="tel" placeholder="(17) 99999-9999" />
        <Field label="4. Qual é o seu e-mail?" name="email" type="email" autoComplete="email" defaultValue={user.email} />
        <Field label="5. Qual é a sua data de nascimento?" name="birthDate" type="date" />
        <Field label="6. Qual é a sua altura?" name="heightCm" type="number" placeholder="Em centímetros. Ex.: 175" />
        <Field label="7. Qual é o seu peso?" name="weightKg" type="number" placeholder="Em quilos. Ex.: 82" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#14508B]/10 bg-[#F4F9FF]">
        <div className="flex flex-col gap-4 bg-[#0F3760] p-5 text-white sm:flex-row sm:items-center">
          <span className="relative h-20 w-20 shrink-0">
            <span className="absolute -inset-1 rounded-full bg-[#9FE6FF]/35" aria-hidden="true" />
            <Image
              src={selectedDoctor.image}
              alt={`Foto de ${selectedDoctor.name}`}
              fill
              sizes="80px"
              className="rounded-full border-[3px] border-white object-cover object-top shadow-lg"
            />
            <span className="absolute bottom-1 right-0 z-10 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" aria-label={`${selectedDoctor.name} está online`} />
          </span>
          <div className="relative rounded-2xl bg-white p-4 text-[#0F3760] shadow-sm">
            <span className="absolute -left-2 top-6 hidden h-4 w-4 rotate-45 bg-white sm:block" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#15A7DD]">{selectedDoctor.name}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
              Online • perguntando para você
            </p>
            <h3 className="mt-1 font-semibold">Antes da consulta, preciso conhecer um pouco melhor sua saúde.</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">São apenas quatro perguntas rápidas. Marque “Sim” ou “Não” em todas elas.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4">
          {healthQuestions.map(([name, label], index) => (
            <fieldset key={name} className="mx-5 rounded-2xl border border-[#14508B]/10 bg-white p-4 shadow-sm last:mb-5 sm:p-5">
              <legend className="sr-only">{label}</legend>
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EAF4FF] text-xs font-bold text-[#14508B]" aria-hidden="true">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm font-semibold leading-6 text-slate-700">{label}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  ['true', 'Sim'],
                  ['false', 'Não'],
                ].map(([value, text]) => (
                  <label key={value} className="cursor-pointer">
                    <input className="peer sr-only" type="radio" name={name} value={value} required />
                    <span className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FBFF] px-4 text-sm font-bold text-slate-600 transition hover:border-[#14508B]/40 peer-checked:border-[#14508B] peer-checked:bg-[#14508B] peer-checked:text-white">
                      {text}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      </section>

      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#14508B] text-sm font-bold text-white">4</span>
              <h2 className="text-xl font-semibold text-[#0F3760]">Pagamento seguro</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Seus dados são enviados de forma protegida ao processador de pagamentos.</p>
          </div>
          <div className="text-right">
            <span className="block text-sm text-slate-400 line-through">R$ 990,00</span>
            <strong className="block text-2xl text-[#14508B]">{amountLabel}</strong>
            <span className="text-xs font-bold text-emerald-700">Cupom online aplicado</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-800">Benefício exclusivo do cadastro online</p>
          <p className="mt-1 text-sm leading-6 text-emerald-700">
            Consulta cardiológica de 60 minutos: de R$ 990,00 por R$ 749,00. O desconto já foi aplicado.
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-[#103E6A]">Como você prefere pagar?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PaymentChoice
              active={paymentMethod === 'pix'}
              title="PIX"
              description="Pague pelo aplicativo do seu banco"
              badge="Confirmação rápida"
              onClick={() => setPaymentMethod('pix')}
            />
            <PaymentChoice
              active={paymentMethod === 'credit_card'}
              title="Cartão de crédito"
              description="Pagamento à vista"
              badge="1x de R$ 749,00"
              showCardBrands
              onClick={() => setPaymentMethod('credit_card')}
            />
          </div>
        </fieldset>

        {paymentMethod === 'pix' ? (
          <div className="rounded-2xl bg-[#F4F9FF] p-5">
            <p className="font-semibold text-[#0F3760]">Como funciona o PIX?</p>
            <ol className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
              <li>1. Clique em “Gerar PIX e reservar horário”.</li>
              <li>2. Copie o código PIX ou abra a cobrança segura.</li>
              <li>3. Pague no aplicativo do seu banco e aguarde a confirmação.</li>
            </ol>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome escrito no cartão" name="cardHolderName" autoComplete="cc-name" />
              <Field label="Número do cartão" name="cardNumber" autoComplete="cc-number" inputMode="numeric" />
              <Field label="Mês de validade" name="cardExpiryMonth" placeholder="MM" autoComplete="cc-exp-month" inputMode="numeric" maxLength={2} />
              <Field label="Ano de validade" name="cardExpiryYear" placeholder="AAAA" autoComplete="cc-exp-year" inputMode="numeric" maxLength={4} />
              <Field label="Código de segurança (CVV)" name="cardCvv" autoComplete="cc-csc" inputMode="numeric" maxLength={4} />
              <Field label="CPF do titular do cartão" name="holderCpf" inputMode="numeric" />
              <Field label="CEP do titular do cartão" name="holderPostalCode" inputMode="numeric" />
              <Field label="Número do endereço" name="holderAddressNumber" />
              <label className="grid gap-2 text-sm font-semibold text-[#103E6A] sm:col-span-2">
                Complemento (opcional)
                <input
                  name="holderAddressComplement"
                  className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
                />
              </label>
          </div>
        )}

        <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-xl" aria-hidden="true">🔒</span>
          <div>
            <p className="text-sm font-bold text-slate-700">Ambiente seguro</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Conexão criptografada. O pagamento é processado pelo Asaas e a clínica não armazena os dados completos do seu cartão.
            </p>
          </div>
        </div>
      </section>

      <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
        <input name="lgpdConsent" type="checkbox" value="true" required className="mt-1 h-4 w-4 accent-[#14508B]" />
        <span>Autorizo o uso dos meus dados para cadastro, agendamento, contato da clínica, processamento de pagamento e organização do atendimento, conforme a política de privacidade.</span>
      </label>

      <TurnstileWidget action="appointment-checkout" />

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
          {submitting
            ? 'Confirmando sua consulta...'
            : paymentMethod === 'pix'
              ? `Gerar PIX e reservar horário · ${amountLabel}`
              : `Pagar em 1x e reservar · ${amountLabel}`}
        </button>
        <span className="text-xs leading-5 text-slate-500">Ao concluir, você verá o resumo da consulta nesta tela.</span>
      </div>
    </form>
  );
}

function PaymentChoice({
  active,
  title,
  description,
  badge,
  showCardBrands = false,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  badge: string;
  showCardBrands?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? 'border-[#14508B] bg-[#EAF4FF] ring-2 ring-[#14508B]/10' : 'border-slate-200 hover:border-[#14508B]/35'
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span>
          <strong className="block text-[#0F3760]">{title}</strong>
          <span className="mt-2 block text-sm text-slate-600">{description}</span>
        </span>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-black transition ${
            active
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
              : 'border-slate-300 bg-white text-transparent'
          }`}
          aria-hidden="true"
        >
          ✓
        </span>
      </span>
      <span className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#14508B]">{badge}</span>
        {showCardBrands ? (
          <span className="flex shrink-0 flex-nowrap items-center justify-end gap-1">
            {acceptedCardBrands.map((brand) => (
              <span key={brand.name} className="grid h-7 w-9 shrink-0 place-items-center rounded-md border border-slate-200 bg-white px-1 shadow-sm">
                <Image
                  src={brand.image}
                  alt={brand.name}
                  width={brand.width}
                  height={brand.height}
                  className="max-h-5 max-w-8 object-contain"
                />
              </span>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function getAvailableDays() {
  const days: Array<{ value: string; weekday: string; day: string; month: string }> = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (days.length < 10) {
    cursor.setDate(cursor.getDate() + 1);
    const weekdayNumber = cursor.getDay();
    if (weekdayNumber === 0 || weekdayNumber === 6) continue;

    const value = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, '0'),
      String(cursor.getDate()).padStart(2, '0'),
    ].join('-');
    days.push({
      value,
      weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(cursor).replace('.', ''),
      day: String(cursor.getDate()).padStart(2, '0'),
      month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(cursor).replace('.', ''),
    });
  }

  return days;
}

function isOccupied(
  occupiedSlots: PatientScheduleCheckoutProps['occupiedSlots'],
  doctor: string,
  date: string,
  time: string,
) {
  return occupiedSlots.some((slot) => {
    if (slot.doctor !== doctor) return false;
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(slot.iso));
    return formatted.startsWith(`${date}, ${time}`);
  });
}

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
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
