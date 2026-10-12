import { authorize } from '@/lib/api-access';
import { changeCrm, crmOverview, crmReadPermissions, crmWritePermissions, CrmError } from '@/lib/crm';
import { changeWorkspace, readWorkspace, workspaceReads, workspaceWrites } from '@/lib/crm-workspace';

export async function GET(request:Request){
  const params=new URL(request.url).searchParams,view=params.get('view')||'summary';
  const access=await authorize(request,workspaceReads[view]||crmReadPermissions[view]||'crm.access');if(access.response)return access.response;
  try{return Response.json(workspaceReads[view]?await readWorkspace(access.user!,view,params):await crmOverview(access.user!,view,params.get('q')||'',Math.floor(Math.max(0,Math.min(100000,Number(params.get('offset'))||0))),params.get('id')||''),{headers:{'Cache-Control':'private, no-store'}});}
  catch(error){if(error instanceof CrmError)return Response.json({message:error.message},{status:error.status});console.error('crm_read_failed');return Response.json({message:'Não foi possível consultar o CRM.'},{status:500});}
}
export async function POST(request:Request){
  const access=await authorize(request,'crm.access');if(access.response)return access.response;
  try{
    const raw=await request.text();if(raw.length>12000)return Response.json({message:'Dados excedem o limite.'},{status:413});
    const body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object')throw new CrmError('Dados inválidos.');
    const permission=workspaceWrites[body.operation]||crmWritePermissions[body.operation];if(!permission)throw new CrmError('Operação inválida.');
    const write=await authorize(request,permission);if(write.response)return write.response;
    return Response.json(workspaceWrites[body.operation]?await changeWorkspace(write.user!,body,request):await changeCrm(write.user!,body,request));
  }catch(error){if(error instanceof CrmError)return Response.json({message:error.message},{status:error.status});if(error instanceof SyntaxError)return Response.json({message:'JSON inválido.'},{status:400});
    const code=(error as {code?:string}).code;
    if(code==='23P01'||code==='23505')return Response.json({message:code==='23P01'?'Este horário já está ocupado para o profissional.':'Já existe um registro com estes dados.'},{status:409});
    if(code==='23514')return Response.json({message:error instanceof Error?error.message:'Dados não atendem às regras operacionais.'},{status:400});
    console.error('crm_mutation_failed',code);return Response.json({message:'Não foi possível salvar a alteração.'},{status:500});}
}
