import { authorize } from '@/lib/api-access';
import { checkDriveUpload, finishDriveUpload, driveErrorResponse } from '@/lib/drive';
import { driveId, driveName } from '@/lib/drive-policy';
import { receiveDriveFile } from '@/lib/drive-storage';
export const runtime='nodejs';
export async function PUT(request:Request) {
  const access=await authorize(request,'files.access');if(access.response)return access.response;
  try {
    const params=new URL(request.url).searchParams;
    const name=driveName(params.get('name')), parent=driveId(params.get('folder'),true);
    await checkDriveUpload(access.user!,parent);
    const upload=await receiveDriveFile(request,name);
    return Response.json(await finishDriveUpload(access.user!,parent,name,upload,request),{status:201,headers:{'Cache-Control':'private, no-store'}});
  }catch(error){return driveErrorResponse(error);}
}
