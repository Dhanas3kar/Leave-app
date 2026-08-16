"use client";

import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logout} style={{ display: "inline" }}>
      <button 
        type="submit"
        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
      >
        Logout
      </button>
    </form>
  );
}
