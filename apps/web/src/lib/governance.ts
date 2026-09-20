import { transaction, query } from '@/lib/db';
import { audit } from '@/lib/audit';
import { accessSnapshot } from '@/lib/access-policy';
import type { SessionUser } from '@/lib/auth';
import { validInternalPassword } from '@/lib/panel-policy';

export class GovernanceError extends Error { constructor(message: string, public status = 400) { super(message); } }
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function list(value: unknown) {
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string') || value.length > 50) throw new GovernanceError('Lista de acessos inválida.');
  return [...new Set(value)] as string[];
}
export async function governanceOverview(search: string, offset = 0) {
  const [users, roles, permissions,summary] = await Promise.all([
    query(`select u.id,u.full_name,u.email,u.role,u.is_active,u.last_login_at,u.created_at,u.must_change_password,
      u.password_hash is not null as has_local_credential,
      coalesce((select array_agg(distinct rp.permission_id) from user_roles x join role_permissions rp on rp.role_id=x.role_id where x.user_id=u.id),'{}') permissions,
      coalesce(array_agg(ur.role_id) filter (where ur.role_id is not null),'{}') roles
      from app_users u left join user_roles ur on ur.user_id=u.id
      where u.full_name ilike $1 or u.email::text ilike $1 group by u.id order by u.full_name limit 100 offset $2`, [`%${search.slice(0,100)}%`, offset]),
    query(`select r.*,(select count(*)::int from user_roles ur where ur.role_id=r.id) user_count,
      coalesce(array_agg(rp.permission_id) filter (where rp.permission_id is not null),'{}') permissions
      from roles r left join role_permissions rp on rp.role_id=r.id group by r.id order by r.id`),
    query('select * from permissions order by module,id'),
    query(`select
      count(*) filter(where is_active and exists(select 1 from user_roles ur where ur.user_id=u.id))::int internal_active,
      count(*) filter(where is_active and exists(select 1 from user_roles ur where ur.user_id=u.id and ur.role_id='MASTER'))::int masters,
      count(*) filter(where is_active and exists(select 1 from user_roles ur where ur.user_id=u.id and ur.role_id='CRM_OPERATOR'))::int crm_operators,
      count(*) filter(where is_active and role='doctor')::int doctors,
      count(*) filter(where not is_active)::int inactive,
      count(*) filter(where last_login_at>now()-interval '24 hours')::int recent_access from app_users u`),
  ]);
  return { users: users.rows, roles: roles.rows, permissions: permissions.rows, summary:summary.rows[0] };
}

