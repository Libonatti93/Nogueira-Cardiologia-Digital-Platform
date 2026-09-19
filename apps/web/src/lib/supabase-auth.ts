import { createClient } from '@supabase/supabase-js';
import { getPublicBaseUrl } from '@/lib/email-verification';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseAuthConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function createSupabaseAuthClient() {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseEmailRedirectUrl(request: Request) {
  return `${getPublicBaseUrl(request)}/portal?verified=1`;
}

export function getSupabasePasswordResetRedirectUrl(request: Request) {
  return `${getPublicBaseUrl(request)}/portal/redefinir-senha`;
}

export function normalizeSupabaseAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('email not confirmed') || normalized.includes('not confirmed')) {
    return {
      code: 'email_not_verified',
      message: 'Confirme seu e-mail antes de entrar no portal. Se não recebeu, solicite um novo link.',
      status: 403,
    };
  }

  if (normalized.includes('invalid login credentials')) {
    return {
      message: 'E-mail ou senha inválidos.',
      status: 401,
    };
  }

  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return {
      message: 'Este e-mail já possui cadastro. Use a área de login.',
      status: 409,
    };
  }

  if (normalized.includes('email address') && normalized.includes('invalid')) {
    return {
      message: 'Informe um e-mail válido. Alguns domínios de teste podem ser recusados pelo verificador.',
      status: 400,
    };
  }

  if (normalized.includes('rate limit') || normalized.includes('too many')) {
    return {
      message: 'O envio de e-mails atingiu o limite temporário do provedor. Aguarde alguns minutos e tente novamente.',
      status: 429,
    };
  }

  if (normalized.includes('password') && normalized.includes('6')) {
    return {
      message: 'A senha precisa ter pelo menos 6 caracteres.',
      status: 400,
    };
  }

  return {
    message: 'Não foi possível concluir agora. Tente novamente em alguns instantes.',
    status: 400,
  };
}
