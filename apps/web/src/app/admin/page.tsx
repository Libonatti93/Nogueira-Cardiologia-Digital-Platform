import {requireInternalUser} from '@/lib/auth';
import {redirect} from 'next/navigation';
export default async function Admin(){await requireInternalUser('governance.manage');redirect('/governanca');}
