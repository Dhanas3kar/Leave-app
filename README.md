<div align="center">
  <h1>🏝️ LeaveSync Workspace</h1>
  <p><strong>A Production-Ready, Robust Leave Management Prototype</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
  [![Playwright](https://img.shields.io/badge/Playwright-Tested-2EAD33?style=for-the-badge&logo=playwright)](https://playwright.dev)
  [![Render](https://img.shields.io/badge/Render-Deployable-black?style=for-the-badge&logo=render)](https://render.com)
</div>

---

## 🚀 Overview
LeaveSync is a fully-fledged, end-to-end prototype designed to manage employee leave requests seamlessly. Moving beyond hard-coded state, this application leverages a real **SQLite database**, robust **Server Actions**, and **stateless JWT authentication** to provide a human-crafted, premium-feeling internal tooling experience.

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

## ☁️ Zero-Config Deployment

Deploying this app is completely automated. We have provided a `render.yaml` Blueprint file to bypass the ephemeral filesystem limitations of standard serverless hosts. 

**Deploy to Render.com:**
1. Log in to [Render](https://render.com) and click **New + -> Blueprint**.
2. Connect your GitHub repository.
3. Render will instantly provision the Node server, run Prisma migrations, and attach a 1GB persistent disk at `/data` to store the SQLite database.

