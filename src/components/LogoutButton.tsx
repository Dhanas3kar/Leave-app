"use client";

import { logout } from '@/app/actions/auth';

export default function LogoutButton() {
  return (
    <button onClick={() => logout()} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
      Logout
    </button>
  );
}
