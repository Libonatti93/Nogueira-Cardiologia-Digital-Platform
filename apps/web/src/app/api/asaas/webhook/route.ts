import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type AsaasWebhookPayload = {
  event?: string;
  payment?: {
    id?: string;
    status?: string;
    value?: number;
    billingType?: string;
    customer?: string;
  };
};

const statusMap: Record<string, string> = {
  CONFIRMED: 'paid',
  RECEIVED: 'paid',
  RECEIVED_IN_CASH: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

export async function POST(request: Request) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = request.headers.get('asaas-access-token') ?? request.headers.get('x-asaas-webhook-token');

  if (configuredToken && receivedToken !== configuredToken) {
    return NextResponse.json({ message: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as AsaasWebhookPayload | null;

  if (!payload?.event || !payload.payment?.id) {
    return NextResponse.json({ message: 'Payload Asaas inválido.' }, { status: 400 });
  }

  const paymentStatus = payload.payment.status ? statusMap[payload.payment.status] ?? 'pending' : 'pending';

  const paymentUpdate = await query<{ id: string; appointment_id: string | null }>(
    `
      update payments
      set
        status = $1::payment_status,
        billing_type = coalesce($2, billing_type),
        raw_payload = $3::jsonb,
        paid_at = case when $1::payment_status = 'paid' then coalesce(paid_at, now()) else paid_at end,
        updated_at = now()
      where provider = 'asaas'
        and provider_payment_id = $4
      returning id, appointment_id
    `,
    [paymentStatus, payload.payment.billingType ?? null, JSON.stringify(payload), payload.payment.id],
  );

  if (paymentUpdate.rows[0]?.appointment_id && paymentStatus === 'paid') {
    await query(
      `
        update appointments
        set status = 'paid', updated_at = now()
        where id = $1
          and status in ('requested', 'awaiting_payment')
      `,
      [paymentUpdate.rows[0].appointment_id],
    );
  }

  await query(
    `
      insert into audit_logs (action, entity_type, entity_id, user_agent, metadata)
      values ('asaas_webhook_received', 'payment', $1, $2, $3::jsonb)
    `,
    [
      paymentUpdate.rows[0]?.id ?? null,
      request.headers.get('user-agent'),
      JSON.stringify({
        event: payload.event,
        paymentId: payload.payment.id,
        matchedPayment: Boolean(paymentUpdate.rowCount),
        status: paymentStatus,
      }),
    ],
  );

  return NextResponse.json({
    ok: true,
    status: paymentUpdate.rowCount ? 'payment_updated' : 'payment_not_found_logged',
    message: paymentUpdate.rowCount
      ? 'Webhook Asaas recebido e pagamento atualizado.'
      : 'Webhook Asaas recebido e registrado em auditoria; pagamento ainda não existe no banco.',
    event: payload.event,
    paymentId: payload.payment.id,
    paymentStatus,
  });
}
