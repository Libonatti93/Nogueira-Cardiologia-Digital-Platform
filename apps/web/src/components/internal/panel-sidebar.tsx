'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { panelNavigation } from '@/lib/panel-policy';

export function PanelSidebar({name,roles,permissions,children}:{name:string;roles:string[];permissions:string[];children:React.ReactNode}) {
  const [collapsed,setCollapsed]=useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const pathname=usePathname();
  const items=panelNavigation.filter(item=>permissions.includes(item.permission)
    && (!item.href.startsWith('/crm')||permissions.includes('crm.access')));
  return <div data-panel className="min-h-screen bg-[#F3F6FA] text-slate-900">
    <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
      <span className="font-bold text-[#103E6A]">Nogueira · Equipe</span><button aria-label="Abrir navegação" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(!mobileOpen)}>☰</button>
    </div>
    {mobileOpen&&<button aria-label="Fechar navegação" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all ${collapsed?'lg:w-20':'lg:w-64'} w-64 ${mobileOpen?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
      <div className="flex h-24 items-center justify-between gap-2 border-b border-slate-100 px-4">
        {!collapsed&&<Image src="/uploads-imagens-nogueira/nogueira-cardio4-transparent.png" alt="Nogueira Cardiologia" width={192} height={48} className="h-auto w-44" priority/>}
        <button onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed?'Expandir menu':'Recolher menu'} aria-expanded={!collapsed} className="hidden rounded-lg bg-slate-50 p-2 text-[#14508B] lg:block">{collapsed?'»':'«'}</button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {!collapsed&&<p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Workspace da equipe</p>}
        <nav aria-label="Navegação do painel" className="space-y-1">{items.map(item=>{
          const active=pathname===item.href;
          return <Link key={item.label} title={item.label} href={item.href} onClick={()=>setMobileOpen(false)} aria-current={active?'page':undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active?'bg-[#103E6A] text-white shadow-sm':'text-slate-600 hover:bg-blue-50 hover:text-[#14508B]'}`}>
            <span aria-hidden className="w-5 text-center text-lg">{item.icon}</span>{!collapsed&&item.label}</Link>;
        })}</nav>
      </div>
      <div className="border-t border-slate-100 p-4">
        {!collapsed&&<><p className="truncate text-sm font-bold">{name}</p><p className="mt-1 truncate text-xs text-slate-500">{roles.join(' · ')}</p><Link href="/alterar-senha" className="mt-3 block text-xs text-[#14508B]">Alterar minha senha</Link></>}
        <form action="/api/auth/logout" method="post"><button className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold">Sair</button></form>
      </div>
    </aside>
    <div className={`transition-all ${collapsed?'lg:pl-20':'lg:pl-64'}`}>
      <header className="hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
        <p className="text-sm text-slate-500">Nogueira Cardiologia <span className="mx-3 text-slate-300">/</span><span className="font-semibold text-[#103E6A]">Painel da equipe</span></p>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Ambiente de produção</span>
      </header>
      <main className="mx-auto w-full max-w-[1600px] min-w-0 px-4 py-7 sm:px-6 lg:px-8">{children}</main>
    </div>
  </div>;
}
