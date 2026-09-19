import { InternalShell } from '@/components/internal/internal-shell';
import { GovernanceConsole } from '@/components/internal/governance-console';
import { requireInternalUser } from '@/lib/auth';
import { noIndexRobots } from '@/lib/seo';

export const metadata = { title:'Governança | Nogueira Cardiologia', robots:noIndexRobots };
export const dynamic = 'force-dynamic';
export default async function GovernancePage() {
  const user = await requireInternalUser('governance.read');
  return <InternalShell><GovernanceConsole canManage={user.permissions?.includes('governance.manage') ?? false}
    canAudit={user.permissions?.includes('audit.read') ?? false} /></InternalShell>;
}
