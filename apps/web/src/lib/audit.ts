import { isIP } from 'node:net';
import type { PoolClient } from 'pg';
import { query } from '@/lib/db';

export type AuditEvent = {
  actor?: string; action: string; entity?: string; id?: string; key?: string;
  result?: 'success' | 'denied' | 'failure'; before?: object; after?: object;
  metadata?: { permission?: string; provider?: string; migration?: string; path?: string; code?: string; kind?: string };
};

export async function audit(event: AuditEvent, request?: Request, client?: PoolClient) {
  // Traefik appends the connecting client at the end of X-Forwarded-For.
  const candidate = request?.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const ip = candidate && isIP(candidate) ? candidate : null;
  const params = [event.actor ?? null, event.action, event.entity ?? 'access', event.id ?? null,
    event.key ?? null, event.result ?? 'success', ip,
    JSON.stringify(event.metadata ?? {}), event.before ? JSON.stringify(event.before) : null,
    event.after ? JSON.stringify(event.after) : null];
  const sql = `insert into audit_logs (actor_user_id, action, entity_type, entity_id, entity_key,
    result, ip_address, metadata, before_data, after_data) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`;
  if (client) await client.query(sql, params); else await query(sql, params);
}
