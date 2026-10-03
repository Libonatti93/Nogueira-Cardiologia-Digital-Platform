import { authorize } from '@/lib/api-access';
import { changeDrive, readDrive, driveErrorResponse } from '@/lib/drive';
import { DriveError } from '@/lib/drive-policy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
  const access=await authorize(request,'files.access'); if(access.response)return access.response;
  try {return Response.json(await readDrive(access.user!.id,new URL(request.url).searchParams),{headers:{'Cache-Control':'private, no-store'}});}
  catch(error){return driveErrorResponse(error);}
}
export async function POST(request:Request) {
  const access=await authorize(request,'files.access'); if(access.response)return access.response;
  try {
    const reader=request.body?.getReader();let text='';
    if(reader) {try {let length=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>24000)throw new DriveError('Dados excedem o limite.',413);text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel();}}
    const body=JSON.parse(text);
    if(!body||Array.isArray(body)||typeof body!=='object')throw new DriveError('Dados inválidos.');
    return Response.json(await changeDrive(access.user!,body,request),{headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return driveErrorResponse(error);}
}
