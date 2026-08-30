/**
 * User Management Actions (REQ04, REQ05, REQ06, REQ07)
 */

import { store, UserRecord } from "../mock-data";
import { canManageUsers } from "../auth";

export interface UserActionResult {
  success: boolean;
  user?: UserRecord;
  users?: UserRecord[];
  error?: string;
}

/**
 * Get all users (Admin only)
 */
export async function getUsersAction(currentRole: string): Promise<UserActionResult> {
  if (!canManageUsers(currentRole)) {
    return { success: false, error: "Unauthorized. Admin role required." };
  }
  return { success: true, users: store.getUsers() };
}

/**
 * REQ04: Administrator shall be able to add new user accounts
 * REQ07: Role assignment during user creation
 */
export async function createUserAction(
  currentRole: string,
  data: {
    name: string;
    email: string;
    password: string;
    role: "administrator" | "caregiver" | "parent";
    isActive?: boolean;
    avatarUrl?: string;
  }
): Promise<UserActionResult> {
  if (!canManageUsers(currentRole)) {
    return { success: false, error: "Unauthorized. Only Administrator can add new users (REQ04)." };
  }

  if (!data.name || !data.email || !data.password) {
    return { success: false, error: "Name, email, and password are required." };
  }

  // Check email uniqueness
  const existing = store.getUserByEmail(data.email);
  if (existing) {
    return { success: false, error: `A user with email ${data.email} already exists.` };
  }

  const newUser = store.addUser({
    name: data.name.trim(),
    email: data.email.trim(),
    passwordHash: data.password,
    role: data.role,
    isActive: data.isActive ?? true,
    avatarUrl: data.avatarUrl || undefined,
  });

  return { success: true, user: newUser };
}

/**
 * REQ05: Administrator shall be able to update existing user information
 * REQ07: Administrator shall be able to assign a role to a user account
 */
export async function updateUserAction(
  currentRole: string,
  userId: string,
  updates: {
    name?: string;
    email?: string;
    password?: string;
    role?: "administrator" | "caregiver" | "parent";
    isActive?: boolean;
    avatarUrl?: string;
  }
): Promise<UserActionResult> {
  if (!canManageUsers(currentRole)) {
    return { success: false, error: "Unauthorized. Only Administrator can update users (REQ05)." };
  }

  const user = store.getUserById(userId);
  if (!user) {
    return { success: false, error: "User not found." };
  }

  if (updates.email && updates.email !== user.email) {
    const existing = store.getUserByEmail(updates.email);
    if (existing) {
      return { success: false, error: `Email ${updates.email} is already in use by another user.` };
    }
  }

  const patchData: Partial<UserRecord> = {};
  if (updates.name) patchData.name = updates.name.trim();
  if (updates.email) patchData.email = updates.email.trim();
  if (updates.password) patchData.passwordHash = updates.password;
  if (updates.role) patchData.role = updates.role;
  if (updates.isActive !== undefined) patchData.isActive = updates.isActive;
  if (updates.avatarUrl !== undefined) patchData.avatarUrl = updates.avatarUrl;

  const updatedUser = store.updateUser(userId, patchData);
  return { success: true, user: updatedUser || undefined };
}

/**
 * REQ06: Administrator shall be able to deactivate or remove a user account
 */
export async function toggleUserStatusAction(
  currentRole: string,
  userId: string,
  isActive: boolean
): Promise<UserActionResult> {
  if (!canManageUsers(currentRole)) {
    return { success: false, error: "Unauthorized. Only Administrator can toggle user status (REQ06)." };
  }

  const updated = store.deactivateUser(userId, isActive);
  if (!updated) {
    return { success: false, error: "User not found." };
  }

  return { success: true, user: updated };
}

/**
 * REQ06: Administrator shall be able to remove/delete a user account
 */
export async function deleteUserAction(
  currentRole: string,
  userId: string
): Promise<UserActionResult> {
  if (!canManageUsers(currentRole)) {
    return { success: false, error: "Unauthorized. Only Administrator can delete users." };
  }

  const deleted = store.deleteUser(userId);
  if (!deleted) {
    return { success: false, error: "User not found or could not be deleted." };
  }

  return { success: true };
}
