import type { Metadata } from 'next';
import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Meus Exames | Portal do Paciente',
  description: 'Envie exames e documentos para adiantar a avaliacao da equipe medica da Nogueira Cardiologia.',
};

export const dynamic = 'force-dynamic';

type PatientExam = {
  id: string;
  exam_type: string;
  exam_date: Date | null;
  original_file_name: string;
  file_size_bytes: number;
  status: string;
  doctor_comment: string | null;
  created_at: Date;
};

const examTypes = [
  'Eletrocardiograma',
  'Ecocardiograma',
  'Holter',
  'MAPA',
  'Teste ergometrico',
  'Tomografia',
  'Ressonancia',
  'Exames laboratoriais',
  'Relatorio medico',
  'Outro exame',
] as const;

function formatDate(value: Date | null) {
  if (!value) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(value);
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function PatientExamsPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const user = await requirePatientUser();
  const params = await searchParams;
  const examsResult = await query<PatientExam>(
    `
      select id, exam_type, exam_date, original_file_name, file_size_bytes, status, doctor_comment, created_at
      from patient_exam_uploads
      where uploaded_by_user_id = $1
         or lower(patient_email::text) = lower($2)
      order by created_at desc
      limit 20
    `,
    [user.id, user.email],
  );

  return (
    <PortalShell>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Central de exames</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#0F3760]">
            Envie seus exames antes da consulta.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Anexe PDFs ou imagens de exames para ajudar a equipe medica a organizar sua documentacao. O medico acessa os arquivos pela dashboard interna.
          </p>
        </div>
        <Link href="/portal/paciente/agendar" className="w-fit rounded-full border border-[#14508B]/20 px-5 py-2.5 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
          Ir para agendamento
        </Link>
      </div>

      {params.sent === '1' ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Exame recebido com sucesso. A equipe interna ja consegue visualizar este arquivo.
        </div>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form action="/api/exams" method="post" encType="multipart/form-data" className="rounded-lg border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)]">
          <h2 className="text-2xl font-semibold text-[#0F3760]">Anexar exame</h2>
          <div className="mt-5 grid gap-4">
            <Field label="Nome do paciente" name="patientFullName" defaultValue={user.fullName} />
            <Field label="E-mail" name="patientEmail" type="email" defaultValue={user.email} />
            <Field label="WhatsApp" name="patientPhoneWhatsapp" type="tel" placeholder="(17) 99999-9999" required={false} />
            <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
              Tipo de exame
              <select name="examType" className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2">
                {examTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <Field label="Data do exame" name="examDate" type="date" required={false} />
            <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
              Observacoes
              <textarea
                name="notes"
                rows={4}
                className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
                placeholder="Ex: laudo de ecocardiograma realizado em laboratorio externo."
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
              Arquivo do exame
              <input
                name="examFile"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                required
                className="rounded-lg border border-dashed border-[#14508B]/30 bg-[#F4F9FF] px-4 py-4 text-sm font-normal text-slate-700 outline-none ring-[#15A7DD] file:mr-4 file:rounded-lg file:border-0 file:bg-[#14508B] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white focus:ring-2"
              />
              <span className="text-xs font-normal leading-5 text-slate-500">Formatos aceitos: PDF, JPG, PNG ou WEBP. Tamanho maximo: 15 MB.</span>
            </label>
            <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
              <input name="lgpdConsent" type="checkbox" value="true" required className="mt-1 h-4 w-4 accent-[#14508B]" />
              <span>Autorizo a Nogueira Cardiologia a armazenar e disponibilizar este exame para equipe autorizada com finalidade de organizacao do atendimento e apoio a avaliacao medica.</span>
            </label>
            <button type="submit" className="inline-flex w-fit rounded-full bg-[#14508B] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F3760]">
              Enviar exame
            </button>
          </div>
        </form>

        <section className="rounded-lg border border-[#14508B]/12 bg-white p-6 shadow-[0_24px_54px_-42px_rgba(20,80,139,0.72)]">
          <h2 className="text-2xl font-semibold text-[#0F3760]">Meus arquivos enviados</h2>
          <div className="mt-5 grid gap-3">
            {examsResult.rows.length ? (
              examsResult.rows.map((exam) => (
                <article key={exam.id} className="rounded-lg border border-slate-200 bg-[#F8FBFF] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-[#0F3760]">{exam.exam_type}</h3>
                      <p className="mt-1 text-sm text-slate-600">{exam.original_file_name} - {formatSize(exam.file_size_bytes)}</p>
                      <p className="mt-1 text-xs text-slate-500">Enviado em {formatDate(exam.created_at)} | Exame: {formatDate(exam.exam_date)}</p>
                    </div>
                    <a href={`/api/exams/${exam.id}/file`} target="_blank" rel="noreferrer" className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#14508B] ring-1 ring-[#14508B]/15">
                      Abrir arquivo
                    </a>
                  </div>
                  {exam.doctor_comment ? (
                    <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-slate-700">
                      Comentario medico: {exam.doctor_comment}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-lg bg-[#F4F9FF] p-4 text-sm leading-6 text-slate-600">
                Nenhum exame enviado ainda. Quando voce anexar um arquivo, ele aparecera aqui.
              </p>
            )}
          </div>
        </section>
      </section>
    </PortalShell>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[#103E6A]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-[#14508B]/20 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none ring-[#15A7DD] focus:ring-2"
      />
    </label>
  );
}
