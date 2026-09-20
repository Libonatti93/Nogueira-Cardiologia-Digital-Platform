import { NextResponse } from 'next/server';
import { createSessionToken, getSessionUser, sessionCookie } from '@/lib/auth';
import { isSameOrigin } from '@/lib/access-policy';
import { validInternalPassword, panelLanding } from '@/lib/panel-policy';
import { audit } from '@/lib/audit';
import { query, transaction } from '@/lib/db';
import { createHash } from 'node:crypto';

export async function POST(request:Request) {
  if(!isSameOrigin(request))return NextResponse.json({message:'Origem inválida.'},{status:403});
  const user=await getSessionUser();
  if(!user||user.audience!=='internal'||!user.permissions?.includes('panel.access'))return NextResponse.json({message:'Acesso não autorizado.'},{status:user?403:401});
  const key=createHash('sha256').update(`password-change:${user.id}`).digest('hex');
  const limit=await query(`insert into auth_rate_limits values($1,1,now()+interval '15 minutes')
    on conflict(key) do update set attempts=case when auth_rate_limits.expires_at<now() then 1 else auth_rate_limits.attempts+1 end,
    expires_at=case when auth_rate_limits.expires_at<now() then now()+interval '15 minutes' else auth_rate_limits.expires_at end returning attempts`,[key]);
  if(limit.rows[0].attempts>8)return NextResponse.json({message:'Aguarde 15 minutos antes de tentar novamente.'},{status:429});
  let body;
  try { const raw=await request.text();if(raw.length>2000)throw new Error();body=JSON.parse(raw); }
  catch{return NextResponse.json({message:'Dados inválidos.'},{status:400});}
  if(typeof body?.currentPassword!=='string'||body.currentPassword.length>512||!validInternalPassword(body?.password))return NextResponse.json({message:'Use uma nova senha com pelo menos 12 caracteres e até 72 bytes.'},{status:400});
  const changed=await transaction(async client=>{
    // Serialize against governance changes so credentials cannot resurrect a revoked session.
    await client.query("select pg_advisory_xact_lock(hashtextextended('nogueira-governance',0))");
    const found=await client.query(`select id from app_users where id=$1 and is_active and session_version=$2
      and password_hash=crypt($3,password_hash) and password_hash<>crypt($4,password_hash) for update`,
    [user.id,user.sessionVersion,body.currentPassword,body.password]);
    if(!found.rowCount){await audit({actor:user.id,action:'auth.password.change',result:'denied'},request,client);return null;}
    const updated=await client.query(`update app_users set password_hash=crypt($2,gen_salt('bf',12)),must_change_password=false,
      password_changed_at=now(),session_version=session_version+1,updated_at=now() where id=$1 returning session_version`,[user.id,body.password]);
    await audit({actor:user.id,action:'auth.password.change',entity:'app_users',id:user.id,after:{must_change_password:false}},request,client);
    return updated.rows[0].session_version as number;
  });
  if(changed===null)return NextResponse.json({message:'Senha atual inválida, nova senha igual à atual ou sessão revogada.'},{status:400});
  // Never adopt a later version from another reset/revocation after this transaction commits.
  const updated={...user,mustChangePassword:false,sessionVersion:changed};
  const response=NextResponse.json({ok:true,redirectTo:panelLanding(updated)});
  response.cookies.set({name:sessionCookie.name,value:createSessionToken({id:updated.id,email:updated.email,fullName:updated.fullName,role:updated.role,sessionVersion:changed,audience:'internal'}),httpOnly:true,
    sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:sessionCookie.maxAge});
  return response;
}
