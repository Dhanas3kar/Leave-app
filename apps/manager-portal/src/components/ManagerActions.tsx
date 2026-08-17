"use client";

import { useTransition } from 'react';
import { approveLeaveRequest, rejectLeaveRequest } from '@leave-app/database/src/actions/leave';

export default function ManagerActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveLeaveRequest(requestId);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectLeaveRequest(requestId);
    });
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
      <button 
        onClick={handleApprove} 
        disabled={isPending}
        style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
      >
        Approve
      </button>
      <button 
        onClick={handleReject} 
        disabled={isPending}
        style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
      >
        Reject
      </button>
    </div>
  );
}
