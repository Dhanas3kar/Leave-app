import { redirect } from 'next/navigation';
import { getCurrentUser } from '@leave-app/database/src/lib/session';

export default async function DashboardRedirect() {
  const session = await getCurrentUser();
  
  if (!session) {
    redirect('/login');
  }

  // Everyone (including employees) goes to the manager dashboard on this portal if they are a manager
  if (session.role === 'MANAGER') {
    redirect('/manager');
  } else {
    redirect('http://localhost:3000/employee');
  }
}
