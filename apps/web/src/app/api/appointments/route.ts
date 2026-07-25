import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  AsaasError,
  createAsaasCreditCardPayment,
  createAsaasCustomer,
  createAsaasPixPayment,
  getAppointmentPaymentAmountCents,
  getAsaasPixQrCode,
  mapAsaasPaymentStatus,
} from '@/lib/asaas';
import { getVerifiedPatientUser } from '@/lib/auth';
import { query, transaction } from '@/lib/db';
import { verifyTurnstileToken } from '@/lib/turnstile';

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
  modality?: unknown;
  scheduledFor?: unknown;
  paymentMethod?: unknown;
  hasHypertension?: unknown;
  hasDiabetes?: unknown;
  hasHighCholesterol?: unknown;
  isSmoker?: unknown;
  lgpdConsent?: unknown;
  cardHolderName?: unknown;
  cardNumber?: unknown;
  cardExpiryMonth?: unknown;
  cardExpiryYear?: unknown;
  cardCvv?: unknown;
  holderCpf?: unknown;
  holderPostalCode?: unknown;
  holderAddressNumber?: unknown;
  holderAddressComplement?: unknown;
  'cf-turnstile-response'?: unknown;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getTodayDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getClientIp(headerValue: string | null) {
  return headerValue?.split(',')[0]?.trim() || '127.0.0.1';
}

function sanitizeAsaasPayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const copy = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  delete copy.creditCard;
  delete copy.creditCardToken;
  return copy;
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
  const cardHolderName = clean(payload.cardHolderName);
  const cardNumber = clean(payload.cardNumber).replace(/\D/g, '');
  const cardExpiryMonth = clean(payload.cardExpiryMonth).padStart(2, '0');
  const cardExpiryYear = clean(payload.cardExpiryYear);
  const cardCvv = clean(payload.cardCvv).replace(/\D/g, '');
  const holderCpf = clean(payload.holderCpf).replace(/\D/g, '');
  const holderPostalCode = clean(payload.holderPostalCode).replace(/\D/g, '');
  const holderAddressNumber = clean(payload.holderAddressNumber);
  const holderAddressComplement = clean(payload.holderAddressComplement);
  const doctorPreference = clean(payload.doctorPreference);
  const modality = clean(payload.modality);
  const scheduledFor = clean(payload.scheduledFor);
  const scheduledDate = new Date(scheduledFor);
  const paymentMethod = clean(payload.paymentMethod);

  const turnstile = await verifyTurnstileToken(request, payload['cf-turnstile-response'], 'appointment-checkout');
  if (!turnstile.ok) {
    return NextResponse.json({ message: turnstile.message }, { status: 403 });
  }

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

  if (!['paulo', 'cristiani'].includes(doctorPreference) || !scheduledFor || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return NextResponse.json({ message: 'Escolha um médico, uma data e um horário disponíveis.' }, { status: 400 });
  }

  if (!['in_person', 'telemedicine'].includes(modality)) {
    return NextResponse.json({ message: 'Escolha consulta presencial ou telemedicina.' }, { status: 400 });
  }

  if (payload.lgpdConsent !== 'true' && payload.lgpdConsent !== true) {
    return NextResponse.json({ message: 'É necessário aceitar o consentimento de uso de dados.' }, { status: 400 });
  }

  if (!['pix', 'credit_card'].includes(paymentMethod)) {
    return NextResponse.json({ message: 'Escolha pagar por PIX ou cartão de crédito.' }, { status: 400 });
  }

  if (paymentMethod === 'credit_card' && (cardHolderName.length < 3 || cardNumber.length < 13 || cardNumber.length > 19)) {
    return NextResponse.json({ message: 'Informe os dados do cartão de crédito.' }, { status: 400 });
  }

  if (paymentMethod === 'credit_card' && (!/^\d{2}$/.test(cardExpiryMonth) || Number(cardExpiryMonth) < 1 || Number(cardExpiryMonth) > 12 || !/^\d{4}$/.test(cardExpiryYear))) {
    return NextResponse.json({ message: 'Informe uma validade de cartão válida.' }, { status: 400 });
  }

  if (paymentMethod === 'credit_card' && (cardCvv.length < 3 || cardCvv.length > 4)) {
    return NextResponse.json({ message: 'Informe o CVV do cartão.' }, { status: 400 });
  }

  if (paymentMethod === 'credit_card' && (holderCpf.length !== 11 || holderPostalCode.length !== 8 || !holderAddressNumber)) {
    return NextResponse.json({ message: 'Informe CPF, CEP e número do endereço do titular.' }, { status: 400 });
  }

  const healthIntake = {
    hasHypertension: payload.hasHypertension === 'true' || payload.hasHypertension === true,
    hasDiabetes: payload.hasDiabetes === 'true' || payload.hasDiabetes === true,
    hasHighCholesterol: payload.hasHighCholesterol === 'true' || payload.hasHighCholesterol === true,
    isSmoker: payload.isSmoker === 'true' || payload.isSmoker === true,
  };

  const amountCents = getAppointmentPaymentAmountCents();
  const amount = amountCents / 100;
  const requestHeaders = await headers();
  const remoteIp = getClientIp(requestHeaders.get('x-forwarded-for') ?? requestHeaders.get('x-real-ip'));

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
        values ($1, $2, $3, 'portal_paciente', 'marcar_consulta', 'awaiting_payment', $4, $5)
        returning id
      `,
      [fullName, email, phoneWhatsapp, patientId, `${modality === 'telemedicine' ? 'Telemedicina' : 'Consulta presencial'} escolhida para ${scheduledFor}`],
    );
    const leadId = leadResult.rows[0].id;

    const doctorResult = await client.query<{ id: string }>(
      `
        select id
        from doctors
        where is_active = true
          and (
            ($1 = 'paulo' and full_name ilike '%Paulo%')
            or ($1 = 'cristiani' and full_name ilike '%Cristiani%')
          )
        order by full_name
        limit 1
      `,
      [doctorPreference],
    );
    const doctorId = doctorResult.rows[0]?.id;

    if (!doctorId) {
      throw new Error('Médico não encontrado para o horário escolhido.');
    }

    const occupied = await client.query(
      `
        select id
        from appointments
        where doctor_id = $1
          and scheduled_for = $2
          and status not in ('cancelled', 'no_show')
        limit 1
      `,
      [doctorId, scheduledDate],
    );

    if (occupied.rowCount) {
      throw new Error('Este horário acabou de ser reservado. Volte à agenda e escolha outro horário.');
    }

    const appointmentResult = await client.query<{ id: string; status: string }>(
      `
        insert into appointments (
          patient_id,
          doctor_id,
          lead_id,
          scheduled_for,
          modality,
          status,
          reason
        )
        values ($1, $2, $3, $4, $5, 'awaiting_payment', 'Consulta agendada pelo portal do paciente')
        returning id, status
      `,
      [patientId, doctorId, leadId, scheduledDate, modality],
    );

    await client.query(
      `
        insert into lead_events (lead_id, event_type, new_stage, note, metadata)
        values ($1, 'appointment_requested', 'awaiting_payment', 'Paciente solicitou consulta pelo portal e iniciou checkout Asaas.', $2::jsonb)
      `,
      [leadId, JSON.stringify({ healthIntake, doctorPreference, modality, scheduledFor, amountCents })],
    );

    return {
      patientId,
      leadId,
      appointmentId: appointmentResult.rows[0].id,
      appointmentStatus: appointmentResult.rows[0].status,
    };
  });

  let asaasCustomerId = '';
  let asaasPayment;

  try {
    const existingCustomer = await query<{ provider_customer_id: string }>(
      `
        select provider_customer_id
        from payments
        where patient_id = $1
          and provider = 'asaas'
          and provider_customer_id is not null
        order by created_at desc
        limit 1
      `,
      [persisted.patientId],
    );

    asaasCustomerId =
      existingCustomer.rows[0]?.provider_customer_id ??
      (
        await createAsaasCustomer({
          name: fullName,
          cpfCnpj: cpf,
          email,
          mobilePhone: phoneWhatsapp,
          externalReference: persisted.patientId,
        })
      ).id;

    asaasPayment =
      paymentMethod === 'pix'
        ? await createAsaasPixPayment({
            customer: asaasCustomerId,
            billingType: 'PIX',
            value: amount,
            dueDate: getTodayDate(),
            description: 'Consulta cardiológica de 60 minutos - Nogueira Cardiologia',
            externalReference: persisted.appointmentId,
          })
        : await createAsaasCreditCardPayment({
            customer: asaasCustomerId,
            billingType: 'CREDIT_CARD',
            value: amount,
            dueDate: getTodayDate(),
            description: 'Consulta cardiológica de 60 minutos - Nogueira Cardiologia',
            externalReference: persisted.appointmentId,
            creditCard: {
              holderName: cardHolderName,
              number: cardNumber,
              expiryMonth: cardExpiryMonth,
              expiryYear: cardExpiryYear,
              ccv: cardCvv,
            },
            creditCardHolderInfo: {
              name: cardHolderName,
              email,
              cpfCnpj: holderCpf,
              postalCode: holderPostalCode,
              addressNumber: holderAddressNumber,
              addressComplement: holderAddressComplement || null,
              phone: phoneWhatsapp,
              mobilePhone: phoneWhatsapp,
            },
            remoteIp,
          });
  } catch (error) {
    await query(
      `
        insert into audit_logs (action, entity_type, entity_id, user_agent, metadata)
        values ('asaas_checkout_failed', 'appointment', $1, $2, $3::jsonb)
      `,
      [
        persisted.appointmentId,
        request.headers.get('user-agent'),
        JSON.stringify({
          patientId: persisted.patientId,
          leadId: persisted.leadId,
          message: error instanceof Error ? error.message : 'Erro desconhecido no Asaas',
          status: error instanceof AsaasError ? error.status : null,
          details: error instanceof AsaasError ? error.details : null,
        }),
      ],
    );

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Não foi possível processar o pagamento no Asaas.' },
      { status: error instanceof AsaasError ? 400 : 502 },
    );
  }

  const paymentStatus = mapAsaasPaymentStatus(asaasPayment.status);
  const pixQrCode = paymentMethod === 'pix' ? await getAsaasPixQrCode(asaasPayment.id).catch(() => null) : null;
  const checkoutUrl = asaasPayment.invoiceUrl ?? asaasPayment.bankSlipUrl ?? asaasPayment.transactionReceiptUrl ?? null;
  const paymentResult = await transaction(async (client) => {
    const result = await client.query<{ id: string }>(
      `
        insert into payments (
          patient_id,
          appointment_id,
          provider,
          provider_customer_id,
          provider_payment_id,
          billing_type,
          status,
          amount_cents,
          checkout_url,
          pix_qr_code,
          due_date,
          paid_at,
          raw_payload
        )
        values ($1, $2, 'asaas', $3, $4, $5, $6::payment_status, $7, $8, $9, $10, case when $6::payment_status = 'paid' then now() else null end, $11::jsonb)
        returning id
      `,
      [
        persisted.patientId,
        persisted.appointmentId,
        asaasCustomerId,
        asaasPayment.id,
        asaasPayment.billingType ?? 'CREDIT_CARD',
        paymentStatus,
        amountCents,
        checkoutUrl,
        pixQrCode?.payload ?? null,
        getTodayDate(),
        JSON.stringify({ ...sanitizeAsaasPayload(asaasPayment), pixQrCode }),
      ],
    );

    await client.query(
      `
        update appointments
        set status = case when $2::payment_status = 'paid' then 'paid'::appointment_status else status end,
          updated_at = now()
        where id = $1
      `,
      [persisted.appointmentId, paymentStatus],
    );

    await client.query(
      `
        update leads
        set stage = case when $2::payment_status = 'paid' then 'paid'::lead_stage else 'awaiting_payment'::lead_stage end,
          updated_at = now()
        where id = $1
      `,
      [persisted.leadId, paymentStatus],
    );

    await client.query(
      `
        insert into lead_events (lead_id, event_type, new_stage, note, metadata)
        values ($1, 'asaas_payment_created', case when $2::payment_status = 'paid' then 'paid'::lead_stage else 'awaiting_payment'::lead_stage end, $3, $4::jsonb)
      `,
      [
        persisted.leadId,
        paymentStatus,
        paymentStatus === 'paid' ? 'Pagamento confirmado pelo checkout transparente Asaas.' : 'Cobranca criada no checkout transparente Asaas.',
        JSON.stringify({
          paymentId: result.rows[0].id,
          providerPaymentId: asaasPayment.id,
          status: asaasPayment.status,
          amountCents,
          cardBrand: asaasPayment.creditCard?.creditCardBrand ?? null,
          cardLastDigits: asaasPayment.creditCard?.creditCardNumber ?? null,
        }),
      ],
    );

    return result.rows[0];
  });

  return NextResponse.json({
    ok: true,
    status: paymentStatus === 'paid' ? 'payment_confirmed' : 'awaiting_payment',
    message:
      paymentStatus === 'paid'
        ? 'Pagamento confirmado. Sua consulta foi reservada.'
        : 'Seu horário foi selecionado e o pagamento está em processamento.',
    data: {
      ...persisted,
      paymentId: paymentResult.id,
      providerPaymentId: asaasPayment.id,
      paymentStatus,
      checkoutUrl,
      paymentMethod,
      pixCopyPaste: pixQrCode?.payload ?? null,
      pixQrCodeImage: pixQrCode?.encodedImage ?? null,
      fullName,
      cpf,
      email,
      phoneWhatsapp,
      birthDate,
      heightCm,
      weightKg,
      doctorPreference,
      modality,
      scheduledFor,
      ...healthIntake,
    },
  });
}
