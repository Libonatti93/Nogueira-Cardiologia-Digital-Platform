import { NextResponse, type NextRequest } from 'next/server';
import { authorize } from '@/lib/api-access';
import { audit } from '@/lib/audit';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type ExportKind = 'leads' | 'consultas' | 'financeiro' | 'conteudo';

const exportLabels: Record<ExportKind, string> = {
  leads: 'leads',
  consultas: 'consultas',
  financeiro: 'financeiro',
  conteudo: 'conteudo',
};

export async function GET(request: NextRequest) {
  const access = await authorize(request, 'reports.export');
  if (access.response) return access.response;
  await audit({ actor: access.user!.id, action: 'reports.read', entity: 'reports' }, request);


  const kind = request.nextUrl.searchParams.get('tipo');

  if (!isExportKind(kind)) {
    return NextResponse.json({ message: 'Tipo de relatório inválido.' }, { status: 400 });
  }

  const dateRange = getDateRange(request);
  const report = await getExportReport(kind, dateRange);
  const csv = toCsv(report.headers, report.rows);
  const filename = `nogueira-${exportLabels[kind]}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

function isExportKind(value: string | null): value is ExportKind {
  return value === 'leads' || value === 'consultas' || value === 'financeiro' || value === 'conteudo';
}

async function getExportReport(kind: ExportKind, dateRange: DateRange) {
  const createdAtFilter = buildDateFilter('created_at', dateRange);

  if (kind === 'leads') {
    const result = await query<{
      nome: string;
      email: string | null;
      whatsapp: string | null;
      etapa: string;
      origem: string;
      detalhe: string | null;
      observacoes: string | null;
      criado_em: Date;
    }>(`
      select
        full_name as nome,
        email,
        phone_whatsapp as whatsapp,
        stage::text as etapa,
        source as origem,
        source_detail as detalhe,
        notes as observacoes,
        created_at as criado_em
      from leads
      ${createdAtFilter.sql}
      order by created_at desc
      limit 5000
    `, createdAtFilter.params);

    return {
      headers: ['Nome', 'Email', 'WhatsApp', 'Etapa', 'Origem', 'Detalhe', 'Observações', 'Criado em'],
      rows: result.rows.map((row) => [
        row.nome,
        row.email,
        row.whatsapp,
        row.etapa,
        row.origem,
        row.detalhe,
        row.observacoes,
        formatCsvDate(row.criado_em),
      ]),
    };
  }

  if (kind === 'consultas') {
    const filter = buildDateFilter('appointments.created_at', dateRange);
    const result = await query<{
      paciente: string;
      email: string;
      medico: string | null;
      status: string;
      agendada_para: Date | null;
      criada_em: Date;
    }>(`
      select
        patient_profiles.full_name as paciente,
        patient_profiles.email,
        doctors.full_name as medico,
        appointments.status::text,
        appointments.scheduled_for as agendada_para,
        appointments.created_at as criada_em
      from appointments
      join patient_profiles on patient_profiles.id = appointments.patient_id
      left join doctors on doctors.id = appointments.doctor_id
      ${filter.sql}
      order by appointments.created_at desc
      limit 5000
    `, filter.params);

    return {
      headers: ['Paciente', 'Email', 'Medico', 'Status', 'Agendada para', 'Criada em'],
      rows: result.rows.map((row) => [
        row.paciente,
        row.email,
        row.medico,
        row.status,
        formatCsvDate(row.agendada_para),
        formatCsvDate(row.criada_em),
      ]),
    };
  }

  if (kind === 'financeiro') {
    const filter = buildDateFilter('payments.created_at', dateRange);
    const result = await query<{
      paciente: string;
      status: string;
      valor_centavos: number;
      provedor: string;
      pago_em: Date | null;
      criado_em: Date;
    }>(`
      select
        patient_profiles.full_name as paciente,
        payments.status::text,
        payments.amount_cents as valor_centavos,
        payments.provider as provedor,
        payments.paid_at as pago_em,
        payments.created_at as criado_em
      from payments
      join patient_profiles on patient_profiles.id = payments.patient_id
      ${filter.sql}
      order by payments.created_at desc
      limit 5000
    `, filter.params);

    return {
      headers: ['Paciente', 'Status', 'Valor', 'Provedor', 'Pago em', 'Criado em'],
      rows: result.rows.map((row) => [
        row.paciente,
        row.status,
        (row.valor_centavos / 100).toFixed(2),
        row.provedor,
        formatCsvDate(row.pago_em),
        formatCsvDate(row.criado_em),
      ]),
    };
  }

  const filter = buildDateFilter('updated_at', dateRange);
  const result = await query<{
    titulo: string;
    categoria: string;
    status: string;
    slug: string;
    publicado_em: Date | null;
    atualizado_em: Date;
  }>(`
    select
      title as titulo,
      category as categoria,
      status::text,
      slug,
      published_at as publicado_em,
      updated_at as atualizado_em
    from educativo_posts
    ${filter.sql}
    order by updated_at desc
    limit 5000
  `, filter.params);

  return {
    headers: ['Titulo', 'Categoria', 'Status', 'Slug', 'Publicado em', 'Atualizado em'],
    rows: result.rows.map((row) => [
      row.titulo,
      row.categoria,
      row.status,
      row.slug,
      formatCsvDate(row.publicado_em),
      formatCsvDate(row.atualizado_em),
    ]),
  };
}

type DateRange = {
  start: string | null;
  end: string | null;
};

function getDateRange(request: NextRequest): DateRange {
  const period = request.nextUrl.searchParams.get('periodo');
  const start = request.nextUrl.searchParams.get('inicio');
  const end = request.nextUrl.searchParams.get('fim');

  if (start || end) return { start, end };

  const now = new Date();
  const from = new Date(now);

  if (period === '7d') from.setDate(now.getDate() - 7);
  else if (period === '30d') from.setDate(now.getDate() - 30);
  else if (period === 'mes') from.setDate(1);
  else return { start: null, end: null };

  return { start: from.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) };
}

function buildDateFilter(column: string, dateRange: DateRange) {
  const params: string[] = [];
  const clauses: string[] = [];

  if (dateRange.start) {
    params.push(dateRange.start);
    clauses.push(`${column} >= $${params.length}::date`);
  }

  if (dateRange.end) {
    params.push(dateRange.end);
    clauses.push(`${column} < ($${params.length}::date + interval '1 day')`);
  }

  return {
    sql: clauses.length ? `where ${clauses.join(' and ')}` : '',
    params,
  };
}

function toCsv(headers: string[], rows: Array<Array<string | number | null>>) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(';'));
  return `\uFEFF${lines.join('\n')}\n`;
}

function escapeCsvCell(value: string | number | null) {
  const text = value === null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatCsvDate(value: Date | null) {
  if (!value) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}
