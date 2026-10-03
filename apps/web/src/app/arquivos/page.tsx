import { requireInternalUser } from '@/lib/auth';
import { InternalShell } from '@/components/internal/internal-shell';
import { FilesConsole } from '@/components/internal/files-console';
import { noIndexRobots } from '@/lib/seo';
export const metadata={title:'Meus Arquivos | Nogueira Cardiologia',robots:noIndexRobots};
export const dynamic='force-dynamic';
export default async function FilesPage(){
  await requireInternalUser('files.access');
  return <InternalShell><FilesConsole/></InternalShell>;
}
