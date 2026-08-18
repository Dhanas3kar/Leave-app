import { redirect } from 'next/navigation';
import { getCurrentUser } from '@leave-app/database/src/lib/session';
import { getEmployeePortalUrl } from '@leave-app/database/src/lib/config';

export default async function DashboardRedirect() {
  const session = await getCurrentUser();
  
  if (!session) {
    redirect('/login');
  }

  // Everyone (including employees) goes to the manager dashboard on this portal if they are a manager
  if (session.role === 'MANAGER') {
    redirect('/manager');
  } else {
    redirect(`${getEmployeePortalUrl()}/employee`);
  }
}
