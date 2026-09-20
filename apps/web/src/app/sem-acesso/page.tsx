import { getSessionUser } from '@/lib/auth';
import { panelLanding } from '@/lib/panel-policy';
import { noIndexRobots } from '@/lib/seo';
import Link from 'next/link';
export const metadata={title:'Acesso restrito | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function Denied(){const user=await getSessionUser();const target=user?.audience==='internal'?panelLanding(user):'/acesso';return <main data-panel className="flex min-h-screen items-center justify-center bg-slate-50 p-8"><section className="max-w-md rounded-2xl border bg-white p-8"><p className="text-sm font-semibold text-slate-500">Acesso restrito</p><h1 className="mt-3 text-2xl font-bold text-[#103E6A]">Seu perfil não possui esta permissão.</h1><p className="mt-4 text-sm text-slate-500">Se precisar desse módulo para trabalhar, solicite acesso a um administrador MASTER.</p><Link href={target==='/sem-acesso'?'/acesso':target} className="mt-6 block font-semibold text-[#14508B]">Voltar ao painel</Link><form action="/api/auth/logout" method="post"><button className="mt-5 text-sm text-slate-500">Sair da conta</button></form></section></main>;}
