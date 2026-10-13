import { notFound } from 'next/navigation';
import { requireInternalUser } from '@/lib/auth';
import { InternalShell } from '@/components/internal/internal-shell';
import { EditorialEditor } from '@/components/educativo/editorial-editor';
import { readEditorialPost } from '@/lib/educativo-editorial';
import { uuidPattern } from '@/lib/educativo-types';
import { getBlogCategories } from '@/data/blog-posts';
import { noIndexRobots } from '@/lib/seo';
export const metadata={title:'Editar conteúdo | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){await requireInternalUser('content.manage');const {id}=await params;if(!uuidPattern.test(id))notFound();const post=await readEditorialPost(id);return <InternalShell><EditorialEditor initial={post} categories={getBlogCategories()}/></InternalShell>;}
