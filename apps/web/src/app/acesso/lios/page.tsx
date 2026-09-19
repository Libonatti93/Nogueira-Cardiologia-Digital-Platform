import { InternalShell } from '@/components/internal/internal-shell';
import { LiosConsole } from '@/components/internal/lios-console';
import { requireInternalUser } from '@/lib/auth';
import { noIndexRobots } from '@/lib/seo';

export const metadata = { title: 'LIOS | Nogueira Cardiologia', robots: noIndexRobots };
export const dynamic = 'force-dynamic';

export default async function LiosPage() {
  const user = await requireInternalUser('lios.read');
  return <InternalShell><LiosConsole canManage={user.permissions?.includes('lios.manage') ?? false}
    canPublish={user.permissions?.includes('lios.publish') ?? false} /></InternalShell>;
}
