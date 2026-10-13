import { revalidatePath } from 'next/cache';
import { authorize } from '@/lib/api-access';
import { readEditorialPost, saveEditorialPost } from '@/lib/educativo-editorial';
import { readLimitedJson, editorialErrorResponse } from '@/lib/educativo-policy';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context) {
  const access=await authorize(request,'content.manage');if(access.response)return access.response;
  try{return Response.json(await readEditorialPost((await context.params).id),{headers:{'Cache-Control':'private, no-store'}});}catch(error){return editorialErrorResponse(error);}
}
export async function PUT(request:Request,context:Context) {
  const access=await authorize(request,'content.manage');if(access.response)return access.response;
  try{
    const result=await saveEditorialPost(access.user!,(await context.params).id,await readLimitedJson(request),request);
    revalidatePath('/blog');revalidatePath(`/blog/${result.slug}`);revalidatePath('/sitemap.xml');
    return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return editorialErrorResponse(error);}
}
