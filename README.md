<div align="center">
  <h1>✨ LeaveSync Monorepo Workspace</h1>
  <p><strong>A Distributed, Production-Ready Leave Management Prototype</strong></p>
  <p><em>Submitted for the Tactive QA Automation & Software Engineering Assessment</em></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
  [![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
</div>

---

## 📖 Overview
LeaveSync is a robust prototype engineered to manage employee leave requests securely across a **distributed architecture**. 

Built for the Tactive Internship Assessment, this repository demonstrates the ability to architect a modern web application, automate testing with AI, and iteratively fix and improve code through an AI change loop.

Instead of a monolithic application, LeaveSync is split into isolated micro-frontends (Employee Portal and Manager Portal) inside an NPM Workspace monorepo. This showcases advanced system design, strict route segmenting, and production-level architectural principles.

## 📁 Assessment Deliverables Included

All required deliverables are packaged in this repository:
- **Source Code:** Full Next.js 15 App Router implementation.
- **Documentation (`/docs`):** 
  - [Architecture Document](./docs/Architecture_Document.md)
  - [Design Document](./docs/Design_Document.md)
  - [User Guide](./docs/User_Guide.md)
  - [AI Change Loop Evidence Log](./docs/AI_Change_Loop_Evidence.md)
  - [Presentation Deck](./docs/Presentation_Deck.html)
- **Test Suite (`/tests`):** E2E automated Playwright scripts covering normal paths, edge cases, and invalid inputs.

---

## 🚀 Getting Started

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

## 🧪 Automated Testing

The application is fully covered by end-to-end Playwright tests, orchestrating workflows across both the Employee and Manager portals. The tests validate successful flows, ensure proper leave-balance math, and test quota exhaustion (a deliberate red-run scenario).

To run the test suite:
```bash
npx playwright install # Run this once to download browser binaries
npx playwright test
```

Test results, traces, and screenshots are output to the `playwright-report/` and `test-results/` directories.

---

## 💎 Core Features

* **📦 Distributed Monorepo Setup:** Segregated into `apps/employee-portal` and `apps/manager-portal` with a shared `@leave-app/database` package.
* **🔒 Bulletproof Authentication:** Stateless, JWT-based login working seamlessly across ports via secure, HttpOnly cookies.
* **🛡️ Role-Based Access Control:** Strict routing separation, ensuring standard employees can never access the manager dashboard, while managers can smoothly cross-navigate to submit their own leave.
* **🧮 Leave Calculus Engine:** Automatically tracks standard 20-day leave quotas, blocks negative overdraws, and guards against illogical chronological requests.
* **✨ Premium UI:** Built exclusively with vanilla CSS variables, Glassmorphism elements, and micro-animations to ensure a lightweight, modern, and snappy aesthetic.

---

## 🔮 Roadmap to Production (Post-MVP)

> **⚠️ ATTENTION:** LeaveSync is currently a Minimum Viable Product (MVP) / Rapid Prototype. It was engineered to showcase high-end design, robust database architecture, and Server Action security in a condensed timeframe.

To transition this distributed codebase into a fully compliant, production-grade enterprise application, the following roadmap should be executed:

### Phase 1: Security & Identity
- **Auth Provider Integration:** Replace local JWT password auth with a managed provider (e.g., NextAuth.js/Auth.js with Google Workspace, Okta, or Azure AD) for SSO and MFA.
- **Audit Logging:** Create a dedicated `AuditLog` table to track every status change (e.g., *Manager X approved Leave Y at Timestamp*).

### Phase 2: Advanced Business Logic
- **Holiday & Weekend Filtering:** Integrate a calendar API to automatically discount weekends and national holidays from leave day calculations.
- **Multi-Tier Approvals:** Support complex organizational charts where a request must pass through a direct Lead before reaching HR.

### Phase 3: Infrastructure & Deployment
- **Database Migration:** Swap local SQLite for a highly available PostgreSQL cluster (e.g., Neon, Supabase, or AWS RDS).
- **Micro-Frontend Routing:** Implement Nginx or Vercel Edge routing to serve the portals on subdomains (e.g., `employee.company.com` and `manager.company.com`) rather than distinct ports.
