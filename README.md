<div align="center">
  <h1>??? LeaveSync Monorepo Workspace</h1>
  <p><strong>A Distributed, Production-Ready Leave Management Prototype</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
</div>

---

## ?? Overview
LeaveSync is a fully-fledged, end-to-end prototype engineered to manage employee leave requests securely and elegantly across a **distributed architecture**. 

Instead of a monolithic Next.js application handling mixed concerns, LeaveSync is split into isolated micro-frontends (Employee Portal and Manager Portal) inside an NPM Workspace monorepo. This allows parallel development, cleaner route segmenting, and an authentic production-level deployment setup.

It was crafted manually with high-end robust practices, avoiding AI-generated boilerplate to ensure code resiliency.

## ? Core Features

* **??? Distributed Monorepo Setup:** Segregated into `apps/employee-portal` and `apps/manager-portal` with a shared `@leave-app/database` package.
* **??? Bulletproof Authentication:** Stateless, JWT-based (`jose` + `bcryptjs`) login working seamlessly across ports via secure cookies.
* **?? Role-Based Access Control:** Strict routing separation, ensuring standard employees can never access the manager dashboard, while managers can smoothly cross-navigate to submit their own leave.
* **?? Leave Calculus Engine:** Automatically tracks standard 20-day leave quotas, blocks negative overdraws, and guards against illogical chronological requests.
* **?? Premium UI:** Built exclusively with vanilla CSS variables and micro-animations to ensure a lightweight, modern, and snappy aesthetic.

## ??? Technical Architecture

* **Framework:** Next.js (App Router, Server Actions, React 19)
* **Architecture:** NPM Workspaces Monorepo
* **Database:** SQLite (local persistent database `dev.db`) via Prisma ORM
* **Process Management:** `concurrently` for running both portals synchronously.

---

## ?? Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed on your machine.

### 2. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/Dhanas3kar/Leave-app.git
cd Leave-app
npm install
```

### 3. Database Initialization
This project uses SQLite for zero-config persistence, isolated securely in `packages/database`. Generate the tables:
```bash
npm run db:push
```

### 4. Run the Parallel Development Servers
To boot both micro-frontends simultaneously, run the command at the root of the repository:
```bash
npm run dev
```

* The **Employee Portal** will be available at [http://localhost:3000](http://localhost:3000)
* The **Manager Portal** will be available at [http://localhost:3001](http://localhost:3001)

---

## ?? Roadmap to Production (Post-MVP)

> **?? ATTENTION:** LeaveSync is currently a **Minimum Viable Product (MVP) / Rapid Prototype**. It was engineered to showcase high-end design, robust database architecture, and Server Action security in a condensed timeframe.

To transition this distributed codebase into a fully compliant, production-grade enterprise application, the following roadmap should be executed:

### Phase 1: Security & Identity
- **Auth Provider Integration:** Replace local JWT password auth with a managed provider (e.g., NextAuth.js/Auth.js with Google Workspace, Okta, or Azure AD) for SSO and MFA.
- **Data Encryption:** Ensure database at-rest encryption and encrypt sensitive PII fields.
- **Audit Logging:** Create a dedicated `AuditLog` table to track every status change (e.g., *Manager X approved Leave Y at Timestamp*).

### Phase 2: Advanced Business Logic
- **Holiday & Weekend Filtering:** Integrate a calendar API to automatically discount weekends and national holidays from leave day calculations.
- **Multi-Tier Approvals:** Support complex organizational charts where a request must pass through a direct Lead before reaching HR.
- **Accrual Engine:** Replace static leave quotas with a chron-job powered accrual system (e.g., earning 1.5 days per month worked).

### Phase 3: Infrastructure & Deployment
- **Database Migration:** Swap local SQLite for a highly available PostgreSQL cluster (e.g., Neon, Supabase, or AWS RDS). *Update `provider` in `schema.prisma` before deploying to Vercel.*
- **Micro-Frontend Routing (Reverse Proxy):** Implement Nginx or Vercel Edge routing to serve the portals on subdomains (e.g., `employee.company.com` and `manager.company.com`) rather than distinct ports.
- **Observability:** Integrate Sentry for error tracking and Datadog for performance monitoring.

