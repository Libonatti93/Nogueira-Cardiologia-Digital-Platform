import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';

export default function PatientDashboardPage() {
  return (
    <PortalShell>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Portal do paciente</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
            Complete seus dados e solicite sua consulta cardiológica.
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            Para agendar, a Nogueira Cardiologia precisa confirmar dados cadastrais e informações simples de risco cardiovascular. Esses dados ajudam a organizar o atendimento e a jornada do paciente.
          </p>
          <Link href="/portal/paciente/agendar" className="mt-7 inline-flex rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
            Iniciar agendamento
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Cadastro', 'CPF, data de nascimento, altura, peso e contato.'],
            ['Risco cardiovascular', 'Hipertensão, diabetes, colesterol alto e tabagismo.'],
            ['Pagamento', 'Checkout transparente com Asaas será conectado aqui.'],
            ['Confirmação', 'Secretária acompanha o lead e confirma a consulta.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
              <h2 className="text-lg font-semibold text-[#0F3760]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
