type AsaasEnvironment = 'sandbox' | 'production';

type AsaasCustomerPayload = {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone: string;
  externalReference: string;
};

type AsaasCreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

type AsaasCreditCardHolderInfo = {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string | null;
  phone: string;
  mobilePhone: string;
};

type AsaasPaymentPayload = {
  customer: string;
  billingType: 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
  creditCard: AsaasCreditCard;
  creditCardHolderInfo: AsaasCreditCardHolderInfo;
  remoteIp: string;
};

type AsaasPixPaymentPayload = {
  customer: string;
  billingType: 'PIX';
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
};

export type AsaasCustomer = {
  id: string;
};

export type AsaasPayment = {
  id: string;
  status?: string;
  value?: number;
  billingType?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
  };
};

export class AsaasError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'AsaasError';
    this.status = status;
    this.details = details;
  }
}

type AsaasErrorResponse = {
  errors?: Array<{ description?: string }>;
};

const statusMap: Record<string, string> = {
  CONFIRMED: 'paid',
  RECEIVED: 'paid',
  RECEIVED_IN_CASH: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  AUTHORIZED: 'authorized',
};

function getAsaasEnvironment(): AsaasEnvironment {
  return process.env.ASAAS_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
}

function getAsaasBaseUrl() {
  return getAsaasEnvironment() === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3';
}

function getAsaasApiKey() {
  const apiKey = process.env.ASAAS_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY is not configured.');
  }

  return apiKey;
}

async function asaasRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getAsaasBaseUrl()}${path}`, {
    ...init,
    headers: {
      access_token: getAsaasApiKey(),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => null)) as T | AsaasErrorResponse | null;

  if (!response.ok) {
    const errorData = data && typeof data === 'object' && 'errors' in data ? data : null;
    const message =
      errorData?.errors?.[0]?.description
        ? errorData.errors[0].description
        : 'Não foi possível concluir a comunicação com o Asaas.';
    throw new AsaasError(message, response.status, data);
  }

  return data as T;
}

export function mapAsaasPaymentStatus(status: string | undefined) {
  return status ? statusMap[status] ?? 'pending' : 'pending';
}

export function getAppointmentPaymentAmountCents() {
  const configured = Number(process.env.ASAAS_APPOINTMENT_AMOUNT_CENTS);
  return Number.isFinite(configured) && configured > 0 ? Math.round(configured) : 74900;
}

export async function createAsaasCustomer(payload: AsaasCustomerPayload) {
  return asaasRequest<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      notificationDisabled: false,
      groupName: 'Portal do paciente',
    }),
  });
}

export async function createAsaasCreditCardPayment(payload: AsaasPaymentPayload) {
  return asaasRequest<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createAsaasPixPayment(payload: AsaasPixPaymentPayload) {
  return asaasRequest<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAsaasPixQrCode(paymentId: string) {
  return asaasRequest<{ encodedImage?: string; payload?: string; expirationDate?: string }>(
    `/payments/${encodeURIComponent(paymentId)}/pixQrCode`,
    { method: 'GET' },
  );
}

export async function getAsaasPayment(paymentId: string) {
  return asaasRequest<AsaasPayment>(`/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
  });
}
