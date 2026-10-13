import { authorize } from '@/lib/api-access';
import { uploadEducationalFile } from '@/lib/educativo-upload';
import { editorialErrorResponse } from '@/lib/educativo-policy';
export const runtime='nodejs';
export async function PUT(request:Request,context:{params:Promise<{id:string}>}) {
  const access=await authorize(request,'content.manage');if(access.response)return access.response;
  try{return Response.json(await uploadEducationalFile(access.user!,(await context.params).id,request),{status:201,headers:{'Cache-Control':'private, no-store'}});}catch(error){return editorialErrorResponse(error);}
}
