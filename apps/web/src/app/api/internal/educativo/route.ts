import { authorize } from '@/lib/api-access';
import { createEditorialPost, listEditorialPosts } from '@/lib/educativo-editorial';
import { editorialErrorResponse } from '@/lib/educativo-policy';
export async function GET(request:Request) {
  const access=await authorize(request,'content.manage');if(access.response)return access.response;
  try{return Response.json({posts:await listEditorialPosts()},{headers:{'Cache-Control':'private, no-store'}});}catch(error){return editorialErrorResponse(error);}
}
export async function POST(request:Request) {
  const access=await authorize(request,'content.manage');if(access.response)return access.response;
  try{return Response.json(await createEditorialPost(access.user!,request),{status:201,headers:{'Cache-Control':'private, no-store'}});}catch(error){return editorialErrorResponse(error);}
}
