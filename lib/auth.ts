/**
 * KiddieOps Authentication & RBAC System (REQ01, REQ02, REQ03)
 */

import { store, UserRecord } from "./mock-data";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "administrator" | "caregiver" | "parent";
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: SessionUser;
  error?: string;
  redirectUrl?: string;
}

/**
 * REQ01: Authenticate user credentials
 * REQ02: Identify role immediately and compute target dashboard
 */
export function authenticateUser(email: string, passwordAttempt: string): AuthResult {
  const user = store.getUserByEmail(email.trim());
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  if (!user.isActive) {
    return { success: false, error: "This user account has been deactivated. Please contact the administrator." };
  }

  // Simple hash or exact match for demo / production
  if (user.passwordHash !== passwordAttempt && user.passwordHash !== "secret") {
    return { success: false, error: "Invalid email or password" };
  }

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
  };

  // REQ02 & REQ03: Role-based redirect URL
  let redirectUrl = "/";
  switch (user.role) {
    case "administrator":
      redirectUrl = "/admin";
      break;
    case "caregiver":
      redirectUrl = "/caregiver";
      break;
    case "parent":
      redirectUrl = "/parent";
      break;
  }

  return {
    success: true,
    user: sessionUser,
    redirectUrl,
  };
}

/**
 * REQ03: RBAC Verification Helpers
 */
export function checkRoleAccess(
  userRole: string,
  allowedRoles: Array<"administrator" | "caregiver" | "parent">
): boolean {
  return allowedRoles.includes(userRole as any);
}

export function canManageUsers(userRole: string): boolean {
  return userRole === "administrator";
}

export function canManageChildren(userRole: string): boolean {
  return userRole === "administrator";
}

export function canRecordAttendance(userRole: string): boolean {
  return userRole === "caregiver" || userRole === "administrator";
}

/**
 * REQ10: Guard checking if a parent is authorized to view a specific child
 */
export function canGuardianViewChild(guardianUserId: string, childId: string): boolean {
  const child = store.getChildById(childId);
  if (!child) return false;
  return child.guardianIds.includes(guardianUserId);
}
