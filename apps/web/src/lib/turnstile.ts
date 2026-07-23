type TurnstileVerificationResponse = {
  success: boolean;
  'error-codes'?: string[];
  action?: string;
  hostname?: string;
};

export function isTurnstileServerEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined;
}

export async function verifyTurnstileToken(request: Request, token: unknown, expectedAction?: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) return { ok: true, skipped: true };

  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, message: 'Confirme que você não é um robô para continuar.' };
  }

  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);

  const remoteIp = getClientIp(request);
  if (remoteIp) formData.append('remoteip', remoteIp);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const result = (await response.json()) as TurnstileVerificationResponse;

    if (!response.ok || !result.success) {
      return { ok: false, message: 'Não foi possível validar a proteção antirobô. Tente novamente.' };
    }

    if (expectedAction && result.action && result.action !== expectedAction) {
      return { ok: false, message: 'A validação de segurança não corresponde a este formulário.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: 'Não foi possível validar a proteção antirobô agora.' };
  }
}
