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
  return row||null;
}
export async function issueEducationalAccess(client:PoolClient,leadId:string) {
  const token=randomBytes(32).toString('hex');
  await client.query('delete from educativo_access_sessions where expires_at<now()');
  await client.query(`insert into educativo_access_sessions(token_hash,educational_lead_id,expires_at) values($1,$2,now()+interval '30 days')`,[educationalTokenHash(token),leadId]);
  return token;
}
