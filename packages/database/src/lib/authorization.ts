
import { getCurrentUser } from './session';
import type { SessionPayload } from './session-crypto';

// ─── Structured Authorization Errors ─────────────────────────────────────────

export class AuthenticationError extends Error {
  public readonly code = 'UNAUTHENTICATED' as const;
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  public readonly code = 'FORBIDDEN' as const;
  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ─── Core Authorization Helpers ──────────────────────────────────────────────

/**
 * Requires that the current request has a valid authenticated session.
 * Returns the authenticated user's identity.
 *
 * This is an AUTHENTICATION gate — it answers "who is this user?"
 * It does NOT perform authorization (role checks).
 */
export async function requireAuthenticatedUser(): Promise<SessionPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

/**
 * Requires that the authenticated user has the specified role.
 * Returns the authenticated user's identity.
 */
export async function requireRole(role: string): Promise<SessionPayload> {
  const user = await requireAuthenticatedUser();
  if (user.role !== role) {
    throw new AuthorizationError();
  }
  return user;
}

/**
 * Requires that the authenticated user is an EMPLOYEE.
 * Returns the authenticated user's identity.
 */
export async function requireEmployee(): Promise<SessionPayload> {
  return requireRole('EMPLOYEE');
}

/**
 * Requires that the authenticated user is a MANAGER.
 * Returns the authenticated user's identity.
 */
export async function requireManager(): Promise<SessionPayload> {
  return requireRole('MANAGER');
}

// ─── Resource-Level Authorization ────────────────────────────────────────────

/**
 * Verifies that a leave request belongs to the currently authenticated user.
 *
 * IMPORTANT: This function does NOT accept a userId parameter.
 * It internally retrieves the authenticated user and compares against
 * the leave request's userId. This prevents IDOR attacks where a
 * client-supplied userId could be used to access another user's leave.
 *
 * @param requestId - The leave request ID to verify ownership of.
 * @returns The leave request record if ownership is confirmed.
 * @throws AuthorizationError if the request does not belong to the authenticated user.
 */
export async function authorizeLeaveOwnership(
  requestId: string,
  prisma: { leaveRequest: { findUnique: (args: any) => Promise<any> } }
): Promise<any> {
  const user = await requireAuthenticatedUser();

  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    // Do not reveal whether the resource exists to unauthorized callers
    throw new AuthorizationError('Leave request not found or access denied.');
  }

  if (request.userId !== user.id) {
    // Do not reveal whether the resource exists to unauthorized callers
    throw new AuthorizationError('Leave request not found or access denied.');
  }

  return request;
}

// ─── Safe Error Conversion ───────────────────────────────────────────────────

/**
 * Converts authorization/authentication errors into safe return values
 * suitable for Server Action responses. Prevents leaking internal details.
 */
export function toSafeAuthError(error: unknown): { error: string } {
  if (error instanceof AuthenticationError) {
    return { error: 'Authentication required.' };
  }
  if (error instanceof AuthorizationError) {
    return { error: 'You do not have permission to perform this action.' };
  }
  // Re-throw unexpected errors
  throw error;
}
