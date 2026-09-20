'use client';
import { useState } from 'react';
export function ChangePasswordForm(){
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  return <form className="mt-6 grid gap-5" onSubmit={async event=>{event.preventDefault();const f=new FormData(event.currentTarget);if(f.get('password')!==f.get('confirmation')){setMessage('As novas senhas não coincidem.');return;}setBusy(true);setMessage('');try{const response=await fetch('/api/auth/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:f.get('currentPassword'),password:f.get('password')})});const body=await response.json();if(!response.ok)throw new Error(body.message);window.location.href=body.redirectTo;}catch(error){setMessage(error instanceof Error?error.message:'Falha ao alterar senha.');}finally{setBusy(false);}}}>
    <label className="text-sm font-semibold">Senha atual ou temporária<input name="currentPassword" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border p-3"/></label>
    <label className="text-sm font-semibold">Nova senha<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={72} required className="mt-2 w-full rounded-xl border p-3"/></label>
    <label className="text-sm font-semibold">Confirmar nova senha<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={72} required className="mt-2 w-full rounded-xl border p-3"/></label>
    {message&&<p role="alert" className="text-sm text-red-700">{message}</p>}
    <button disabled={busy} className="rounded-xl bg-[#14508B] p-3 font-semibold text-white disabled:opacity-50">{busy?'Salvando...':'Salvar nova senha'}</button>
  </form>;
}
