import {requireInternalUser} from '@/lib/auth';
import {InternalShell} from '@/components/internal/internal-shell';
import {GovernanceConsole} from '@/components/internal/governance-console';
import {noIndexRobots} from '@/lib/seo';
export const metadata={title:'Auditoria | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function Audit(){await requireInternalUser('audit.read');return <InternalShell><GovernanceConsole canManage={false} canAudit auditOnly/></InternalShell>;}
