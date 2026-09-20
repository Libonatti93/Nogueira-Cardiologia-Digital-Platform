import Link from 'next/link';
import { query } from '@/lib/db';
export async function MasterStatus({canLios,canAudit}:{canLios:boolean;canAudit:boolean}){
  const [access,lios]=await Promise.all([
    query(`select count(*) filter(where u.is_active)::int active,
      count(*) filter(where u.is_active and u.password_hash is null)::int pending,
      count(*) filter(where u.last_login_at>=now()-interval '24 hours')::int recent
      from app_users u where exists(select 1 from user_roles ur where ur.user_id=u.id)`),
    canLios?query(`select count(*) filter(where status in ('queued','running'))::int active,count(*) filter(where status='review_required')::int review from lios.pipeline_runs`):Promise.resolve({rows:[]}),
  ]);
  const a=access.rows[0],l=lios.rows[0];
  return <section className="mb-6 grid gap-4 md:grid-cols-4"><Link href="/governanca" className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">Equipe interna ativa</p><p className="mt-2 text-2xl font-bold text-[#103E6A]">{a.active}</p></Link><Link href="/governanca" className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs text-amber-800">Credenciais aguardando ativação</p><p className="mt-2 text-2xl font-bold text-amber-900">{a.pending}</p></Link><Link href={canAudit?"/auditoria":"/governanca"} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">Usuários com acesso nas últimas 24h</p><p className="mt-2 text-2xl font-bold text-[#103E6A]">{a.recent}</p></Link>{canLios&&l&&<Link href="/lios" className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">LIOS · execução / revisão pendente</p><p className="mt-2 text-2xl font-bold text-[#103E6A]">{l.active} / {l.review}</p></Link>}</section>;
}
