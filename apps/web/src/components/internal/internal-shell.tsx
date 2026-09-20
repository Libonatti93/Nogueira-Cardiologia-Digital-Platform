import { getSessionUser } from '@/lib/auth';
import { PanelSidebar } from '@/components/internal/panel-sidebar';

export async function InternalShell({children}:{children:React.ReactNode}) {
  const user=await getSessionUser();
  return <PanelSidebar name={user?.fullName??'Equipe'} roles={user?.roles??[]} permissions={user?.permissions??[]}>{children}</PanelSidebar>;
}
