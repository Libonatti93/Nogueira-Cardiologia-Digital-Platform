import Link from 'next/link';
import { requireInternalUser } from '@/lib/auth';
import { readEditorialPost } from '@/lib/educativo-editorial';
import { ArticleBody } from '@/components/educativo/article-body';
import { Materials } from '@/components/educativo/materials';
import { Professor } from '@/components/educativo/professor';
import { contentLabels } from '@/lib/educativo-types';
import { noIndexRobots } from '@/lib/seo';
export const metadata={title:'Pré-visualização privada | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}) {
  await requireInternalUser('content.manage');const post=await readEditorialPost((await params).id);
  const materials=post.materials.filter(m=>m.purpose==='MATERIAL');
  return <main className="min-h-screen bg-[#F8F8F9] px-4 py-8"><div className={`mx-auto ${materials.length?'max-w-6xl':'max-w-4xl'}`}><div className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-[#103E6A]">Pré-visualização privada · {post.requires_registration?'Conteúdo completo para inscritos':'Artigo aberto'} · <Link href={`/educativo/${post.id}`} className="font-semibold underline">Voltar ao editor</Link></div><article className="rounded-3xl border border-blue-100 bg-white p-4 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-[#15A7DD]">{contentLabels[post.content_type]} · {post.category}</p><h1 className="mt-3 text-3xl font-semibold leading-tight text-[#103E6A] sm:text-4xl">{post.title}</h1><p className="mt-4 leading-7 text-slate-600">{post.excerpt}</p><p className="mt-5 text-sm text-slate-500">Por {post.author_profile_slug?'Dr. Paulo Roberto Nogueira':'Nogueira Cardiologia'}</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {!materials.length&&<img src={post.cover_image_url} alt={post.cover_alt} className="mt-7 max-h-[360px] w-full rounded-2xl object-cover"/>}{!materials.length&&post.cover_caption&&<p className="mt-2 text-sm text-slate-500">{post.cover_caption}</p>}
    <Materials materials={materials}/><ArticleBody html={post.content_html}/><Professor slug={post.author_profile_slug}/></article></div></main>;
}
