# Architecture Document

## Overview
LeaveSync uses a distributed NPM Workspace Monorepo architecture to cleanly separate concerns between standard employees and administrators (managers), while sharing a common database layer.

## Monorepo Structure
- **`apps/employee-portal`**: A Next.js 15 application running on port `3000`. Handles employee registration, login, leave requests, and balance viewing.
- **`apps/manager-portal`**: A Next.js 15 application running on port `3001`. Handles manager login and the centralized approval/rejection command center.
- **`packages/database`**: A shared Prisma ORM package housing the SQLite `dev.db` database. Both portals import `prisma` from this package, ensuring single-source-of-truth transactions without duplicating schema files.

## Data Flow
1. **Client Request:** User fills out a form (e.g., requesting leave) on a React 19 Server Component page.
2. **Server Action:** The form submission is handled natively by a Next.js Server Action (`createLeaveRequest`), preventing the need for an intermediate REST API layer.
3. **Database Transaction:** The Server Action utilizes the shared `@leave-app/database` Prisma client to execute atomic transactions (e.g., creating a request and deducting balance simultaneously).
4. **Cache Invalidation:** Using `revalidatePath`, the server automatically pushes the fresh data back to the client, removing the need for complex client-side state management (like Redux or React Query).

## Technology Choices & Why
- **Next.js 15 (App Router):** Chosen for its native Server Actions and seamless Server-Side Rendering (SSR).
- **Prisma & SQLite:** SQLite allows for rapid zero-config local prototyping. Prisma provides bulletproof TypeScript schema generation and atomic transactions.
- **`jose` & `bcryptjs`:** Used for stateless JWT authentication over HTTP-only secure cookies, allowing sessions to persist seamlessly across different ports (`localhost:3000` and `localhost:3001`).
- **Playwright:** Chosen for rigorous End-to-End browser testing to simulate real user flows across the two separate portals.
