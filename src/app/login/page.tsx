"use client";

import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [state, formAction] = useActionState(login as any, null as any);

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>
        
        {state?.error && <div className="error-msg">{state.error}</div>}

        <form action={formAction}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="you@company.com" />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" />
          </div>

          <button type="submit" className="btn-primary">Sign In</button>
        </form>

        <div className="auth-switch">
          Don't have an account? <Link href="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
