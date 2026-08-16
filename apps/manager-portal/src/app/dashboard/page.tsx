import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function DashboardRedirect() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  if (session.role === 'MANAGER') {
    redirect('/manager');
  } else {
    redirect('http://localhost:3000/employee');
  }
}
