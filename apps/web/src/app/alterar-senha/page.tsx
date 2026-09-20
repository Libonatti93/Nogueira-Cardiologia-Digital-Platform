import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChangePasswordForm } from '@/components/internal/change-password-form';
import { noIndexRobots } from '@/lib/seo';
export const metadata={title:'Alterar senha interna | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function ChangePasswordPage(){
  const user=await getSessionUser();if(!user||user.audience!=='internal'||!user.permissions?.includes('panel.access'))redirect('/acesso');
  return <main data-panel className="flex min-h-screen items-center justify-center bg-[#F3F6FA] p-6"><section className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-[#15A7DD]">Nogueira · Segurança de acesso</p><h1 className="mt-4 text-2xl font-bold text-[#103E6A]">{user.mustChangePassword?'Defina sua senha pessoal':'Alterar minha senha'}</h1><p className="mt-3 text-sm leading-6 text-slate-500">Use pelo menos 12 caracteres. Sua senha é pessoal e não deve ser compartilhada. {user.mustChangePassword?'A troca é obrigatória antes de acessar os módulos.':''}</p><ChangePasswordForm/><form action="/api/auth/logout" method="post"><button className="mt-6 text-sm text-slate-500">Sair da conta</button></form></section></main>;
}
