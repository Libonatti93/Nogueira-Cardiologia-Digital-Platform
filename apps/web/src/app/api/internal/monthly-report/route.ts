import { NextResponse } from 'next/server';
import { authorize } from '@/lib/api-access';
import { audit } from '@/lib/audit';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const access = await authorize(request, 'reports.export');
  if (access.response) return access.response;
  await audit({ actor: access.user!.id, action: 'reports.read', entity: 'reports' }, request);


  const [summary, leadStages, appointmentStatus, paymentStatus] = await Promise.all([
    query<{
      leads_total: string;
      appointments_total: string;
      payments_total: string;
      revenue_paid_cents: string;
      revenue_open_cents: string;
      exams_total: string;
    }>(`
      select
        (select count(*) from leads where created_at >= date_trunc('month', now())) as leads_total,
        (select count(*) from appointments where created_at >= date_trunc('month', now())) as appointments_total,
        (select count(*) from payments where created_at >= date_trunc('month', now())) as payments_total,
        (select coalesce(sum(amount_cents), 0) from payments where status = 'paid' and created_at >= date_trunc('month', now())) as revenue_paid_cents,
        (select coalesce(sum(amount_cents), 0) from payments where status in ('pending', 'authorized', 'overdue') and created_at >= date_trunc('month', now())) as revenue_open_cents,
        (select count(*) from patient_exam_uploads where created_at >= date_trunc('month', now())) as exams_total
    `),
    query<{ label: string; total: string }>(`
      select stage::text as label, count(*) as total
      from leads
      where created_at >= date_trunc('month', now())
      group by stage
      order by count(*) desc
    `),
    query<{ label: string; total: string }>(`
      select status::text as label, count(*) as total
      from appointments
      where created_at >= date_trunc('month', now())
      group by status
      order by count(*) desc
    `),
    query<{ label: string; total: string }>(`
      select status::text as label, count(*) as total
      from payments
      where created_at >= date_trunc('month', now())
      group by status
      order by count(*) desc
    `),
  ]);

  const row = summary.rows[0];
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório mensal Nogueira Cardiologia</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f3760; margin: 40px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    h2 { margin-top: 28px; font-size: 18px; }
    p { color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; }
    .card { border: 1px solid #dbe7f3; padding: 16px; border-radius: 8px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #15a7dd; font-weight: 700; }
    .value { display: block; margin-top: 8px; font-size: 24px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { font-size: 12px; text-transform: uppercase; color: #64748b; }
    @media print { button { display: none; } body { margin: 20px; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Salvar como PDF</button>
  <h1>Relatório mensal executivo</h1>
  <p>Nogueira Cardiologia - ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date())}</p>
  <div class="grid">
    ${metric('Leads no mes', row.leads_total)}
    ${metric('Consultas no mes', row.appointments_total)}
    ${metric('Exames enviados', row.exams_total)}
    ${metric('Pagamentos no mes', row.payments_total)}
    ${metric('Receita recebida', formatMoney(Number(row.revenue_paid_cents)))}
    ${metric('Receita em aberto', formatMoney(Number(row.revenue_open_cents)))}
  </div>
  ${table('Leads por etapa', leadStages.rows)}
  ${table('Consultas por status', appointmentStatus.rows)}
  ${table('Pagamentos por status', paymentStatus.rows)}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
}

function metric(label: string, value: string) {
  return `<div class="card"><span class="label">${escapeHtml(label)}</span><strong class="value">${escapeHtml(value)}</strong></div>`;
}

function table(title: string, rows: { label: string; total: string }[]) {
  const body = rows.length
    ? rows.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.total)}</td></tr>`).join('')
    : '<tr><td colspan="2">Sem dados no mes.</td></tr>';

  return `<h2>${escapeHtml(title)}</h2><table><thead><tr><th>Indicador</th><th>Total</th></tr></thead><tbody>${body}</tbody></table>`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
