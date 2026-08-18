import { requireManager, AuthorizationError } from '@leave-app/database/src/lib/authorization';
import { prisma } from '@/lib/prisma';
import LogoutButton from '@/components/LogoutButton';
import ManagerActions from '@/components/ManagerActions';
import { getLeaveStats } from '@leave-app/database/src/actions/leave';
import { getEmployeePortalUrl } from '@leave-app/database/src/lib/config';
import { redirect } from 'next/navigation';
import type { SessionPayload } from '@leave-app/database/src/lib/session-crypto';
import { calculateLeaveDays } from '@leave-app/database/src/lib/dates';

export default async function ManagerDashboard() {
  let session: SessionPayload;
  try {
    session = await requireManager();
  } catch (error: any) {
    console.error("Manager page caught error:", error.name, error.message, error);
    if (error instanceof AuthorizationError || error.name === 'AuthorizationError') {
      redirect(`${getEmployeePortalUrl()}/employee`);
    } else if (error.name === 'AuthenticationError') {
      redirect(`${getEmployeePortalUrl()}/login`);
    }
    throw error;
  }

  const stats = await getLeaveStats();

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
          <a 
            href={`${getEmployeePortalUrl()}/employee`} 
            style={{ background: 'transparent', border: '1px solid var(--primary)', padding: '0.4rem 1rem', borderRadius: '4px', textDecoration: 'none', color: 'var(--primary)', fontSize: '0.9rem' }}
          >
            Employee Portal
          </a>
          <span>Welcome, {session.name}</span>
          <LogoutButton />
        </div>
      </nav>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
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
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>All caught up!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No pending requests require your attention.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {pendingRequests.map((req) => {
              const days = calculateLeaveDays(req.startDate, req.endDate);
              return (
                <div key={req.id} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ wordBreak: 'break-word', paddingRight: '1rem' }}>
                      <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{req.user.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.user.email}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', height: 'fit-content', whiteSpace: 'nowrap' }}>
                      {req.type}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      {req.startDate.toLocaleDateString()} &rarr; {req.endDate.toLocaleDateString()}
                    </div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {days} day{days !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    &quot;{req.reason}&quot;
                  </div>

                  <ManagerActions requestId={req.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
