# Design Document

## Data Model (Prisma / SQLite)

The schema utilizes three primary models to track users, their leave balances, and their requests.

### `User`
- **id** (String, UUID, Primary Key)
- **email** (String, Unique)
- **password** (String, Hashed via bcryptjs)
- **name** (String)
- **role** (Enum: `EMPLOYEE` | `MANAGER`)

### `LeaveBalance`
- **id** (String, UUID, Primary Key)
- **userId** (String, Foreign Key to User)
- **totalDays** (Int, default 20)
- **usedDays** (Int, default 0)

### `LeaveRequest`
- **id** (String, UUID, Primary Key)
- **userId** (String, Foreign Key to User)
- **startDate** (DateTime)
- **endDate** (DateTime)
- **type** (Enum: `ANNUAL`, `SICK`, `CASUAL`, `MATERNITY`)
- **status** (Enum: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`)
- **reason** (String)
- **createdAt** (DateTime)
- **updatedAt** (DateTime)

## Key Workflows

### 1. Employee Leave Request Flow
1. Employee registers or logs in securely.
2. Employee fills out the **LeaveRequestForm** (specifying start date, end date, type, and reason).
3. The Server Action intercepts the form, validates dates, and checks `LeaveBalance` to prevent negative overdraws.
4. The request is persisted to the database with `status = PENDING`.
5. The UI automatically revalidates and displays the pending request in the list.

### 2. Manager Approval Flow
1. Manager logs in to the `manager-portal` (port 3001).
2. The Dashboard retrieves all `PENDING` requests company-wide.
3. Manager clicks **Approve** or **Reject**.
4. The Server Action initiates a **Prisma Database Transaction**:
   - If approved, the request is marked `APPROVED`, and the employee's `usedDays` in `LeaveBalance` is incremented.
   - If rejected, the request is marked `REJECTED`, and the balance is untouched.
5. Path is revalidated, reflecting the new stats instantly.

## User Interface & Aesthetic
- **CSS Framework:** Pure Vanilla CSS utilizing root variables for robust theming. No heavy libraries (like Tailwind) are used to maintain strict control over performance.
- **Glassmorphism:** The core aesthetic uses `backdrop-filter: blur(12px)` and subtle translucent gradients (e.g., `rgba(255, 255, 255, 0.05)`) to create a "glass" effect over dynamic backgrounds.
- **Micro-Animations:** Inputs, buttons, and cards feature 0.3s ease transitions on hover, creating a premium, snappy feel.

## Error Handling
Errors inside Server Actions (e.g., invalid login, negative leave requested, chronological mismatches) are caught and returned as structured JSON objects (e.g., `{ error: 'Insufficient leave balance' }`). `React 19`'s `useActionState` hook maps these errors to the UI seamlessly without requiring separate React `useState` overrides.
