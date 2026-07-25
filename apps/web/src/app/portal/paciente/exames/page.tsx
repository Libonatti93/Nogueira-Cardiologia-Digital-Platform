import type { Metadata } from 'next';
import Link from 'next/link';
import { PortalShell } from '@/components/dashboard/portal-shell';
import { requirePatientUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PatientPageGuide } from '@/components/portal/patient-page-guide';
import { PatientExamUploadForm } from '@/components/portal/patient-exam-upload-form';

export const metadata: Metadata = {
  title: 'Meus Exames | Portal do Paciente',
  description: 'Envie exames e documentos para adiantar a avaliação da equipe médica da Nogueira Cardiologia.',
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

function formatDate(value: Date | null) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(value);
}

function formatSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function PatientExamsPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
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
    <PortalShell patientName={user.fullName}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#15A7DD]">Meus exames</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F3760] sm:text-4xl">
            Seus documentos médicos em um só lugar.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Envie laudos, resultados e imagens antes da consulta para que seu cardiologista possa acessá-los durante o atendimento.
          </p>
        </div>
        <Link href="/portal/paciente/agendar" className="cta-pulse w-fit rounded-full border border-[#14508B]/20 bg-white px-5 py-2.5 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
          Ir para agendamento
        </Link>
      </div>

      {params.sent === '1' ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900" role="status">
          <strong className="block">Tudo certo: arquivo salvo com segurança.</strong>
          <span className="mt-1 block leading-6">O exame já aparece abaixo e também no painel médico protegido para acompanhamento do cardiologista.</span>
        </div>
      ) : null}

      {params.error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          <strong className="block">Não foi possível concluir o envio.</strong>
          <span className="mt-1 block leading-6">{params.error}</span>
        </div>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <PatientExamUploadForm fullName={user.fullName} email={user.email} />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#0F3760]">Arquivos enviados</h2>
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
                      Comentario médico: {exam.doctor_comment}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-lg bg-[#F4F9FF] p-4 text-sm leading-6 text-slate-600">
                Você ainda não enviou nenhum exame. Use o formulário ao lado para adicionar o primeiro arquivo.
              </p>
            )}
          </div>
        </section>
      </section>
      <PatientPageGuide variant="exams" />
    </PortalShell>
  );
}
