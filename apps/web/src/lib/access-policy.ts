export function hasPermission(user: { permissions?: string[] } | null, permission: string) {
  return Boolean(user?.permissions?.includes(permission));
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const allowed = [new URL(expected).origin, 'https://painel.nogueiracardiologia.com.br', ...(process.env.AUTH_ALLOWED_ORIGINS || '').split(',').filter(Boolean)];
  return origin !== null && allowed.includes(origin) && request.headers.get('sec-fetch-site') !== 'cross-site';
}

// Audit snapshots are an allowlist. No passwords, tokens, documents or free-form payloads.
export function accessSnapshot(row: Record<string, unknown>) {
  return Object.fromEntries(['id', 'full_name', 'is_active', 'role', 'roles', 'permissions', 'name', 'session_version', 'must_change_password']
    .filter((key) => key in row).map((key) => [key, row[key]]));
}
