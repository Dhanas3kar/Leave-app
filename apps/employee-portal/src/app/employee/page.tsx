import { requireAuthenticatedUser } from '@leave-app/database/src/lib/authorization';
import { prisma } from '@/lib/prisma';
import LeaveRequestForm from '@/components/LeaveRequestForm';
import LogoutButton from '@/components/LogoutButton';
import { getManagerPortalUrl } from '@leave-app/database/src/lib/config';
import LeaveHistory from '@/components/LeaveHistory';

export default async function EmployeeDashboard() {
  const session = await requireAuthenticatedUser();

  const balance = await prisma.leaveBalance.findUnique({
    where: { userId: session.id }
  });

  const requests = await prisma.leaveRequest.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' }
  });

  const totalDays = balance?.totalDays || 0;
  const usedDays = balance?.usedDays || 0;
  const availableDays = Math.max(0, totalDays - usedDays);

  return (
    <div className="container">
      <nav className="top-nav">
        <div className="nav-brand">LeaveSync</div>
        <div className="nav-actions">
          {session.role === 'MANAGER' && (
            <a 
              href={`${getManagerPortalUrl()}/manager`} 
              style={{ background: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '4px', textDecoration: 'none', color: 'white', fontSize: '0.9rem' }}
            >
              Manager Portal
            </a>
          )}
          <span>Welcome, {session.name}</span>
          <LogoutButton />
        </div>
      </nav>

      <div className="dashboard-grid">
        <div className="dashboard-sidebar">
          <div className="glass-panel text-center">
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Leave Balance</h3>
            
            <div className="balance-metrics">
              <div className="metric primary-metric">
                <div className="metric-value">{availableDays}</div>
                <div className="metric-label">Available Days</div>
              </div>
              
              <div className="secondary-metrics">
                <div className="metric">
                  <div className="metric-value small">{usedDays}</div>
                  <div className="metric-label">Used</div>
                </div>
                <div className="metric">
                  <div className="metric-value small">{totalDays}</div>
                  <div className="metric-label">Total</div>
                </div>
              </div>
            </div>
          </div>

          <LeaveRequestForm />
        </div>

        <div className="dashboard-main">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>Your Requests</h3>
            <LeaveHistory requests={requests} />
          </div>
        </div>
      </div>
    </div>
  );
}

