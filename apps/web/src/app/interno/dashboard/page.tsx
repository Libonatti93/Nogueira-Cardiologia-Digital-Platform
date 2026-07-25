import type { Metadata } from 'next';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { InternalShell } from '@/components/internal/internal-shell';
import { requireInternalUser } from '@/lib/auth';
import { getBlogCategories } from '@/data/blog-posts';
import { query } from '@/lib/db';
import {
  buildSectionsFromBody,
  createPostSlug,
  estimateReadingTime,
  getDashboardEducativoPosts,
} from '@/lib/educativo-posts';
import { noIndexRobots } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Dashboard Interna | Nogueira Cardiologia',
  description: 'Dashboard operacional da equipe interna da Nogueira Cardiologia.',
  robots: noIndexRobots,
};

export const dynamic = 'force-dynamic';

type Metric = {
  label: string;
  value: string;
  detail: string;
};

type RecentUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  last_login_at: Date | null;
};

type RecentLead = {
  id: string;
  full_name: string;
  email: string | null;
  phone_whatsapp: string | null;
  stage: string;
  source: string;
  created_at: Date;
};

type RecentAppointment = {
  id: string;
  patient_name: string;
  patient_email: string;
  doctor_name: string | null;
  status: string;
  scheduled_for: Date | null;
  created_at: Date;
};

type WeeklyAppointment = RecentAppointment;

type ManualCalendarEvent = {
  id: string;
  title: string;
  starts_at: Date;
  ends_at: Date | null;
  location: string | null;
  notes: string | null;
};

type RecentPayment = {
  id: string;
  patient_name: string;
  status: string;
  amount_cents: number;
  provider: string;
  created_at: Date;
  paid_at: Date | null;
};

type RecentExam = {
  id: string;
  patient_full_name: string;
  patient_email: string;
  patient_phone_whatsapp: string | null;
  exam_type: string;
  exam_date: Date | null;
  original_file_name: string;
  file_size_bytes: number;
  status: string;
  notes: string | null;
  upload_ip: string | null;
  device_platform: string | null;
  location_consent_at: Date | null;
  reviewed_at: Date | null;
  created_at: Date;
};

type StageRow = {
  stage: string;
  total: string;
};

type StatusCountRow = {
  status: string;
  total: string;
};

type LeadBoardItem = {
  id: string;
  full_name: string;
  email: string | null;
  phone_whatsapp: string | null;
  stage: string;
  source: string;
  created_at: Date;
};

type WeatherSummary = {
  city: string;
  shortCity: string;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  condition: string;
  conditionCode: number | null;
  forecast: WeatherForecastDay[];
};

type NewsItem = {
  title: string;
  source: string;
  sourceUrl: string;
  link: string;
  publishedAt: string;
  thumbnailUrl: string;
};

type ExternalSignals = {
  weather: WeatherSummary[];
  news: NewsItem[];
};

type WeatherLocation = {
  city: string;
  shortCity: string;
  latitude: number;
  longitude: number;
};

type WeatherForecastDay = {
  date: string;
  condition: string;
  conditionCode: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  precipitationProbability: number | null;
};

const monthlyRevenueGoalCents = Number(process.env.DASHBOARD_MONTHLY_REVENUE_GOAL_CENTS ?? 3000000);
const educativoCategoryOptions = getBlogCategories();

const roleLabel: Record<string, string> = {
  patient: 'Paciente',
  secretary: 'Secretaria',
  doctor: 'Médico',
  admin: 'Admin',
};

const stageLabel: Record<string, string> = {
  new: 'Novo',
  contact_started: 'Contato iniciado',
  interested: 'Interessado',
  registered: 'Cadastrado',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  confirmed: 'Confirmado',
  reschedule: 'Reagendar',
  lost: 'Perdido',
};

const appointmentStatusLabel: Record<string, string> = {
  requested: 'Solicitada',
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Paga',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  rescheduled: 'Reagendada',
  attended: 'Atendida',
  no_show: 'Faltou',
};

const paymentStatusLabel: Record<string, string> = {
  pending: 'Pendente',
  authorized: 'Autorizado',
  paid: 'Pago',
  overdue: 'Vencido',
  refunded: 'Reembolsado',
  cancelled: 'Cancelado',
  failed: 'Falhou',
};

const workQueueStages = ['new', 'contact_started', 'interested', 'registered', 'awaiting_payment', 'paid', 'confirmed', 'reschedule'] as const;

const leadBoardStages = ['new', 'contact_started', 'interested', 'awaiting_payment', 'confirmed'] as const;

const weatherLocations: WeatherLocation[] = [
  {
    city: 'São José do Rio Preto',
    shortCity: 'Rio Preto',
    latitude: -20.8197,
    longitude: -49.3794,
  },
  {
    city: 'São Paulo',
    shortCity: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
  },
];

