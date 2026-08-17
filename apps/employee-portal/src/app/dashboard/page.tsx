import { redirect } from 'next/navigation';
import { getCurrentUser } from '@leave-app/database/src/lib/session';

export default async function DashboardRedirect() {
  const session = await getCurrentUser();
  
  if (!session) {
    redirect('/login');
  }

  // Everyone (including managers) goes to the employee dashboard on this portal
  redirect('/employee');
}