export async function changeAccess(actor: SessionUser, body: Record<string, unknown>, request: Request) {
  return transaction(async client => {
    await client.query("select pg_advisory_xact_lock(hashtextextended('nogueira-governance',0))");
    const actorAccess = await client.query(`select 1 from app_users u join user_roles ur on ur.user_id=u.id
      join role_permissions rp on rp.role_id=ur.role_id where u.id=$1 and u.is_active and not u.must_change_password
      and u.session_version=$2 and rp.permission_id='governance.manage'`, [actor.id, actor.sessionVersion]);
    if (!actorAccess.rowCount) throw new GovernanceError('Acesso revogado.', 403);
    if (body.operation === 'revoke' || body.operation === 'credential') {
      const id=text(body.id,36);
      if (!uuid.test(id)) throw new GovernanceError('Usuário inválido.');
      const target=(await client.query(`select u.id,u.session_version,u.must_change_password,
        exists(select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id
          where ur.user_id=u.id and rp.permission_id='panel.access') internal,
        exists(select 1 from user_roles ur where ur.user_id=u.id and ur.role_id='MASTER') master
        from app_users u where u.id=$1 for update`,[id])).rows[0];
      if (!target) throw new GovernanceError('Usuário não encontrado.',404);
      if (body.operation==='credential') {
        if (id===actor.id) throw new GovernanceError('Use Alterar minha senha para sua própria credencial.',409);
        if (!target.internal) throw new GovernanceError('Atribua um perfil com acesso ao painel antes de habilitar a credencial.');
        if (!validInternalPassword(body.password)) throw new GovernanceError('Use uma senha temporária com pelo menos 12 caracteres e até 72 bytes.');
        if (target.master) {
          const ready=await client.query(`select 1 from app_users u join user_roles ur on ur.user_id=u.id
            where ur.role_id='MASTER' and u.id<>$1 and u.is_active and u.password_hash is not null and not u.must_change_password`,[id]);
          if (!ready.rowCount) throw new GovernanceError('Mantenha outro MASTER com credencial ativa antes de redefinir este acesso.',409);
        }
        await client.query(`update app_users set password_hash=crypt($2,gen_salt('bf',12)),must_change_password=true,
          session_version=session_version+1,updated_at=now() where id=$1`,[id,body.password]);
      } else {
        await client.query('update app_users set session_version=session_version+1,updated_at=now() where id=$1',[id]);
      }
      await audit({actor:actor.id,action:body.operation==='credential'?'governance.credential.reset':'governance.session.revoke',
        entity:'app_users',id,before:{session_version:target.session_version},
        after:{session_version:target.session_version+1,...(body.operation==='credential'?{must_change_password:true}:{})}},request,client);
      return {ok:true,id};
    }
    if (body.operation === 'role') {
      const id = text(body.id, 40);
      const name = text(body.name, 100);
      const permissions = list(body.permissions);
      if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(id) || !name || id === 'MASTER') throw new GovernanceError('Perfil inválido ou protegido.');
      if (permissions.length && !permissions.includes('panel.access')) throw new GovernanceError('Perfis internos exigem panel.access.');
      if (id==='CRM_OPERATOR' && permissions.some(permission=>permission!=='panel.access'&&!permission.startsWith('crm.'))) {
        throw new GovernanceError('CRM_OPERATOR é operacional. Conceda outro perfil explicitamente para acessos adicionais.');
      }
      for (const [permission, prerequisite] of [
        ['governance.manage', 'governance.read'], ['audit.read', 'governance.read'],
        ['lios.manage', 'lios.read'], ['lios.publish', 'lios.read'],
        ['content.manage', 'internal.access'], ['reports.export', 'internal.access'], ['exams.read', 'internal.access'],
        ['crm.leads.read','crm.access'],['crm.leads.manage','crm.leads.read'],
        ['crm.patients.read','crm.access'],['crm.appointments.read','crm.access'],
        ['crm.appointments.manage','crm.appointments.read'],['crm.appointments.manage','crm.patients.read'],
      ]) {
        if (permissions.includes(permission) && !permissions.includes(prerequisite)) {
          throw new GovernanceError(`A permissão ${permission} exige ${prerequisite}.`);
        }
      }
      if (!permissions.includes('governance.manage')) {
        const self = await client.query(`select 1 from user_roles where user_id=$1 and role_id=$2`,[actor.id,id]);
        const alternative = await client.query(`select 1 from user_roles ur join role_permissions rp on rp.role_id=ur.role_id
          where ur.user_id=$1 and ur.role_id<>$2 and rp.permission_id='governance.manage'`,[actor.id,id]);
        if(self.rowCount&&!alternative.rowCount)throw new GovernanceError('Não é permitido remover seu próprio acesso de gestão.',409);
      }
      const valid = await client.query('select id from permissions where id=any($1::text[])', [permissions]);
      if (valid.rowCount !== permissions.length) throw new GovernanceError('Permissão desconhecida.');
      const before = await client.query(`select r.id,r.name,array_agg(rp.permission_id) permissions from roles r
        left join role_permissions rp on rp.role_id=r.id where r.id=$1 group by r.id`, [id]);
      await client.query(`insert into roles(id,name) values($1,$2) on conflict(id) do update set name=excluded.name`, [id,name]);
      await client.query('delete from role_permissions where role_id=$1', [id]);
      await client.query('insert into role_permissions select $1,unnest($2::text[])', [id,permissions]);
      await client.query(`update app_users set session_version=session_version+1
        where id in (select user_id from user_roles where role_id=$1)`, [id]);
      await audit({ actor: actor.id, action: 'governance.role.update', entity: 'roles', key: id,
        before: before.rows[0] ? accessSnapshot(before.rows[0]) : {}, after: { id,name,permissions } }, request,client);
      return { ok: true };
    }
    if (!['create','user'].includes(String(body.operation))) throw new GovernanceError('Operação inválida.');
    const roles = list(body.roles);
    const knownRoles = await client.query('select id from roles where id=any($1::text[])', [roles]);
    if (knownRoles.rowCount !== roles.length) throw new GovernanceError('Perfil desconhecido.');
    const fullName = text(body.fullName,160);
    if (fullName.length < 2 || typeof body.isActive !== 'boolean') throw new GovernanceError('Nome ou status inválido.');
    let id = text(body.id,36);
    let before: Record<string, unknown> = {};
    if (body.operation === 'create') {
      const email = text(body.email,254).toLowerCase();
      const password = typeof body.password === 'string' ? body.password : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12 || Buffer.byteLength(password) > 72) throw new GovernanceError('E-mail válido e senha de 12 a 72 bytes são obrigatórios.');
      const existing = await client.query('select id from app_users where email=$1', [email]);
      if (existing.rowCount) throw new GovernanceError('Este usuário já existe. Edite seu acesso.',409);
      if (!roles.length) throw new GovernanceError('Selecione ao menos um perfil para o usuário interno.');
      const created = await client.query(`insert into app_users (full_name,email,password_hash,role,is_active,email_verified_at,must_change_password)
        values($1,$2,crypt($3,gen_salt('bf',12)),'secretary',$4,now(),true) returning id`, [fullName,email,password,body.isActive]);
      id = created.rows[0].id;
    } else {
      if (!uuid.test(id)) throw new GovernanceError('Usuário inválido.');
      const found = await client.query(`select u.id,u.full_name,u.is_active,u.role,u.session_version,
        coalesce((select array_agg(role_id) from user_roles where user_id=u.id),'{}') roles
        from app_users u where u.id=$1 for update`, [id]);
      if (!found.rowCount) throw new GovernanceError('Usuário não encontrado.',404);
      before = found.rows[0];
      if (id === actor.id && (!body.isActive || !roles.includes('MASTER')) && actor.roles?.includes('MASTER')) {
        throw new GovernanceError('Não é permitido remover seu próprio acesso MASTER.',409);
      }
      if (id===actor.id) {
        const selfManagement=await client.query("select 1 from role_permissions where role_id=any($1::text[]) and permission_id='governance.manage'",[roles]);
        if(!body.isActive||!selfManagement.rowCount)throw new GovernanceError('Não é permitido remover seu próprio acesso de gestão.',409);
      }
      if ((before.roles as string[]).includes('MASTER') && (!body.isActive || !roles.includes('MASTER'))) {
        const other = await client.query(`select 1 from user_roles ur join app_users u on u.id=ur.user_id
          where ur.role_id='MASTER' and u.is_active and u.id<>$1`, [id]);
        if (!other.rowCount) throw new GovernanceError('É obrigatório manter um MASTER ativo.',409);
      }
      await client.query(`update app_users set full_name=$2,is_active=$3,updated_at=now(),
        session_version=session_version+1 where id=$1`, [id,fullName,body.isActive]);
    }
    await client.query('delete from user_roles where user_id=$1', [id]);
    await client.query('insert into user_roles select $1,unnest($2::text[])', [id,roles]);
    await audit({ actor: actor.id, action: `governance.user.${body.operation === 'create' ? 'create' : 'update'}`,
      entity:'app_users',id,before:accessSnapshot(before),after:{id,full_name:fullName,is_active:body.isActive,roles} }, request,client);
    return { ok:true,id };
  });
}
