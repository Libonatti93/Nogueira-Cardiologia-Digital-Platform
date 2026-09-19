import { authorize } from '@/lib/api-access';
import { changeAccess, GovernanceError, governanceOverview } from '@/lib/governance';

export async function GET(request: Request) {
  const access = await authorize(request,'governance.read');
  if (access.response) return access.response;
  const url = new URL(request.url);
  const offset = Math.floor(Math.max(0,Math.min(100000,Number(url.searchParams.get('offset')) || 0)));
  return Response.json(await governanceOverview(url.searchParams.get('q') ?? '',offset), { headers: { 'Cache-Control':'private, no-store' } });
}
export async function POST(request: Request) {
  const access = await authorize(request,'governance.manage');
  if (access.response) return access.response;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return Response.json({message:'Dados excedem o limite.'},{status:413});
    const body = JSON.parse(raw);
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new GovernanceError('Dados inválidos.');
    return Response.json(await changeAccess(access.user!,body,request));
  } catch (error) {
    if (error instanceof GovernanceError) return Response.json({message:error.message},{status:error.status});
    if (error instanceof SyntaxError) return Response.json({message:'JSON inválido.'},{status:400});
    console.error('governance_mutation_failed');
    return Response.json({message:'Não foi possível salvar a alteração.'},{status:500});
  }
}
