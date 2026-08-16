# LeaveSync - Leave Management System

A robust, full-fledged prototype for managing employee leave requests, built as part of the Tactive Engineering Assessment. 

## Overview
LeaveSync allows employees to request time off, and managers to approve or reject those requests. The system keeps track of available leave balances and ensures employees cannot request more days than they have available. 

## Features
- **Role-based Authentication:** Secure login and registration for Employees and Managers.
- **Leave Balance Tracking:** Employees are automatically assigned 20 days of leave per year.
- **Request Validation:** Prevents requesting past dates (ideally), end dates before start dates, and requesting more days than the available balance.
- **Manager Dashboard:** Managers can see all pending requests and take action.
- **Premium UI:** Custom glassmorphism design with responsive layouts.

## Tech Stack
- **Framework:** Next.js 14 (App Router) with React and TypeScript.
- **Database:** SQLite (local database, no hardcoded state).
- **ORM:** Prisma.
- **Authentication:** Custom JWT-based session management using `jose` and `bcryptjs`.
- **Testing:** Playwright for E2E testing.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up the database:
   The project uses a local SQLite database (`dev.db`). Initialize the database schema:
   ```bash
   npx prisma db push
   ```

### Running the App
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing
We use Playwright for end-to-end testing to verify the critical user flows (Stage 2).
To run the tests:
```bash
npx playwright test
```

## Documentation
- Architecture, Design, and User Guide documents can be found in the `docs/` folder (to be added as per assessment requirements).
