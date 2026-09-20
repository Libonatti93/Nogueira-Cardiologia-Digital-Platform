import Image from 'next/image';
import { redirect } from 'next/navigation';
import { InternalLogin } from '@/components/internal/internal-login';
import { getSessionUser } from '@/lib/auth';
import { panelLanding } from '@/lib/panel-policy';
import { noIndexRobots } from '@/lib/seo';

export const metadata={title:'Painel da equipe | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function InternalPage() {
  const user=await getSessionUser();
  if(user?.audience==='internal'&&user.permissions?.includes('panel.access'))redirect(panelLanding(user));
  return <main data-panel className="grid min-h-screen bg-[#F3F6FA] lg:grid-cols-2">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-[#103E6A] p-14 text-white lg:flex">
      <p className="text-sm font-semibold tracking-widest text-sky-200">NOGUEIRA CARDIOLOGIA</p>
      <div className="relative z-10 max-w-lg"><div className="mb-8 h-1 w-16 bg-[#15A7DD]"/><h1 className="text-5xl font-semibold leading-tight">Cuidado conectado.<br/>Equipe integrada.</h1><p className="mt-6 text-lg leading-8 text-blue-100">Um único espaço para organizar o atendimento, acompanhar a operação e cuidar de cada etapa da jornada.</p></div>
      <p className="text-xs text-blue-200">Ambiente exclusivo para profissionais e colaboradores autorizados.</p>
      <div aria-hidden className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full border-[70px] border-white/5"/>
    </section>
    <section className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-md">
      <Image src="/uploads-imagens-nogueira/nogueira-cardio4-transparent.png" alt="Nogueira Cardiologia" width={320} height={80} className="mb-12 h-auto w-64" priority/>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#15A7DD]">Painel da equipe</p>
      <h2 className="mt-3 text-3xl font-bold text-[#103E6A]">Bem-vindo ao seu workspace</h2>
      <p className="mb-8 mt-3 text-sm leading-6 text-slate-500">Entre com sua credencial interna. Seus acessos são definidos pelo perfil atribuído à sua conta.</p>
      <InternalLogin/>
      <p className="mt-6 text-xs leading-6 text-slate-500">Primeiro acesso ou senha esquecida? Solicite a ativação ou redefinição a um administrador MASTER.</p>
      <a className="mt-8 block text-sm font-semibold text-[#14508B]" href="https://www.nogueiracardiologia.com.br">Ir para o site público ↗</a>
    </div></section>
  </main>;
}
