import { authorize } from '@/lib/api-access';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  const access = await authorize(request,'audit.read');
  if (access.response) return access.response;
  const params = new URL(request.url).searchParams;
  const action = (params.get('action') ?? '').slice(0,100);
  const actor = params.get('actor') ?? '';
  if (actor && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(actor)) return Response.json({message:'Usuário inválido.'},{status:400});
  const offset = Math.floor(Math.max(0,Math.min(100000,Number(params.get('offset')) || 0)));
  const result = await query(`select a.id,a.created_at,a.actor_user_id,u.full_name actor,a.action,a.entity_type,a.entity_id,
    a.entity_key,a.result,a.ip_address,a.before_data,a.after_data,
    jsonb_build_object('permission',a.metadata->'permission','provider',a.metadata->'provider','code',a.metadata->'code') metadata
    from audit_logs a left join app_users u on u.id=a.actor_user_id
    where a.action ilike $1 and ($2='' or a.actor_user_id::text=$2)
    order by a.created_at desc,a.id limit 100 offset $3`, [`%${action}%`,actor,offset]);
  return Response.json({events:result.rows},{headers:{'Cache-Control':'private, no-store'}});
}
