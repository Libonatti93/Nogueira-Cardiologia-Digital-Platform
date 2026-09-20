import { requireInternalUser } from '@/lib/auth';
import { InternalShell } from '@/components/internal/internal-shell';
import { CrmConsole } from '@/components/internal/crm-console';
import { noIndexRobots } from '@/lib/seo';
export const metadata={title:'CRM | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function CrmPage({searchParams}:{searchParams:Promise<{view?:string}>}){
  const user=await requireInternalUser('crm.access');
  const initialView=(await searchParams).view??'summary';
  return <InternalShell><CrmConsole key={initialView} permissions={user.permissions??[]} initialView={initialView}/></InternalShell>;
}
