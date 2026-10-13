import { requireInternalUser } from '@/lib/auth';
import { InternalShell } from '@/components/internal/internal-shell';
import { EditorialList } from '@/components/educativo/editorial-list';
import { listEditorialPosts } from '@/lib/educativo-editorial';
import { noIndexRobots } from '@/lib/seo';
export const metadata={title:'Central de publicação | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function Page(){await requireInternalUser('content.manage');return <InternalShell><EditorialList posts={await listEditorialPosts()}/></InternalShell>;}
