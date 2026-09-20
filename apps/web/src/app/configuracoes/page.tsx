import { requireInternalUser } from '@/lib/auth';
import { InternalShell } from '@/components/internal/internal-shell';
import { noIndexRobots } from '@/lib/seo';
import Link from 'next/link';
export const metadata={title:'Configurações | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function Settings(){await requireInternalUser('governance.manage');return <InternalShell><h1 className="text-3xl font-bold text-[#103E6A]">Configurações do ambiente</h1><p className="mt-3 text-slate-500">Acesso e operação da plataforma.</p><div className="mt-6 grid gap-5 md:grid-cols-2"><section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">Identidade e acessos</h2><p className="my-3 text-sm text-slate-500">Gerencie colaboradores, perfis, sessões e credenciais internas pelo IAM.</p><Link className="font-semibold text-[#14508B]" href="/governanca">Abrir Governança & IAM →</Link></section><section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">Credencial pessoal</h2><p className="my-3 text-sm text-slate-500">Troque sua senha pessoal sem alterar suas permissões.</p><Link className="font-semibold text-[#14508B]" href="/alterar-senha">Alterar minha senha →</Link></section></div></InternalShell>;}
