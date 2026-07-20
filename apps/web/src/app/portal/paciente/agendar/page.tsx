import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';

const healthQuestions = [
  ['hasHypertension', 'Você tem hipertensão arterial, também conhecida como pressão alta?'],
  ['hasDiabetes', 'Você tem diabetes?'],
  ['hasHighCholesterol', 'Você tem colesterol alto?'],
  ['isSmoker', 'Você fuma ou é tabagista?'],
] as const;

export default async function PatientSchedulePage() {
  const user = await requirePatientUser();

  return (
    <PortalShell>
      <div className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Agendamento</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
          Dados para solicitar sua consulta.
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          Esta etapa prepara o checkout e ajuda a equipe da Nogueira Cardiologia a organizar seu atendimento com mais segurança.
        </p>
      </div>

      <form action="/api/appointments" method="post" className="mt-8 grid gap-6 rounded-3xl border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)] sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" name="fullName" autoComplete="name" defaultValue={user.fullName} />
          <Field label="CPF" name="cpf" placeholder="000.000.000-00" />
          <Field label="WhatsApp" name="phoneWhatsapp" type="tel" autoComplete="tel" />
          <Field label="E-mail" name="email" type="email" autoComplete="email" defaultValue={user.email} />
          <Field label="Data de nascimento" name="birthDate" type="date" />
          <Field label="Altura em cm" name="heightCm" type="number" placeholder="Ex: 175" />
          <Field label="Peso em kg" name="weightKg" type="number" placeholder="Ex: 82" />
          <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
            Médico de preferência
            <select name="doctorPreference" className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2">
              <option>Dr. Paulo Roberto Nogueira</option>
              <option>Dra. Cristiani Nogueira</option>
              <option>Primeiro horário disponível</option>
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

        <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
          <input name="lgpdConsent" type="checkbox" value="true" required className="mt-1 h-4 w-4 accent-[#14508B]" />
          <span>Autorizo o uso dos meus dados para cadastro, agendamento, contato da clínica, processamento de pagamento e organização do atendimento, conforme a política de privacidade.</span>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
            Continuar para pagamento
          </button>
          <Link href="/portal/paciente" className="text-sm font-bold text-[#14508B] hover:text-[#0F3760]">
            Voltar ao portal
          </Link>
        </div>
      </form>
    </PortalShell>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-2xl border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
      />
    </label>
  );
}
