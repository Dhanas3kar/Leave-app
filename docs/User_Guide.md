# User Guide: LeaveSync

Welcome to LeaveSync! This guide will help you navigate both the Employee Portal and the Manager Command Center.

## For Employees

### 1. Creating an Account
1. Navigate to the Employee Portal (`http://localhost:3000`).
2. Click **Sign up**.
3. Fill in your name, email, password, and select **Employee** as your role.
4. Click **Sign Up**.

### 2. Requesting Leave
1. Once logged in, you will see your **Leave Balance** on the dashboard.
2. Under **Request Leave**, select your start and end dates.
3. Choose the type of leave (Annual, Sick, Casual, Maternity).
4. Provide a brief reason.
5. Click **Submit Request**.
6. Your request will instantly appear under **Your Requests** with a `PENDING` status.

### 3. Canceling a Request
If you made a mistake, you can cancel any `PENDING` request by clicking the red **Cancel** button next to it. Once a request is Approved or Rejected, it cannot be canceled.

---

## For Managers

### 1. Accessing the Command Center
1. Navigate to the Manager Portal (`http://localhost:3001`).
2. Log in with your Manager credentials. (If you don't have an account, create one at the Employee portal and select **Manager** as your role).

### 2. Reviewing Requests
1. The dashboard displays company-wide statistics: total pending, approved, rejected, and canceled requests.
2. Below the statistics, you will see a list of all `PENDING` employee leave requests.

### 3. Approving or Rejecting Leave
1. Review the dates, type, and reason for the leave request.
2. Click the green **Approve** button to grant the leave, or the red **Reject** button to deny it.
3. Once approved, the employee's leave balance is automatically updated, and the request disappears from your pending queue.

---

## Troubleshooting
- **Cannot Sign In:** Ensure you are using the correct email and password. If you forgot your password, please contact the system administrator.
- **Negative Balance:** You cannot request more days than you have available in your balance. The system will block the request.
