'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { resetTurnstile, TurnstileWidget } from '@/components/security/turnstile-widget';

export function LeadGate({ postSlug, unlocked, protectedContent=false }: { postSlug:string; unlocked:boolean; protectedContent?:boolean }) {
  const router=useRouter();
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  useEffect(()=>{
    // Only an HttpOnly server session can authorize access. Old localStorage is never trusted.
    try{localStorage.removeItem('nogueira_educativo_access');}catch{}
    if(unlocked)void fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postSlug})}).catch(()=>{});
  },[unlocked,postSlug]);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('');
    const form=new FormData(event.currentTarget);
    try {
      const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(form),postSlug})});
      const result=await response.json();if(!response.ok)throw new Error(result.message);
      router.refresh();
    }catch(e){resetTurnstile();setError(e instanceof Error?e.message:'Não foi possível liberar o acesso.');}finally{setBusy(false);}
  }
  if(unlocked)return <p className="mt-8 rounded-2xl bg-blue-50 p-4 text-sm text-[#103E6A]">Seu acesso à área educativa está liberado neste navegador.</p>;
  return <section className="mt-8 rounded-3xl border border-blue-100 bg-[#F4F9FF] p-5 sm:p-8" aria-label="Inscrição na área educativa">
    <p className="text-xs font-bold uppercase tracking-widest text-[#14508B]">Área educativa Nogueira Cardiologia</p>
    <h2 className="mt-3 text-2xl font-semibold text-[#103E6A]">{protectedContent?'Continue lendo / Acesse a aula do Prof. Dr. Paulo':'Receba nossos conteúdos educativos'}</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600">{protectedContent?'Inscreva-se uma vez para acessar o conteúdo completo e os materiais do professor.':'Este artigo é aberto. Inscreva-se para acompanhar as orientações e acessar também as aulas e materiais.'}</p>
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <label className="grid gap-1 text-sm font-semibold">Nome completo<input name="fullName" autoComplete="name" minLength={3} maxLength={180} required className="edu-input"/></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">E-mail<input name="email" type="email" autoComplete="email" maxLength={254} required className="edu-input"/></label>
        <label className="grid gap-1 text-sm font-semibold">Telefone / WhatsApp<input name="phoneWhatsapp" type="tel" autoComplete="tel" minLength={10} maxLength={30} required className="edu-input" placeholder="(17) 99999-9999"/></label>
      </div>
      <p className="text-xs leading-5 text-slate-500">Ao se inscrever, você autoriza o contato da Nogueira Cardiologia por e-mail ou WhatsApp com conteúdos educativos e informações da clínica. <a className="underline" href="/privacidade">Política de privacidade</a>.</p>
      {protectedContent&&<p className="text-xs leading-5 text-slate-500">As aulas são exclusivas do Prof. Dr. Paulo Roberto Nogueira. O acesso é pessoal, para visualização neste site; as páginas exibem uma identificação do seu acesso. Não compartilhe nem redistribua os materiais.</p>}
      <TurnstileWidget action="educativo-lead"/>
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="edu-primary w-fit">{busy?'Liberando acesso…':protectedContent?'Quero acessar o conteúdo':'Quero receber conteúdos educativos'}</button>
    </form>
  </section>;
}
