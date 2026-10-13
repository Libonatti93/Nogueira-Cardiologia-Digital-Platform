import Link from 'next/link';
import { getDoctorBySlug } from '@/data/doctors';
export function Professor({slug}:{slug?:string|null}) {
  const doctor=slug?getDoctorBySlug(slug):null;if(!doctor)return null;
  return <aside className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
    <p className="font-semibold text-[#103E6A]">{doctor.name}</p>
    <p className="mt-1 text-sm text-slate-600">{doctor.crm} · {doctor.specialties[0]}</p>
    {doctor.credentials.filter(c=>c.startsWith('Professor')||c.startsWith('Doutorado')).map(c=><p key={c} className="mt-2 text-sm text-slate-600">{c}</p>)}
    <Link href={`/medicos/${doctor.slug}`} className="mt-3 inline-block text-sm font-bold text-[#14508B] underline">Ver currículo</Link>
  </aside>;
}
