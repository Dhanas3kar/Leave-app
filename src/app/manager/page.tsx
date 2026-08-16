import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import ManagerActions from '@/components/ManagerActions';
import { getLeaveStats } from '@/app/actions/leave';

export default async function ManagerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'MANAGER') {
    redirect('/login');
  }

  const stats = await getLeaveStats();

  // In a real app, we'd filter by requests belonging to employees managed by this manager.
  // For the prototype, we can fetch all pending requests.
  const pendingRequests = await prisma.leaveRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container">
      <nav className="top-nav">
        <div className="nav-brand">LeaveSync Manager</div>
        <div className="nav-actions">
          <span>Welcome, {session.name}</span>
          <LogoutButton />
        </div>
      </nav>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Pending</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.pending}</div>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Approved</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.approved}</div>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Rejected</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--danger)' }}>{stats.rejected}</div>
          </div>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)' }}>Cancelled</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#888' }}>{stats.cancelled}</div>
          </div>
        </div>
      )}

      <div className="glass-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Pending Requests</h3>
        
        {pendingRequests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>All caught up! No pending requests.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {pendingRequests.map((req: any) => (
              <div key={req.id} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{req.user.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.user.email}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', height: 'fit-content' }}>{req.type}</span>
                </div>
                
                <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.9rem' }}>{req.startDate.toLocaleDateString()} to {req.endDate.toLocaleDateString()}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
                    {Math.ceil((req.endDate.getTime() - req.startDate.getTime()) / (1000 * 3600 * 24)) + 1} days
                  </div>
                </div>

                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  "{req.reason}"
                </div>

                <ManagerActions requestId={req.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
