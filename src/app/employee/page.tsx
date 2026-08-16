import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LeaveRequestForm from '@/components/LeaveRequestForm';
import LogoutButton from '@/components/LogoutButton';
import { cancelLeaveRequest } from '@/app/actions/leave';

export default async function EmployeeDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'EMPLOYEE') {
    redirect('/login');
  }

  const balance = await prisma.leaveBalance.findUnique({
    where: { userId: session.id }
  });

  const requests = await prisma.leaveRequest.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container">
      <nav className="top-nav">
        <div className="nav-brand">LeaveSync</div>
        <div className="nav-actions">
          <span>Welcome, {session.name}</span>
          <LogoutButton />
        </div>
      </nav>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 2fr' }}>
        <div>
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Leave Balance</h3>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>
              {balance ? balance.totalDays - balance.usedDays : 0}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>Days Available</div>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              ({balance?.usedDays || 0} used out of {balance?.totalDays || 0})
            </div>
          </div>

          <LeaveRequestForm />
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Your Requests</h3>
          {requests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No leave requests found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requests.map((req: any) => (
                <div key={req.id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: `4px solid ${req.status === 'APPROVED' ? 'var(--success)' : req.status === 'REJECTED' ? 'var(--danger)' : req.status === 'CANCELLED' ? '#888' : 'var(--warning)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <div>
                      <strong style={{ marginRight: '0.5rem' }}>{req.type} LEAVE:</strong>
                      <strong>{req.startDate.toLocaleDateString()} to {req.endDate.toLocaleDateString()}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>{req.status}</span>
                      {req.status === 'PENDING' && (
                        <form action={async () => {
                          "use server";
                          await cancelLeaveRequest(req.id);
                        }}>
                          <button type="submit" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{req.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
