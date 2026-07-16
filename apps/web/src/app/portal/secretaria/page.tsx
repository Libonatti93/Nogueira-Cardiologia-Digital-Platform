import { PortalShell } from '@/components/dashboard/portal-shell';
import { pipelineStages } from '@/data/dashboard';

export default function SecretaryDashboardPage() {
  return (
    <PortalShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">CRM da secretária</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
            Funil comercial para acompanhar leads e agendamentos.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            A secretária acompanha cada lead em etapas, registra contatos, envia WhatsApp e organiza pagamentos pendentes até a consulta confirmada.
          </p>
        </div>
        <button className="w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white">
          Novo lead
        </button>
      </div>

      <section className="mt-8 grid gap-4 xl:grid-cols-4">
        {pipelineStages.map((stage) => (
          <div key={stage.id} className="rounded-3xl border border-[#14508B]/12 bg-white p-4 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#0F3760]">{stage.title}</h2>
              <span className="rounded-full bg-[#F4F9FF] px-3 py-1 text-xs font-bold text-[#14508B]">{stage.leads.length}</span>
            </div>
            <div className="mt-4 grid gap-3">
              {stage.leads.map((lead) => (
                <article key={lead.phone} className="rounded-2xl border border-[#14508B]/10 bg-[#F8FBFF] p-4">
                  <h3 className="font-semibold text-[#0F3760]">{lead.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{lead.phone}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{lead.source}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{lead.note}</p>
                  <a
                    href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm font-bold text-[#14508B]"
                  >
                    Chamar no WhatsApp
                  </a>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </PortalShell>
  );
}
