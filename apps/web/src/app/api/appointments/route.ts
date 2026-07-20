import { NextResponse } from 'next/server';
import { getVerifiedPatientUser } from '@/lib/auth';
import { transaction } from '@/lib/db';

export const runtime = 'nodejs';

type AppointmentPayload = {
  fullName?: unknown;
  cpf?: unknown;
  phoneWhatsapp?: unknown;
  email?: unknown;
  birthDate?: unknown;
  heightCm?: unknown;
  weightKg?: unknown;
  doctorPreference?: unknown;
  hasHypertension?: unknown;
  hasDiabetes?: unknown;
  hasHighCholesterol?: unknown;
  isSmoker?: unknown;
  lgpdConsent?: unknown;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const user = await getVerifiedPatientUser();

  if (!user) {
    return NextResponse.json({ message: 'Confirme seu e-mail e entre no portal do paciente para solicitar consulta.' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let payload: AppointmentPayload;

  if (contentType.includes('application/json')) {
    payload = await request.json().catch(() => ({}));
  } else {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries());
  }

  const fullName = clean(payload.fullName);
  const cpf = clean(payload.cpf).replace(/\D/g, '');
  const email = clean(payload.email).toLowerCase();
  const phoneWhatsapp = clean(payload.phoneWhatsapp).replace(/\D/g, '');
  const birthDate = clean(payload.birthDate);
  const heightCm = Number(clean(payload.heightCm));
  const weightKg = Number(clean(payload.weightKg));

  if (fullName.length < 3) {
    return NextResponse.json({ message: 'Informe o nome completo.' }, { status: 400 });
  }

  if (cpf.length !== 11) {
    return NextResponse.json({ message: 'Informe um CPF válido com 11 dígitos.' }, { status: 400 });
  }

  if (!emailRegex.test(email)) {
    return NextResponse.json({ message: 'Informe um e-mail válido.' }, { status: 400 });
  }

  if (email !== user.email.toLowerCase()) {
    return NextResponse.json({ message: 'Use o mesmo e-mail confirmado da sua conta do portal.' }, { status: 400 });
  }

  if (phoneWhatsapp.length < 10) {
    return NextResponse.json({ message: 'Informe um WhatsApp válido com DDD.' }, { status: 400 });
  }

  if (!birthDate || !Number.isFinite(heightCm) || !Number.isFinite(weightKg)) {
    return NextResponse.json({ message: 'Informe data de nascimento, altura e peso.' }, { status: 400 });
  }

  if (payload.lgpdConsent !== 'true' && payload.lgpdConsent !== true) {
    return NextResponse.json({ message: 'É necessário aceitar o consentimento de uso de dados.' }, { status: 400 });
  }

  const healthIntake = {
    hasHypertension: payload.hasHypertension === 'true' || payload.hasHypertension === true,
    hasDiabetes: payload.hasDiabetes === 'true' || payload.hasDiabetes === true,
    hasHighCholesterol: payload.hasHighCholesterol === 'true' || payload.hasHighCholesterol === true,
    isSmoker: payload.isSmoker === 'true' || payload.isSmoker === true,
  };

  const persisted = await transaction(async (client) => {
    const patientResult = await client.query<{ id: string }>(
      `
        insert into patient_profiles (
          full_name,
          cpf,
          email,
          phone_whatsapp,
          birth_date,
          height_cm,
          weight_kg,
          lgpd_consent_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, now())
        on conflict (cpf) do update set
          updated_at = now(),
          full_name = excluded.full_name,
          email = excluded.email,
          phone_whatsapp = excluded.phone_whatsapp,
          birth_date = excluded.birth_date,
          height_cm = excluded.height_cm,
          weight_kg = excluded.weight_kg,
          lgpd_consent_at = coalesce(patient_profiles.lgpd_consent_at, excluded.lgpd_consent_at)
        returning id
      `,
      [fullName, cpf, email, phoneWhatsapp, birthDate, heightCm, weightKg],
    );
    const patientId = patientResult.rows[0].id;

    await client.query(
      `
        insert into patient_health_intakes (
          patient_id,
          has_hypertension,
          has_diabetes,
          has_high_cholesterol,
          is_smoker
        )
        values ($1, $2, $3, $4, $5)
      `,
      [
        patientId,
        healthIntake.hasHypertension,
        healthIntake.hasDiabetes,
        healthIntake.hasHighCholesterol,
        healthIntake.isSmoker,
      ],
    );

    const leadResult = await client.query<{ id: string }>(
      `
        insert into leads (
          full_name,
          email,
          phone_whatsapp,
          source,
          source_detail,
          stage,
          patient_id,
          notes
        )
        values ($1, $2, $3, 'portal_paciente', 'marcar_consulta', 'registered', $4, $5)
        returning id
      `,
      [fullName, email, phoneWhatsapp, patientId, `Preferência médica: ${clean(payload.doctorPreference) || 'primeiro horário disponível'}`],
    );
    const leadId = leadResult.rows[0].id;

    const doctorPreference = clean(payload.doctorPreference);
    const doctorResult = await client.query<{ id: string }>(
      `
        select id
        from doctors
        where is_active = true
          and (
            $1 = 'first-available'
            or ($1 = 'paulo' and full_name ilike '%Paulo%')
            or ($1 = 'cristiani' and full_name ilike '%Cristiani%')
          )
        order by full_name
        limit 1
      `,
      [doctorPreference || 'first-available'],
    );

    const appointmentResult = await client.query<{ id: string; status: string }>(
      `
        insert into appointments (
          patient_id,
          doctor_id,
          lead_id,
          status,
          reason
        )
        values ($1, $2, $3, 'requested', 'Solicitação criada pelo portal do paciente')
        returning id, status
      `,
      [patientId, doctorResult.rows[0]?.id ?? null, leadId],
    );

    await client.query(
      `
        insert into lead_events (lead_id, event_type, new_stage, note, metadata)
        values ($1, 'appointment_requested', 'registered', 'Paciente solicitou consulta pelo portal.', $2::jsonb)
      `,
      [leadId, JSON.stringify({ healthIntake, doctorPreference: doctorPreference || 'first-available' })],
    );

    return {
      patientId,
      leadId,
      appointmentId: appointmentResult.rows[0].id,
      appointmentStatus: appointmentResult.rows[0].status,
    };
  });

  return NextResponse.json({
    ok: true,
    status: 'appointment_requested',
    message: 'Solicitação registrada. A secretaria poderá acompanhar o lead no CRM e seguir para confirmação/checkout.',
    data: {
      ...persisted,
      fullName,
      cpf,
      email,
      phoneWhatsapp,
      birthDate,
      heightCm,
      weightKg,
      doctorPreference: clean(payload.doctorPreference),
      ...healthIntake,
    },
  });
}
