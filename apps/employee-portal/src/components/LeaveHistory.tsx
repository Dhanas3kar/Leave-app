"use client";

import { cancelLeaveRequest } from '@leave-app/database/src/actions/leave';
import CancelLeaveButton from './CancelLeaveButton';
import { calculateLeaveDays } from '@leave-app/database/src/lib/dates';

type LeaveRequest = {
  id: string;
  startDate: Date;
  endDate: Date;
  type: string;
  reason: string;
  status: string;
  createdAt: Date;
};

function getStatusColor(status: string) {
  switch (status) {
    case 'APPROVED': return 'var(--success)';
    case 'REJECTED': return 'var(--danger)';
    case 'CANCELLED': return '#888';
    case 'PENDING': return 'var(--warning)';
    default: return 'var(--text-muted)';
  }
}

export default function LeaveHistory({ requests }: { requests: LeaveRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="empty-state">
        <p>You haven&apos;t submitted any leave requests yet.</p>
      </div>
    );
  }

  return (
    <div className="leave-history-list">
      {requests.map((req) => {
        const duration = calculateLeaveDays(req.startDate, req.endDate);
        const statusColor = getStatusColor(req.status);
        
        // Use bind to pass the ID to the server action
        const cancelAction = cancelLeaveRequest.bind(null, req.id);

        return (
          <div key={req.id} className="leave-card" style={{ borderLeftColor: statusColor }}>
            <div className="leave-card-header">
              <div className="leave-card-title">
                <strong>{req.type} LEAVE</strong>
                <span className="leave-dates">
                  {req.startDate.toLocaleDateString()} &mdash; {req.endDate.toLocaleDateString()}
                  <span className="leave-duration">({duration} {duration === 1 ? 'day' : 'days'})</span>
                </span>
              </div>
              <div className="leave-card-actions">
                <span className="status-badge" style={{ backgroundColor: `rgba(255,255,255,0.1)`, color: statusColor }} aria-label={`Status: ${req.status}`}>
                  {req.status}
                </span>
                {req.status === 'PENDING' && (
                  <form action={cancelAction as any}>
                    <CancelLeaveButton />
                  </form>
                )}
              </div>
            </div>
            <div className="leave-card-reason">{req.reason}</div>
            <div className="leave-card-footer">
              Requested on {req.createdAt.toLocaleDateString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
