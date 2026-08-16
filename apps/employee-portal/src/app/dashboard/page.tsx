import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function DashboardRedirect() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Everyone (including managers) goes to the employee dashboard on this portal
  redirect('/employee');
}
