"use client";

import { useFormStatus } from 'react-dom';

export default function CancelLeaveButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      style={{ 
        fontSize: '0.7rem', 
        padding: '0.3rem 0.6rem', 
        background: 'var(--danger)', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.7 : 1
      }}
      aria-label="Cancel leave request"
    >
      {pending ? 'Cancelling...' : 'Cancel'}
    </button>
  );
}
