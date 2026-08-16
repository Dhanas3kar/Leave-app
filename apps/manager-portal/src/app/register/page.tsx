"use client";

import { useActionState, useEffect } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction] = useActionState(register as any, null as any);

  useEffect(() => {
    if (state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join LeaveSync today</p>
        </div>
        
        {state?.error && <div className="error-msg">{state.error}</div>}

        <form action={formAction}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" required placeholder="John Doe" />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="you@company.com" />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" />
          </div>

          <div className="input-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" required>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">Sign Up</button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
