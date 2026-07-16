export function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase Auth ainda não configurado. Configure SUPABASE_URL e SUPABASE_ANON_KEY.');
  }

  return { supabaseUrl, anonKey };
}

export function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
