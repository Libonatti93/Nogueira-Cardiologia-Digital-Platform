import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { PoolClient } from 'pg';
import { query } from './db';

export const educationalCookie='nogueira_educativo_session';
export const educationalMaxAge=60*60*24*30;
export const educationalTokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function getEducationalAccess() {
  const token=(await cookies()).get(educationalCookie)?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const row=(await query<{id:string;full_name:string;email:string;phone_whatsapp:string}>(`select l.id,l.full_name,l.email,l.phone_whatsapp from educativo_access_sessions s
    join educativo_leads l on l.id=s.educational_lead_id where s.token_hash=$1 and s.expires_at>now()`,[educationalTokenHash(token)])).rows[0];
  if(!row || row.full_name.trim().length<3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) || !/^\d{10,15}$/.test(row.phone_whatsapp.replace(/\D/g,'')))return null;
  return row;
}
export const educationalAccessLabel=(access:{id:string;full_name:string}) => `${access.full_name.slice(0,45)} · ${createHash('sha256').update(access.id).digest('hex').slice(0,12)}`;
export async function limitEducationalViewing(leadId:string) {
  const key=createHash('sha256').update('educativo-view:'+leadId).digest('hex');
  const result=(await query<{attempts:number}>(`insert into auth_rate_limits values($1,1,now()+interval '1 minute')
    on conflict(key) do update set attempts=case when auth_rate_limits.expires_at<now() then 1 else auth_rate_limits.attempts+1 end,
    expires_at=case when auth_rate_limits.expires_at<now() then now()+interval '1 minute' else auth_rate_limits.expires_at end returning attempts`,[key])).rows[0];
  return result.attempts<=90;
}
export async function issueEducationalAccess(client:PoolClient,leadId:string) {
  const token=randomBytes(32).toString('hex');
  await client.query('delete from educativo_access_sessions where expires_at<now()');
  await client.query(`insert into educativo_access_sessions(token_hash,educational_lead_id,expires_at) values($1,$2,now()+interval '30 days')`,[educationalTokenHash(token),leadId]);
  return token;
}
