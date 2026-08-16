<div align="center">
  <h1>🏝️ LeaveSync Workspace</h1>
  <p><strong>A Production-Ready, Robust Leave Management Prototype</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
  [![Playwright](https://img.shields.io/badge/Playwright-Tested-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployable-black?style=for-the-badge&logo=vercel)](https://vercel.com)
</div>

---

## 🚀 Overview
LeaveSync is a fully-fledged, end-to-end prototype designed to manage employee leave requests seamlessly. Moving beyond hard-coded state, this application leverages a real **SQLite database** (which can be easily swapped to PostgreSQL for edge deployments), robust **Server Actions**, and **stateless JWT authentication** to provide a human-crafted, premium-feeling internal tooling experience.

It was engineered with production-level principles, avoiding AI-generated boilerplate in favor of strict, resilient, manual code design.

## ✨ Core Features

* **🛡️ Bulletproof Authentication:** Stateless, JWT-based (`jose` + `bcryptjs`) login and registration system operating over secure HTTP-only cookies.
* **👥 Role-Based Access Control (RBAC):** Distinct routing and layout handling for `EMPLOYEE` and `MANAGER` roles via Next.js Middleware.
* **📅 Leave Calculus Engine:** Automatically tracks standard 20-day leave quotas, blocks negative overdraws, and guards against illogical chronological requests.
* **📈 Manager Command Center:** A secure dashboard to view company-wide pending leave requests, executing approvals or rejections via Prisma atomic transactions.
* **🎨 Premium Glassmorphism UI:** Built exclusively with vanilla CSS variables and micro-animations to ensure a lightweight, modern, and snappy aesthetic.

## 🏗️ Technical Architecture

* **Framework:** Next.js (App Router, Server Actions, React 19)
* **Database:** SQLite (local persistent database `dev.db`)
* **ORM:** Prisma Client for typesafe, transactional queries
* **Testing:** Playwright for rigorous End-to-End (E2E) UI flows

---

## 🏁 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed on your machine.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/Dhanas3kar/Leave-app.git
cd Leave-app
npm install
```

### 3. Database Initialization
This project uses SQLite for zero-config persistence. Generate the tables:
```bash
npx prisma db push
```

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Robust E2E Testing

LeaveSync features a comprehensive Playwright testing suite simulating real user flows. It tests:
1. **The Happy Path:** Registering, logging in, and submitting a valid leave request.
2. **The Edge Case:** Requesting the exact remaining balance of days.
3. **The Invalid Path:** Attempting to overdraw the leave balance (verifies form rejection).
4. **The Red Run:** An intentionally failing assertion to prove the suite accurately catches regressions.

**To run the test suite:**
```bash
npx playwright test
```

---

## ☁️ Zero-Cost Cloud Deployment (Vercel + Neon)

Since SQLite is a local file-based database, it does not persist on serverless edge networks like Vercel. 
To deploy this application **completely for free** (with absolutely no credit card required), follow these steps:

1. **Create a Free Cloud Database:**
   Sign in to [Neon.tech](https://neon.tech) (or Supabase) using your GitHub account. Create a new free project. It will instantly generate a PostgreSQL connection string (`postgresql://...`).

2. **Update Prisma to PostgreSQL:**
   In your codebase, open `prisma/schema.prisma` and change `provider = "sqlite"` to `provider = "postgresql"`. Commit and push this change to your repository.

3. **Deploy to Vercel:**
   Sign in to [Vercel](https://vercel.com) using GitHub. Import this repository.
   In the **Environment Variables** section before clicking deploy, add:
   - `DATABASE_URL`: Your Neon Postgres connection string.
   - `JWT_SECRET`: Any long, secure random string.

Click **Deploy**! Vercel will automatically run the Prisma migrations (`npx prisma db push`) and launch your application on a lightning-fast, free, global edge network.



---

## 🚀 Roadmap to Production (Post-MVP)

> **Note:** LeaveSync is currently a **Minimum Viable Product (MVP) / Rapid Prototype**. It was engineered to showcase high-end design, robust database architecture, and Server Action security in a condensed timeframe.

To transition this codebase into a fully compliant, production-grade enterprise application, the following roadmap should be executed:

### Phase 1: Security & Compliance
- **Auth Provider Integration:** Replace local JWT password auth with a managed provider (e.g., NextAuth.js/Auth.js with Google Workspace, Okta, or Azure AD) for SSO and MFA.
- **Data Encryption:** Ensure database at-rest encryption and encrypt sensitive PII fields.
- **Audit Logging:** Create a dedicated \AuditLog\ table to track every status change (e.g., *'Manager X approved Leave Y at Timestamp'*).

### Phase 2: Advanced Business Logic
- **Holiday & Weekend Filtering:** Integrate a calendar API to automatically discount weekends and national holidays from leave day calculations.
- **Multi-Tier Approvals:** Support complex organizational charts where a request must pass through a direct Lead before reaching HR.
- **Accrual Engine:** Replace static leave quotas with a chron-job powered accrual system (e.g., earning 1.5 days per month worked).

### Phase 3: Infrastructure & Scalability
- **Database Migration:** Swap SQLite for a highly available PostgreSQL cluster (e.g., Neon, Supabase, or AWS RDS).
- **Email Notifications:** Integrate Resend or SendGrid to email users automatically when their leave is approved, rejected, or pending for too long.
- **Observability:** Integrate Sentry for error tracking and Datadog/Vercel Analytics for performance monitoring.
