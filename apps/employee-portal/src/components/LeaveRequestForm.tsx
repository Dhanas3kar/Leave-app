"use client";

import { useActionState } from 'react';
import { createLeaveRequest } from '@leave-app/database/src/actions/leave';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit Request'}
    </button>
  );
}

export default function LeaveRequestForm() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction] = useActionState(createLeaveRequest as any, null as any);

  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <h3>Request Leave</h3>
      {state?.error && <div className="error-msg">{state.error}</div>}
      {state?.success && <div className="error-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>Leave request submitted successfully!</div>}
      
      <form action={formAction} style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="startDate">Start Date</label>
            <input type="date" id="startDate" name="startDate" required />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="endDate">End Date</label>
            <input type="date" id="endDate" name="endDate" required />
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="type">Leave Type</label>
          <select id="type" name="type" required>
            <option value="ANNUAL">Annual Leave</option>
            <option value="SICK">Sick Leave</option>
            <option value="CASUAL">Casual Leave</option>
            <option value="MATERNITY">Maternity Leave</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="reason">Reason</label>
          <textarea id="reason" name="reason" required rows={3} placeholder="Why do you need leave?"></textarea>
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
