"use client";

import { useActionState, useEffect } from "react";
import { login } from "@leave-app/database/src/actions/auth";
import Link from "next/link";

export default function LoginPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, formAction] = useActionState(login as any, null as any);

  useEffect(() => {
    if (state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

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
          Don&apos;t have an account? <Link href="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
