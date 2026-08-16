# AI Change-Loop Evidence Log

## The Feature & Initial Problem
We wanted to implement a micro-frontend architecture with Next.js 15, breaking our application into an `employee-portal` (port 3000) and a `manager-portal` (port 3001) that share a unified database and JWT-based HTTP-only cookies.

However, after successfully splitting the apps, our End-to-End Playwright test suite began to fail in unpredictable ways during the "Submit Request" flow.

## The Change Loop

### Step 1: Detecting the Failure
**Prompt / Action:** We ran `npx playwright test` after the ports were split. 
**Result:** The tests failed with `Error: expect(locator).toBeVisible() failed`. The tests timed out waiting for the text `Vacation` to appear on the Employee Dashboard after submitting the leave request form.

### Step 2: Diagnosing with Screenshots
**Prompt to AI:** "Add screenshot commands after clicking submit to see what the page looks like. Run the tests again."
**AI Action:** Modified `leave-workflow.spec.ts` to include `await page.screenshot({ path: 'normal-path.png' });` immediately after `await page.click('button[type="submit"]');`.
**Result:** The captured screenshot showed that the browser was on the **Login Page** (`Welcome Back - Sign in to your account`) instead of the Employee Dashboard. The user's session was somehow completely lost immediately upon submitting the form.

### Step 3: Finding the Root Cause
**AI Analysis:** Why would the session be dropped during a POST action? I audited `session.ts` and `auth.ts`, checking cookie `SameSite` policies and `Secure` flags. The cookie policies were correct (`lax`, `httpOnly`). 

Then, I looked at the UI components. We had recently added a `LogoutButton` to the global top navigation bar (`<nav>`).
I opened `LogoutButton.tsx` and found:
```tsx
<form action={logout}>
  <button type="submit">Logout</button>
</form>
```
**The Eureka Moment:** The `LogoutButton` uses `type="submit"`. In our Playwright test, the code to submit the leave request was:
`await page.click('button[type="submit"]');`
Because the `LogoutButton` is located in the top navigation bar (higher in the DOM tree than the leave form), Playwright found the Logout button *first* and clicked it! The test was literally logging the user out instead of submitting their leave request.

### Step 4: Applying the Fix
**Prompt to AI:** "Change the Playwright selector so it clicks the correct submit button, not the logout button."
**AI Action:** Modified the test file to use a more specific text-based locator:
```diff
- await page.click('button[type="submit"]');
+ await page.click('button:has-text("Submit Request")');
```

### Step 5: Verification (The Green Run)
**Prompt to AI:** "Run Playwright tests hopefully final."
**Result:** 
```bash
Running 3 tests using 3 workers
[1/3] ... Normal Path: Register, Login, Request Leave, Approve Leave
[2/3] ... Invalid Input: Attempting to overdraw leave balance
[3/3] ... Fixed Run: Intentional Success
  3 passed (3.6s)
```
The suite passed flawlessly. The AI loop successfully detected a failing test, hypothesized the root cause via visual debugging (screenshots), identified an HTML DOM hierarchy issue with the test automation scripts, and corrected the selector to achieve a green build.