function formatDate(value: Date | null) {
  if (!value) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatShortDate(value: Date | null) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function getDashboardData() {
  const [
    metricsResult,
    usersResult,
    leadsResult,
    appointmentsResult,
    paymentsResult,
    stagesResult,
    examsResult,
    appointmentsStatusResult,
    paymentsStatusResult,
    leadBoardResult,
    weeklyAppointmentsResult,
    manualEventsResult,
  ] = await Promise.all([
    query<{
      users_total: string;
      patients_total: string;
      leads_total: string;
      appointments_total: string;
      payments_paid_total: string;
      revenue_paid_cents: string;
      revenue_month_paid_cents: string;
      revenue_month_open_cents: string;
      appointments_month_total: string;
      open_care_queue_total: string;
      requested_appointments_total: string;
      pending_payments_total: string;
      exams_total: string;
      exams_pending_total: string;
    }>(`
      select
        (select count(*) from app_users) as users_total,
        (select count(*) from patient_profiles) as patients_total,
        (select count(*) from leads) as leads_total,
        (select count(*) from appointments) as appointments_total,
        (select count(*) from patient_exam_uploads) as exams_total,
        (select count(*) from patient_exam_uploads where status = 'received') as exams_pending_total,
        (select count(*) from payments where status = 'paid') as payments_paid_total,
        (select coalesce(sum(amount_cents), 0) from payments where status = 'paid') as revenue_paid_cents,
        (select coalesce(sum(amount_cents), 0) from payments where status = 'paid' and created_at >= date_trunc('month', now())) as revenue_month_paid_cents,
        (select coalesce(sum(amount_cents), 0) from payments where status in ('pending', 'authorized', 'overdue') and created_at >= date_trunc('month', now())) as revenue_month_open_cents,
        (select count(*) from appointments where created_at >= date_trunc('month', now())) as appointments_month_total,
        (select count(*) from appointments where status in ('requested', 'awaiting_payment', 'paid', 'confirmed', 'rescheduled')) as open_care_queue_total,
        (select count(*) from appointments where status = 'requested') as requested_appointments_total,
        (select count(*) from payments where status in ('pending', 'authorized', 'overdue')) as pending_payments_total
    `),
    query<RecentUser>(`
      select id, email, full_name, role::text, is_active, created_at, last_login_at
      from app_users
      order by created_at desc
      limit 8
    `),
    query<RecentLead>(`
      select id, full_name, email, phone_whatsapp, stage::text, source, created_at
      from leads
      order by created_at desc
      limit 8
    `),
    query<RecentAppointment>(`
      select
        appointments.id,
        patient_profiles.full_name as patient_name,
        patient_profiles.email as patient_email,
        doctors.full_name as doctor_name,
        appointments.status::text,
        appointments.scheduled_for,
        appointments.created_at
      from appointments
      join patient_profiles on patient_profiles.id = appointments.patient_id
      left join doctors on doctors.id = appointments.doctor_id
      order by appointments.created_at desc
      limit 8
    `),
    query<RecentPayment>(`
      select
        payments.id,
        patient_profiles.full_name as patient_name,
        payments.status::text,
        payments.amount_cents,
        payments.provider,
        payments.created_at,
        payments.paid_at
      from payments
      join patient_profiles on patient_profiles.id = payments.patient_id
      order by payments.created_at desc
      limit 8
    `),
    query<StageRow>(`
      select stage::text, count(*) as total
      from leads
      group by stage
      order by count(*) desc, stage
    `),
    query<RecentExam>(`
      select
        id,
        patient_full_name,
        patient_email,
        patient_phone_whatsapp,
        exam_type,
        exam_date,
        original_file_name,
        file_size_bytes,
        status,
        notes,
        upload_ip::text,
        device_platform,
        location_consent_at,
        reviewed_at,
        created_at
      from patient_exam_uploads
      order by created_at desc
      limit 10
    `),
    query<StatusCountRow>(`
      select status::text, count(*) as total
      from appointments
      group by status
      order by count(*) desc, status
    `),
    query<StatusCountRow>(`
      select status::text, count(*) as total
      from payments
      group by status
      order by count(*) desc, status
    `),
    query<LeadBoardItem>(`
      select id, full_name, email, phone_whatsapp, stage::text, source, created_at
      from leads
      where stage in ('new', 'contact_started', 'interested', 'awaiting_payment', 'confirmed')
      order by created_at desc
      limit 40
    `),
    query<WeeklyAppointment>(`
      select
        appointments.id,
        patient_profiles.full_name as patient_name,
        patient_profiles.email as patient_email,
        doctors.full_name as doctor_name,
        appointments.status::text,
        appointments.scheduled_for,
        appointments.created_at
      from appointments
      join patient_profiles on patient_profiles.id = appointments.patient_id
      left join doctors on doctors.id = appointments.doctor_id
      where appointments.scheduled_for >= date_trunc('week', now())
        and appointments.scheduled_for < date_trunc('week', now()) + interval '7 days'
      order by appointments.scheduled_for asc nulls last, appointments.created_at asc
      limit 80
    `),
    query<ManualCalendarEvent>(`
      select id, title, starts_at, ends_at, location, notes
      from internal_calendar_events
      where starts_at >= date_trunc('week', now())
        and starts_at < date_trunc('week', now()) + interval '7 days'
      order by starts_at asc
      limit 80
    `),
  ]);

  const row = metricsResult.rows[0];
  const revenueMonthPaidCents = Number(row.revenue_month_paid_cents);
  const revenueMonthOpenCents = Number(row.revenue_month_open_cents);
  const forecastRevenueCents = revenueMonthPaidCents + revenueMonthOpenCents;
  const monthlyGoalProgress = monthlyRevenueGoalCents ? Math.min(100, Math.round((forecastRevenueCents / monthlyRevenueGoalCents) * 100)) : 0;
  const metrics: Metric[] = [
    {
      label: 'Usuários',
      value: row.users_total,
      detail: 'Contas criadas no portal',
    },
    {
      label: 'Pacientes',
      value: row.patients_total,
      detail: 'Perfis com dados clinicos',
    },
    {
      label: 'Leads',
      value: row.leads_total,
      detail: `${row.requested_appointments_total} consultas solicitadas`,
    },
    {
      label: 'Pagamentos',
      value: formatMoney(Number(row.revenue_paid_cents)),
      detail: `${row.payments_paid_total} pagos / ${row.pending_payments_total} pendentes`,
    },
    {
      label: 'Exames',
      value: row.exams_total,
      detail: `${row.exams_pending_total} aguardando revisão`,
    },
  ];

  return {
    metrics,
    revenueMonthPaidCents,
    revenueMonthOpenCents,
    forecastRevenueCents,
    monthlyGoalProgress,
    monthlyRevenueGoalCents,
    appointmentsMonthTotal: Number(row.appointments_month_total),
    openCareQueueTotal: Number(row.open_care_queue_total),
    requestedAppointmentsTotal: Number(row.requested_appointments_total),
    pendingPaymentsTotal: Number(row.pending_payments_total),
    users: usersResult.rows,
    leads: leadsResult.rows,
    appointments: appointmentsResult.rows,
    payments: paymentsResult.rows,
    stages: stagesResult.rows,
    exams: examsResult.rows,
    appointmentStatus: appointmentsStatusResult.rows,
    paymentStatus: paymentsStatusResult.rows,
    leadBoard: leadBoardResult.rows,
    weeklyAppointments: weeklyAppointmentsResult.rows,
    manualEvents: manualEventsResult.rows,
  };
}

async function getExternalSignals(): Promise<ExternalSignals> {
  const [weather, news] = await Promise.all([
    Promise.all(weatherLocations.map((location) => getWeatherSummary(location))),
    getHealthNews(),
  ]);
  return { weather: weather.filter((item): item is WeatherSummary => Boolean(item)), news };
}

async function createEducativoPostAction(formData: FormData) {
  'use server';

  const user = await requireInternalUser();
  const title = cleanFormValue(formData.get('title'));
  const category = cleanFormValue(formData.get('category')) || 'Cardiologia educativa';
  const excerpt = cleanFormValue(formData.get('excerpt'));
  const tags = cleanFormValue(formData.get('tags'))
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const body = cleanFormValue(formData.get('body'));
  const publishNow = formData.get('publishNow') === 'on';

  if (!title || !excerpt || !body) {
    throw new Error('Preencha título, resumo e conteúdo antes de públicar.');
  }

  const baseSlug = createPostSlug(title) || `conteudo-${Date.now()}`;
  const slug = await reserveEducativoSlug(baseSlug);
  const coverImageFile = formData.get('coverImageFile');
  const coverImageUrl =
    coverImageFile instanceof File && coverImageFile.size > 0
      ? await saveEducativoCoverImage(coverImageFile, slug)
      : '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris2.png';
  const sections = buildSectionsFromBody(body);
  const readingTime = estimateReadingTime(body);

  await query(
    `
      insert into educativo_posts (
        author_id,
        title,
        slug,
        excerpt,
        category,
        tags,
        cover_image_url,
        seo_title,
        seo_description,
        reading_time,
        status,
        published_at,
        sections
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $4, $9, $10::post_status, case when $10 = 'published' then now() else null end, $11::jsonb)
    `,
    [
      user.id,
      title,
      slug,
      excerpt,
      category,
      tags,
      coverImageUrl,
      `${title} | Nogueira Cardiologia`,
      readingTime,
      publishNow ? 'published' : 'draft',
      JSON.stringify(sections),
    ],
  );

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/acesso/dashboard');
}

async function updateEducativoPostAction(formData: FormData) {
  'use server';

  await requireInternalUser();
  const id = cleanFormValue(formData.get('id'));
  const title = cleanFormValue(formData.get('title'));
  const category = cleanFormValue(formData.get('category')) || 'Cardiologia educativa';
  const excerpt = cleanFormValue(formData.get('excerpt'));
  const status = cleanFormValue(formData.get('status'));

  if (!id || !title || !excerpt || !['draft', 'published', 'archived'].includes(status)) {
    throw new Error('Dados inválidos para atualizar o post.');
  }

  await query(
    `
      update educativo_posts
      set title = $2,
          category = $3,
          excerpt = $4,
          seo_title = $5,
          seo_description = $4,
          status = $6::post_status,
          published_at = case
            when $6 = 'published' and published_at is null then now()
            when $6 <> 'published' then null
            else published_at
          end,
          updated_at = now()
      where id = $1
    `,
    [id, title, category, excerpt, `${title} | Nogueira Cardiologia`, status],
  );

  revalidatePath('/blog');
  revalidatePath('/acesso/dashboard');
}

async function deleteEducativoPostAction(formData: FormData) {
  'use server';

  await requireInternalUser();
  const id = cleanFormValue(formData.get('id'));

  if (!id) throw new Error('Post inválido.');

  await query('delete from educativo_posts where id = $1', [id]);
  revalidatePath('/blog');
  revalidatePath('/acesso/dashboard');
}

async function createManualEventAction(formData: FormData) {
  'use server';

  const user = await requireInternalUser();
  const title = cleanFormValue(formData.get('title'));
  const startsAt = cleanFormValue(formData.get('startsAt'));
  const location = cleanFormValue(formData.get('location'));
  const notes = cleanFormValue(formData.get('notes'));

  if (!title || !startsAt) {
    throw new Error('Informe título e data/hora do compromisso.');
  }

  await query(
    `
      insert into internal_calendar_events (created_by_user_id, title, starts_at, location, notes)
      values ($1, $2, $3::timestamptz, $4, $5)
    `,
    [user.id, title, startsAt, location || null, notes || null],
  );

  revalidatePath('/acesso/dashboard');
}

async function reserveEducativoSlug(baseSlug: string) {
  const result = await query<{ slug: string }>(
    `
      select slug
      from educativo_posts
      where slug = $1
         or slug like $2
    `,
    [baseSlug, `${baseSlug}-%`],
  );
  const usedSlugs = new Set(result.rows.map((row) => row.slug));

  if (!usedSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

function cleanFormValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

async function saveEducativoCoverImage(file: File, slug: string) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Anexe apenas imagem no post educativo.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem precisa ter até 5 MB.');
  }

  const extension = getImageExtension(file);
  const uploadDir = path.join(process.cwd(), 'public', 'uploads-imagens-nogueira', 'educativo-editorial');
  const fileName = `${slug}-${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);

  return `/uploads-imagens-nogueira/educativo-editorial/${fileName}`;
}

function getImageExtension(file: File) {
  const extensionFromName = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

  if (extensionFromName && allowedExtensions.has(extensionFromName)) return extensionFromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

async function getWeatherSummary(location: WeatherLocation): Promise<WeatherSummary | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=4&timezone=America%2FSao_Paulo`,
      { next: { revalidate: 900 } },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };
    const forecast = (data.daily?.time ?? []).slice(0, 4).map((date, index) => {
      const conditionCode = data.daily?.weather_code?.[index] ?? null;

      return {
        date,
        condition: getWeatherCondition(conditionCode ?? undefined),
        conditionCode,
        maxTemperature: data.daily?.temperature_2m_max?.[index] ?? null,
        minTemperature: data.daily?.temperature_2m_min?.[index] ?? null,
        precipitationProbability: data.daily?.precipitation_probability_max?.[index] ?? null,
      };
    });

    return {
      city: location.city,
      shortCity: location.shortCity,
      temperature: data.current?.temperature_2m ?? null,
      apparentTemperature: data.current?.apparent_temperature ?? null,
      humidity: data.current?.relative_humidity_2m ?? null,
      windSpeed: data.current?.wind_speed_10m ?? null,
      condition: getWeatherCondition(data.current?.weather_code),
      conditionCode: data.current?.weather_code ?? null,
      forecast,
    };
  } catch {
    return null;
  }
}

