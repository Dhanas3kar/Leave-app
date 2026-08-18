"use client";

import { useTransition, useState } from 'react';
import { approveLeaveRequest, rejectLeaveRequest } from '@leave-app/database/src/actions/leave';

export default function ManagerActions({ requestId }: { requestId: string }) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    setActionType('APPROVE');
    startTransition(async () => {
      const res = await approveLeaveRequest(requestId);
      if (res && 'error' in res && typeof res.error === 'string') {
        setError(res.error);
        setActionType(null);
      }
    });
  };

  const handleReject = () => {
    setError(null);
    setActionType('REJECT');
    startTransition(async () => {
      const res = await rejectLeaveRequest(requestId);
      if (res && 'error' in res && typeof res.error === 'string') {
        setError(res.error);
        setActionType(null);
      }
    });
  };

  return (
    <div>
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem', background: 'rgba(255,59,48,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button 
          onClick={handleApprove} 
          disabled={isPending}
          style={{ 
            background: 'var(--success)', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1
          }}
        >
          {isPending && actionType === 'APPROVE' ? 'Approving...' : 'Approve'}
        </button>
        <button 
          onClick={handleReject} 
          disabled={isPending}
          style={{ 
            background: 'transparent', 
            color: 'var(--text-muted)', 
            border: '1px solid var(--glass-border)', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.7 : 1
          }}
        >
          {isPending && actionType === 'REJECT' ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </div>
  );
}