async function getHealthNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      'https://news.google.com/rss/search?q=cardiologia%20OR%20coracao%20OR%20saude%20cardiovascular%20Brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
      { next: { revalidate: 1800 } },
    );

    if (!response.ok) return fallbackNews;

    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
    const parsed = items.map((item) => {
      const block = item[1];
      const rawTitle = extractXmlValue(block, 'title');
      const [title, source = 'Google News'] = rawTitle.split(' - ').map((part) => part.trim());
      const sourceUrl = extractSourceUrl(block);

      return {
        title: title || 'Notícia de saúde cardiovascular',
        source,
        sourceUrl,
        link: extractXmlValue(block, 'link') || 'https://news.google.com/',
        publishedAt: extractXmlValue(block, 'pubDate'),
        thumbnailUrl: getNewsThumbnailUrl(sourceUrl),
      };
    });

    return parsed.length ? parsed : fallbackNews;
  } catch {
    return fallbackNews;
  }
}

function extractXmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return decodeXml(match?.[1] ?? '').trim();
}

function extractSourceUrl(xml: string) {
  const match = xml.match(/<source[^>]*url="([^"]+)"/);
  return decodeXml(match?.[1] ?? 'https://news.google.com/');
}

function getNewsThumbnailUrl(sourceUrl: string) {
  try {
    const hostname = new URL(sourceUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getWeatherCondition(code?: number) {
  if (code === undefined) return 'Atualizando';
  if (code === 0) return 'Céu limpo';
  if ([1, 2, 3].includes(code)) return 'Parcialmente nublado';
  if ([45, 48].includes(code)) return 'Nevoeiro';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Garoa';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Chuva';
  if ([95, 96, 99].includes(code)) return 'Trovoadas';
  return 'Tempo variável';
}

const fallbackNews: NewsItem[] = [
  {
    title: 'Atualize protocolos, diretrizes e alertas de saúde cardiovascular antes do atendimento',
    source: 'Resumo interno',
    sourceUrl: '/blog',
    link: '/blog',
    publishedAt: '',
    thumbnailUrl: '',
  },
  {
    title: 'Revise leads novos e pacientes com pagamento pendente no início do expediente',
    source: 'Operação Nogueira',
    sourceUrl: '#leads',
    link: '#leads',
    publishedAt: '',
    thumbnailUrl: '',
  },
];

export default async function InternalDashboardPage() {
  const user = await requireInternalUser();
  const [data, externalSignals, educativoPosts] = await Promise.all([
    getDashboardData(),
    getExternalSignals(),
    getDashboardEducativoPosts(),
  ]);
  const workQueueTotal = data.stages
    .filter((stage) => workQueueStages.includes(stage.stage as (typeof workQueueStages)[number]))
    .reduce((sum, stage) => sum + Number(stage.total), 0);
  const weekDays = getCurrentWeekDays();
  const appointmentsWithDate = data.weeklyAppointments.filter((appointment) => appointment.scheduled_for);
  const nextAppointment = appointmentsWithDate[0] ?? null;

  return (
    <InternalShell>
      <section className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_24px_54px_-46px_rgba(20,80,139,0.72)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Centro de comando médico</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#0F3760] md:text-4xl">
              Painel de trabalho do Dr. Paulo.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Agenda, operação, financeiro, conteúdo educativo e relatórios separados por área para tomada de decisão diária.
            </p>
            <p className="mt-2 text-sm font-semibold text-[#14508B]">
              Logado como {user.fullName} ({user.email})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/acesso" className="rounded-lg border border-[#14508B]/20 px-4 py-2 text-sm font-bold text-[#14508B] hover:border-[#14508B]/55">
              Trocar usuário
            </a>
            <a href="#relatorios" className="rounded-lg bg-[#14508B] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F3760]">
              Exportar dados
            </a>
          </div>
        </div>
      </section>

      <nav className="sticky top-8 z-20 mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white/96 px-3 py-3 shadow-[0_16px_40px_-34px_rgba(20,80,139,0.7)] backdrop-blur">
        <div className="flex min-w-max gap-2">
          {[
            ['Visão geral', '#visão-geral'],
            ['Agenda', '#agenda'],
            ['Operação', '#operação'],
            ['Financeiro', '#financeiro'],
            ['Conteúdo', '#públicar'],
            ['Relatórios', '#relatorios'],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] px-4 py-2 text-sm font-bold text-[#14508B] hover:border-[#14508B]/45 hover:bg-white">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <section id="visão-geral" className="mt-5 scroll-mt-24 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <InsightCard
              label="Previsão do mes"
              value={formatMoney(data.forecastRevenueCents)}
              detail={`${formatMoney(data.revenueMonthPaidCents)} recebido + ${formatMoney(data.revenueMonthOpenCents)} em aberto`}
            />
            <InsightCard
              label="Meta mensal"
              value={`${data.monthlyGoalProgress}%`}
              detail={`Meta configurada: ${formatMoney(data.monthlyRevenueGoalCents)}`}
            >
              <ProgressBar value={data.monthlyGoalProgress} />
            </InsightCard>
            <InsightCard
              label="Próximo compromisso"
              value={nextAppointment ? formatAppointmentTime(nextAppointment.scheduled_for) : 'Livre'}
              detail={nextAppointment ? nextAppointment.patient_name : 'Nenhum horário agendado nestá semana'}
            />
          </div>

          <section id="agenda" className="scroll-mt-24">
            <Panel title="Agenda da semana" subtitle="Grade semanal para visualizar rapidamente dias com atendimento, compromissos e horários livres.">
              <WeeklyCalendar days={weekDays} appointments={data.weeklyAppointments} events={data.manualEvents} />
              <form action={createManualEventAction} className="mt-5 grid gap-3 rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] p-4 md:grid-cols-[1fr_220px_1fr_auto]">
                <input name="title" required className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#14508B]" placeholder="Compromisso" />
                <input name="startsAt" required type="datetime-local" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#14508B]" />
                <input name="location" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#14508B]" placeholder="Local ou canal" />
                <button type="submit" className="min-h-11 rounded-lg bg-[#14508B] px-4 text-sm font-bold text-white hover:bg-[#0F3760]">Adicionar</button>
                <textarea name="notes" rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#14508B] md:col-span-4" placeholder="Observações opcionais" />
              </form>
            </Panel>
          </section>
        </div>

        <aside className="grid gap-4 self-start xl:sticky xl:top-20">
          <WeatherCard weather={externalSignals.weather} />
          <NewsCard news={externalSignals.news} />
        </aside>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_22px_50px_-42px_rgba(20,80,139,0.75)]">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{metric.label}</p>
            <strong className="mt-3 block text-3xl font-semibold text-[#0F3760]">{metric.value}</strong>
            <p className="mt-2 text-sm text-slate-600">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section id="operação" className="mt-6 scroll-mt-24 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Mapa visual da operação" subtitle="Volume por status para entender rapidamente onde a rotina está travando.">
          <div className="grid gap-6 lg:grid-cols-2">
            <BarList
              title="Consultas"
              rows={data.appointmentStatus.map((row) => ({
                label: appointmentStatusLabel[row.status] ?? row.status,
                value: Number(row.total),
              }))}
            />
            <BarList
              title="Pagamentos"
              rows={data.paymentStatus.map((row) => ({
                label: paymentStatusLabel[row.status] ?? row.status,
                value: Number(row.total),
              }))}
            />
          </div>
        </Panel>

        <Panel title="Ações rapidas" subtitle="Atalhos operacionais para navegar sem procurar bloco no meio da página.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              ['Agenda da semana', '#agenda', 'Ver compromissos e horários livres.'],
              ['Clientes não atendidos', '#leads', 'Priorizar contatos ainda sem desfecho.'],
              ['Exames recebidos', '#exames', 'Abrir arquivos enviados pelos pacientes.'],
              ['Consultas recentes', '#consultas', 'Ver solicitações do portal.'],
              ['Pagamentos', '#financeiro', 'Conferir pendencias e recebidos.'],
              ['Publicar educativo', '#públicar', 'Criar post para o blog da clínica.'],
            ].map(([title, href, description]) => (
              <a key={href} href={href} className="block rounded-lg border border-[#14508B]/12 bg-[#F4F9FF] p-4 hover:border-[#14508B]/35">
                <strong className="text-sm text-[#0F3760]">{title}</strong>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
              </a>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-6" id="públicar">
        <Panel title="Publicar no Educativo" subtitle="Área editorial simples para criar conteúdo no estilo WordPress, salvar rascunho ou públicar direto no blog.">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <form action={createEducativoPostAction} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#0F3760]">
                  Título
                  <input name="title" required className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#14508B]" placeholder="Ex.: Como controlar a pressão em casa" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[#0F3760]">
                  Categoria
                  <select name="category" defaultValue={educativoCategoryOptions[0] ?? 'Cardiologia educativa'} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#14508B]">
                    {educativoCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[#0F3760]">
                Resumo para o card e SEO
                <textarea name="excerpt" required rows={3} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal leading-6 text-slate-700 outline-none focus:border-[#14508B]" placeholder="Escreva uma chamada curta, clara e educativa." />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[#0F3760]">
                  Tags
                  <input name="tags" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#14508B]" placeholder="pressão alta, cardiologia, prevencao" />
                </label>
                <div className="grid gap-2 text-sm font-semibold text-[#0F3760]">
                  Imagem
                  <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#14508B]/35 bg-[#F8FBFF] px-3 text-sm font-bold text-[#14508B] hover:border-[#14508B] hover:bg-[#EAF6FF]">
                    <PaperclipIcon />
                    Anexar imagem
                    <input name="coverImageFile" type="file" accept="image/*" className="sr-only" />
                  </label>
                </div>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-[#0F3760]">
                Conteúdo
                <textarea name="body" required rows={9} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal leading-6 text-slate-700 outline-none focus:border-[#14508B]" placeholder="Digite o texto educativo. Separe blocos com uma linha em branco." />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" name="publishNow" className="h-4 w-4 accent-[#14508B]" />
                  Publicar agora no Educativo
                </label>
                <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#14508B] px-5 text-sm font-bold text-white hover:bg-[#0F3760]">
                  Salvar post
                </button>
              </div>
            </form>

            <div className="rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#15A7DD]">Últimos posts editoriais</h3>
              <div className="mt-4 grid gap-3">
                {educativoPosts.length ? (
                  educativoPosts.map((post) => (
                    <article key={post.id} className="rounded-lg bg-white p-3">
                      <form action={updateEducativoPostAction} className="grid gap-2">
                        <input type="hidden" name="id" value={post.id} />
                        <input name="title" defaultValue={post.title} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-[#0F3760] outline-none focus:border-[#14508B]" />
                        <textarea name="excerpt" defaultValue={post.excerpt} rows={2} className="rounded-lg border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-600 outline-none focus:border-[#14508B]" />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select name="category" defaultValue={post.category} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#14508B]">
                            {educativoCategoryOptions.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                          <select name="status" defaultValue={post.status} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#14508B]">
                            <option value="draft">Rascunho</option>
                            <option value="published">Publicado</option>
                            <option value="archived">Arquivado</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">{formatDate(post.updated_at)}</span>
                          <div className="flex gap-2">
                            {post.status === 'published' ? (
                              <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="rounded-lg bg-[#EAF6FF] px-3 py-2 text-xs font-bold text-[#14508B]">Ver</a>
                            ) : null}
                            <button type="submit" className="rounded-lg bg-[#14508B] px-3 py-2 text-xs font-bold text-white">Salvar</button>
                          </div>
                        </div>
                      </form>
                      <form action={deleteEducativoPostAction} className="mt-2">
                        <input type="hidden" name="id" value={post.id} />
                        <button type="submit" className="text-xs font-bold text-red-600">Excluir post</button>
                      </form>
                    </article>
                  ))
                ) : (
                  <p className="rounded-lg bg-white px-3 py-4 text-sm leading-6 text-slate-600">Nenhum post editorial criado ainda.</p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-6" id="leads">
        <Panel title="Clientes não atendidos por etapa" subtitle={`${workQueueTotal} oportunidades em acompanhamento. Arraste mentalmente a rotina da esquerda para a direita: novo contato, conversa, interesse, pagamento e confirmacao.`}>
          <div className="grid gap-4 lg:grid-cols-5">
            {leadBoardStages.map((stage) => {
              const items = data.leadBoard.filter((lead) => lead.stage === stage).slice(0, 4);

              return (
                <div key={stage} className="rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#0F3760]">{stageLabel[stage] ?? stage}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#14508B]">{items.length}</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {items.length ? (
                      items.map((lead) => (
                        <article key={lead.id} className="rounded-lg bg-white p-3 shadow-[0_12px_30px_-26px_rgba(20,80,139,0.9)]">
                          <strong className="block text-sm leading-5 text-[#0F3760]">{lead.full_name}</strong>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">{lead.phone_whatsapp ?? lead.email ?? 'Sem contato'}</span>
                          <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#15A7DD]">{lead.source}</span>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-lg bg-white px-3 py-4 text-xs leading-5 text-slate-500">Sem pacientes nestá etapa.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>

      <section className="mt-8" id="exames">
        <Panel title="Exames enviados pelos pacientes" subtitle="Arquivos anexados no portal do paciente para adiantar a documentação médica.">
          {data.exams.some((exam) => !exam.reviewed_at) ? (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
              <span className="mt-0.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-amber-500" />
              <div>
                <strong className="block">Há documentos novos aguardando conferência.</strong>
                <span className="mt-1 block leading-6">A secretaria e o médico já podem abrir os arquivos enviados pelos pacientes abaixo.</span>
              </div>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Paciente</th>
                  <th className="py-3 pr-4">Exame</th>
                  <th className="py-3 pr-4">Arquivo</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Enviado</th>
                  <th className="py-3 pr-4">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.exams.length ? (
                  data.exams.map((exam) => (
                    <tr key={exam.id}>
                      <td className="py-3 pr-4">
                        <strong className="block text-[#0F3760]">{exam.patient_full_name}</strong>
                        <span className="text-xs text-slate-500">{exam.patient_phone_whatsapp ?? exam.patient_email}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="block text-slate-700">{exam.exam_type}</span>
                        <span className="text-xs text-slate-500">Data do exame: {formatShortDate(exam.exam_date)}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        <span className="block max-w-[220px] truncate">{exam.original_file_name}</span>
                        <span className="text-xs text-slate-500">{formatFileSize(exam.file_size_bytes)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{!exam.reviewed_at ? 'Novo • recebido' : exam.status === 'received' ? 'Recebido' : exam.status}</StatusBadge>
                        <span className="mt-1 block text-[11px] text-slate-500">
                          {exam.device_platform ? `Dispositivo: ${exam.device_platform.replaceAll('"', '')}` : 'Dispositivo registrado'}
                          {exam.upload_ip ? ` • IP ${exam.upload_ip}` : ''}
                        </span>
                        {exam.location_consent_at ? <span className="mt-1 block text-[11px] font-semibold text-emerald-700">Localização autorizada</span> : null}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(exam.created_at)}</td>
                      <td className="py-3 pr-4">
                        <a href={`/api/exams/${exam.id}/file`} target="_blank" rel="noreferrer" className="inline-flex rounded-lg bg-[#14508B] px-3 py-2 text-xs font-bold text-white hover:bg-[#0F3760]">
                          Abrir
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={6} text="Nenhum exame enviado ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]" id="consultas">
        <Panel title="Últimas consultas" subtitle="Solicitações mais recentes feitas pelo portal do paciente.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Paciente</th>
                  <th className="py-3 pr-4">Médico</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Criada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.appointments.length ? (
                  data.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="py-3 pr-4">
                        <strong className="block text-[#0F3760]">{appointment.patient_name}</strong>
                        <span className="text-xs text-slate-500">{appointment.patient_email}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{appointment.doctor_name ?? 'A definir'}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{appointmentStatusLabel[appointment.status] ?? appointment.status}</StatusBadge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(appointment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={4} text="Nenhuma consulta registrada ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Funil de leads" subtitle="Distribuicao atual por etapa comercial.">
          <div className="grid gap-3">
            {data.stages.length ? (
              data.stages.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between gap-4 rounded-lg bg-[#F4F9FF] px-4 py-3">
                  <span className="text-sm font-semibold text-[#0F3760]">{stageLabel[stage.stage] ?? stage.stage}</span>
                  <strong className="text-sm text-[#14508B]">{stage.total}</strong>
                </div>
              ))
            ) : (
              <p className="rounded-lg bg-[#F4F9FF] px-4 py-3 text-sm text-slate-600">Nenhum lead registrado ainda.</p>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Últimos usuários" subtitle="Contas criadas no sistema." id="pacientes">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Nome</th>
                  <th className="py-3 pr-4">Perfil</th>
                  <th className="py-3 pr-4">Ativo</th>
                  <th className="py-3 pr-4">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <strong className="block text-[#0F3760]">{user.full_name}</strong>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{roleLabel[user.role] ?? user.role}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge>{user.is_active ? 'Sim' : 'Não'}</StatusBadge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Últimos leads" subtitle="Entradas recentes no funil da secretaria.">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Lead</th>
                  <th className="py-3 pr-4">Origem</th>
                  <th className="py-3 pr-4">Etapa</th>
                  <th className="py-3 pr-4">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.leads.length ? (
                  data.leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="py-3 pr-4">
                        <strong className="block text-[#0F3760]">{lead.full_name}</strong>
                        <span className="text-xs text-slate-500">{lead.phone_whatsapp ?? lead.email ?? 'Sem contato'}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{lead.source}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{stageLabel[lead.stage] ?? lead.stage}</StatusBadge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(lead.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={4} text="Nenhum lead registrado ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mt-6 scroll-mt-24" id="financeiro">
        <Panel title="Financeiro e pagamentos" subtitle="Movimentações registradas pelo fluxo Asaas/webhook, com leitura rapida de recebidos e pendencias.">
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <InsightCard label="Recebido no mes" value={formatMoney(data.revenueMonthPaidCents)} detail="Pagamentos confirmados dentro do mes atual." />
            <InsightCard label="Em aberto no mes" value={formatMoney(data.revenueMonthOpenCents)} detail="Pendentes, autorizados ou vencidos dentro do mes." />
            <InsightCard label="Previsão total" value={formatMoney(data.forecastRevenueCents)} detail={`${data.monthlyGoalProgress}% da meta mensal configurada.`}>
              <ProgressBar value={data.monthlyGoalProgress} />
            </InsightCard>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Paciente</th>
                  <th className="py-3 pr-4">Valor</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Provedor</th>
                  <th className="py-3 pr-4">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.length ? (
                  data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 pr-4 font-semibold text-[#0F3760]">{payment.patient_name}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatMoney(payment.amount_cents)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge>{paymentStatusLabel[payment.status] ?? payment.status}</StatusBadge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{payment.provider}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(payment.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow colSpan={5} text="Nenhum pagamento registrado ainda." />
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      <section className="mt-6 scroll-mt-24" id="relatorios">
        <Panel title="Relatórios e exportação" subtitle="Baixe CSV por área com período rápido ou abra o relatório mensal executivo para salvar em PDF.">
          <div className="mb-5 flex flex-wrap gap-2">
            <a href="/api/internal/monthly-report" target="_blank" rel="noreferrer" className="rounded-lg bg-[#14508B] px-4 py-2 text-sm font-bold text-white hover:bg-[#0F3760]">
              Abrir PDF mensal
            </a>
            {['7d', '30d', 'mes'].map((period) => (
              <a key={period} href={`/api/internal/export?tipo=leads&período=${period}`} className="rounded-lg border border-[#14508B]/15 px-4 py-2 text-sm font-bold text-[#14508B] hover:border-[#14508B]/45">
                Leads {period === 'mes' ? 'mes atual' : period}
              </a>
            ))}
          </div>
          <form action="/api/internal/export" className="mb-5 grid gap-3 rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] p-4 md:grid-cols-[180px_1fr_1fr_auto]">
            <select name="tipo" className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <option value="leads">Leads</option>
              <option value="consultas">Consultas</option>
              <option value="financeiro">Financeiro</option>
              <option value="conteúdo">Conteúdo</option>
            </select>
            <input name="início" type="date" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700" />
            <input name="fim" type="date" className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700" />
            <button type="submit" className="min-h-11 rounded-lg bg-white px-4 text-sm font-bold text-[#14508B] hover:bg-[#EAF6FF]">Baixar período</button>
          </form>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Leads', 'CSV completo de leads por origem, etapa e período.', '/api/internal/export?tipo=leads'],
              ['Consultas', 'CSV completo de agenda, status e solicitações.', '/api/internal/export?tipo=consultas'],
              ['Financeiro', 'CSV completo de pagos, pendentes, vencidos e previsão.', '/api/internal/export?tipo=financeiro'],
              ['Conteúdo', 'CSV completo de posts, categorias e status editorial.', '/api/internal/export?tipo=conteúdo'],
            ].map(([title, description, href]) => (
              <a key={title} href={href} className="block rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] p-4 hover:border-[#14508B]/35 hover:bg-white">
                <strong className="text-sm text-[#0F3760]">{title}</strong>
                <span className="mt-2 block text-xs leading-5 text-slate-600">{description}</span>
                <span className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#14508B]">Baixar CSV</span>
              </a>
            ))}
          </div>
        </Panel>
      </section>
    </InternalShell>
  );
}

function WeeklyCalendar({ days, appointments, events }: { days: Date[]; appointments: WeeklyAppointment[]; events: ManualCalendarEvent[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[920px] grid-cols-7 gap-3">
        {days.map((day) => {
          const dayAppointments = appointments.filter((appointment) => isSameCalendarDay(appointment.scheduled_for, day));
          const dayEvents = events.filter((event) => isSameCalendarDay(event.starts_at, day));

          return (
            <article key={day.toISOString()} className="min-h-[220px] rounded-lg border border-[#14508B]/10 bg-[#F8FBFF] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#15A7DD]">{formatWeekday(day)}</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#0F3760]">{formatDayNumber(day)}</h3>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#14508B]">{dayAppointments.length + dayEvents.length}</span>
              </div>
              <div className="mt-3 grid gap-2">
                {dayEvents.map((event) => (
                  <div key={event.id} className="rounded-lg border border-[#15A7DD]/20 bg-white p-3">
                    <strong className="block text-sm text-[#0F3760]">{formatAppointmentTime(event.starts_at)}</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{event.title}</span>
                    {event.location ? <span className="mt-1 block text-[11px] text-slate-500">{event.location}</span> : null}
                    <span className="mt-2 inline-flex rounded-md bg-[#F4F9FF] px-2 py-1 text-[11px] font-bold text-[#14508B]">Compromisso</span>
                  </div>
                ))}
                {dayAppointments.length ? (
                  dayAppointments.map((appointment) => (
                    <div key={appointment.id} className="rounded-lg bg-white p-3 shadow-[0_12px_28px_-26px_rgba(20,80,139,0.9)]">
                      <strong className="block text-sm text-[#0F3760]">{formatAppointmentTime(appointment.scheduled_for)}</strong>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{appointment.patient_name}</span>
                      <span className="mt-2 inline-flex rounded-md bg-[#EAF6FF] px-2 py-1 text-[11px] font-bold text-[#14508B]">
                        {appointmentStatusLabel[appointment.status] ?? appointment.status}
                      </span>
                    </div>
                  ))
                ) : null}
                {!dayAppointments.length && !dayEvents.length ? (
                  <p className="rounded-lg border border-dashed border-[#14508B]/18 bg-white px-3 py-6 text-center text-xs leading-5 text-slate-500">
                    Sem compromisso marcado.
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getCurrentWeekDays() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(now.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function isSameCalendarDay(value: Date | null, day: Date) {
  if (!value) return false;
  return formatIsoDate(value) === formatIsoDate(day);
}

function formatIsoDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function formatDayNumber(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function formatAppointmentTime(value: Date | null) {
  if (!value) return '--:--';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(value);
}

function InsightCard({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-[#14508B]/12 bg-[#F8FBFF] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{label}</p>
      <strong className="mt-2 block text-3xl font-semibold text-[#0F3760]">{value}</strong>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white">
      <div className="h-full rounded-full bg-[#15A7DD]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function BarList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{title}</h3>
      <div className="mt-4 grid gap-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[#0F3760]">{row.label}</span>
                <span className="text-slate-500">{row.value}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAF6FF]">
                <div className="h-full rounded-full bg-[#14508B]" style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg bg-[#F4F9FF] px-4 py-3 text-sm text-slate-600">Sem dados suficientes ainda.</p>
        )}
      </div>
    </div>
  );
}

function WeatherCard({ weather }: { weather: WeatherSummary[] }) {
  return (
    <section className="rounded-2xl border border-[#14508B]/12 bg-white p-5 shadow-[0_24px_54px_-46px_rgba(20,80,139,0.72)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Clima dos municipios</p>
          <h2 className="mt-2 text-xl font-semibold text-[#0F3760]">Clima agora</h2>
        </div>
        <span className="rounded-full bg-[#EAF6FF] px-3 py-1 text-xs font-bold text-[#14508B]">deslize</span>
      </div>
      {weather.length ? (
        <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {weather.map((cityWeather) => (
            <article key={cityWeather.city} className="w-full min-w-full snap-start rounded-lg bg-[#F8FBFF] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">{cityWeather.city}</span>
                  <strong className="mt-2 block text-5xl font-semibold text-[#0F3760]">{Math.round(cityWeather.temperature ?? 0)}°</strong>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {cityWeather.condition}
                    {cityWeather.temperature !== null && cityWeather.temperature <= 16 ? ' / Frio' : ''}
                  </p>
                </div>
                <WeatherIcon code={cityWeather.conditionCode} className="h-16 w-16 text-[#F5B942]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
                <span className="rounded-lg bg-white px-2 py-3">Sensacao<br /><strong className="text-[#0F3760]">{Math.round(cityWeather.apparentTemperature ?? 0)}°</strong></span>
                <span className="rounded-lg bg-white px-2 py-3">Umidade<br /><strong className="text-[#0F3760]">{cityWeather.humidity ?? '-'}%</strong></span>
                <span className="rounded-lg bg-white px-2 py-3">Vento<br /><strong className="text-[#0F3760]">{Math.round(cityWeather.windSpeed ?? 0)} km/h</strong></span>
              </div>
              {cityWeather.forecast.length ? (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#15A7DD]">Previsão 4 dias</h3>
                    <span className="text-xs font-semibold text-slate-500">{cityWeather.shortCity}</span>
                  </div>
                  <div className="grid gap-2">
                    {cityWeather.forecast.map((day) => (
                      <div key={day.date} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border border-[#14508B]/10 bg-white px-3 py-2">
                        <WeatherIcon code={day.conditionCode} className="h-9 w-9 text-[#F5B942]" />
                        <div className="min-w-0">
                          <strong className="block text-sm text-[#0F3760]">{formatForecastDate(day.date)}</strong>
                          <span className="block truncate text-xs text-slate-500">{day.condition}</span>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <strong className="block text-sm text-[#14508B]">
                            {formatTemperatureRange(day.minTemperature, day.maxTemperature)}
                          </strong>
                          <span>{day.precipitationProbability ?? 0}% chuva</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-[#F4F9FF] px-4 py-3 text-sm leading-6 text-slate-600">Clima indisponivel agora. A dashboard continua operando normalmente.</p>
      )}
      {weather.length > 1 ? (
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {weather.map((cityWeather, index) => (
            <span key={cityWeather.city} className={`h-1.5 rounded-full ${index === 0 ? 'w-6 bg-[#14508B]' : 'w-1.5 bg-[#14508B]/28'}`} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function NewsCard({ news }: { news: NewsItem[] }) {
  const [topStory, ...otherStories] = news.slice(0, 5);

  return (
    <section className="border border-[#14508B]/12 bg-white p-5 shadow-[0_24px_54px_-46px_rgba(20,80,139,0.72)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#15A7DD]">Radar médico</p>
          <h2 className="mt-2 text-xl font-semibold text-[#0F3760]">Jornal rápido</h2>
        </div>
        <a href="https://news.google.com/" target="_blank" rel="noreferrer" className="text-xs font-bold text-[#14508B]">
          Abrir
        </a>
      </div>
      <div className="mt-4 grid gap-3">
        {topStory ? (
          <a
            href={topStory.link}
            target={topStory.link.startsWith('/') || topStory.link.startsWith('#') ? undefined : '_blank'}
            rel={topStory.link.startsWith('/') || topStory.link.startsWith('#') ? undefined : 'noreferrer'}
            className="block rounded-lg border border-[#14508B]/10 bg-[#F8FBFF] p-3 hover:border-[#14508B]/30 hover:bg-[#EAF6FF]"
          >
            <div className="flex gap-3">
              <NewsThumbnail item={topStory} size="large" />
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#15A7DD]">Destaque agora</span>
                <strong className="mt-1 block text-sm leading-5 text-[#0F3760]">{topStory.title}</strong>
                <span className="mt-2 block text-xs text-slate-500">{topStory.source}{topStory.publishedAt ? ` - ${formatNewsDate(topStory.publishedAt)}` : ''}</span>
              </div>
            </div>
          </a>
        ) : null}
        <div className="grid gap-2">
          {otherStories.slice(0, 4).map((item) => (
            <a
              key={`${item.title}-${item.source}`}
              href={item.link}
              target={item.link.startsWith('/') || item.link.startsWith('#') ? undefined : '_blank'}
              rel={item.link.startsWith('/') || item.link.startsWith('#') ? undefined : 'noreferrer'}
              className="grid grid-cols-[42px_1fr] items-center gap-3 rounded-lg bg-white px-2 py-2 hover:bg-[#F8FBFF]"
            >
              <NewsThumbnail item={item} size="small" />
              <div className="min-w-0">
                <strong className="line-clamp-2 text-sm leading-5 text-[#0F3760]">{item.title}</strong>
                <span className="mt-1 block truncate text-xs text-slate-500">{item.source}{item.publishedAt ? ` - ${formatNewsDate(item.publishedAt)}` : ''}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsThumbnail({ item, size }: { item: NewsItem; size: 'small' | 'large' }) {
  const dimension = size === 'large' ? 'h-14 w-14' : 'h-10 w-10';

  return (
    <span
      className={`${dimension} shrink-0 rounded-lg border border-[#14508B]/10 bg-[#EAF6FF] bg-cover bg-center text-center text-sm font-bold leading-10 text-[#14508B]`}
      style={item.thumbnailUrl ? { backgroundImage: `url("${item.thumbnailUrl}")` } : undefined}
      aria-hidden="true"
    >
      {item.thumbnailUrl ? '' : item.source.slice(0, 1)}
    </span>
  );
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M8 12.5 13.7 6.8a3.2 3.2 0 0 1 4.5 4.5l-7.1 7.1a5 5 0 0 1-7.1-7.1l7.6-7.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WeatherIcon({ code, className }: { code: number | null; className: string }) {
  if (code !== null && [61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <path d="M22 42h24a11 11 0 0 0 1-22 17 17 0 0 0-32 5 9 9 0 0 0 7 17Z" fill="#D9EEF9" stroke="#14508B" strokeWidth="3" />
        <path d="M22 49 18 58M34 49 30 58M46 49 42 58" stroke="#15A7DD" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (code !== null && [95, 96, 99].includes(code)) {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <path d="M21 40h25a10 10 0 0 0 1-20 17 17 0 0 0-32 5 8 8 0 0 0 6 15Z" fill="#EAF6FF" stroke="#14508B" strokeWidth="3" />
        <path d="m34 39-7 12h8l-5 10 13-15h-8l5-7h-6Z" fill="#F5B942" />
      </svg>
    );
  }

  if (code !== null && [1, 2, 3, 45, 48].includes(code)) {
    return (
      <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="11" fill="#F5B942" />
        <path d="M23 44h25a10 10 0 0 0 1-20 16 16 0 0 0-29 8 7 7 0 0 0 3 12Z" fill="#D9EEF9" stroke="#14508B" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="14" fill="currentColor" />
      <path d="M32 5v10M32 49v10M5 32h10M49 32h10M13 13l7 7M44 44l7 7M51 13l-7 7M20 44l-7 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function formatForecastDate(value: string) {
  const date = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return 'Dia';

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function formatTemperatureRange(min: number | null, max: number | null) {
  if (min === null || max === null) return '--';
  return `${Math.round(min)}°/${Math.round(max)}°`;
}

function formatNewsDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recente';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function Panel({
  title,
  subtitle,
  id,
  children,
}: {
  title: string;
  subtitle: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_54px_-46px_rgba(20,80,139,0.72)]">
      <div>
        <h2 className="text-xl font-semibold text-[#0F3760]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-lg bg-[#EAF6FF] px-3 py-1 text-xs font-bold text-[#14508B]">
      {children}
    </span>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-sm text-slate-500">
        {text}
      </td>
    </tr>
  );
}
