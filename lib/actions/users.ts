/**
 * User Management Actions (REQ04, REQ05, REQ06, REQ07)
 * Synchronizes with PostgreSQL database and maintains in-memory store compatibility.
 */

"use server";

import { store, UserRecord } from "../mock-data";
import { canManageUsers, hashPassword } from "../auth";
import { db } from "../db";
import { 
  users, 
  caregivers, 
  caregiverClassrooms, 
  childGuardians, 
  activityLogs, 
  attendance, 
  complaints, 
  notices, 
  childMediaPosts, 
  medicalRecords, 
  medicalRecordAudit,
  aiGuardianSessions,
  mediaAssets
} from "../db/schema";
import { eq, or } from "drizzle-orm";
import { safeRevalidate } from "./safe-revalidate";

export interface UserActionResult {
  success: boolean;
  user?: UserRecord;
  users?: UserRecord[];
  error?: string;
}

const isUUID = (str?: string): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Get all users (Admin only) from PostgreSQL
 */
export async function getUsersAction(currentRole: string): Promise<UserActionResult> {
  if (!canManageUsers(currentRole)) {
    return { success: false, error: "Unauthorized. Admin role required." };
  }

  try {
    const dbUsers = await db.select().from(users);
    if (dbUsers.length > 0) {
      const mapped: UserRecord[] = dbUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role as any,
        isActive: u.isActive,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
      }));

      // Keep store updated
      mapped.forEach((u) => {
        if (!store.getUserById(u.id)) {
          store.addUser(u);
        }
      });

      return { success: true, users: mapped };
    }
  } catch (err) {
    console.warn("Falling back to in-memory store for getUsersAction:", err);
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

  const cleanEmail = data.email.trim();

  // Check email uniqueness in store
  const existingStore = store.getUserByEmail(cleanEmail);
  if (existingStore) {
    return { success: false, error: `A user with email ${cleanEmail} already exists.` };
  }

  let dbUserRecord: any = null;

  const hashedPassword = hashPassword(data.password);

  try {
    const [inserted] = await db
      .insert(users)
      .values({
        name: data.name.trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        role: data.role,
        isActive: data.isActive ?? true,
      })
      .onConflictDoNothing()
      .returning();

    dbUserRecord = inserted;
  } catch (err) {
    console.warn("Direct DB insert note in createUserAction:", err);
  }

  const newUser = store.addUser({
    id: dbUserRecord?.id,
    name: data.name.trim(),
    email: cleanEmail,
    passwordHash: hashedPassword,
    role: data.role,
    isActive: data.isActive ?? true,
    avatarUrl: data.avatarUrl || undefined,
  });

  safeRevalidate("/admin/users");
  safeRevalidate("/admin");
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

  if (isUUID(userId)) {
    if (!user) {
      try {
        const dbCheck = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!dbCheck[0]) return { success: false, error: "User not found." };
      } catch {
        return { success: false, error: "User not found." };
      }
    }

    let hashedPassword: string | undefined = undefined;
    if (updates.password && updates.password.trim().length > 0) {
      const isAlreadyHash =
        updates.password.startsWith("$2a$") ||
        updates.password.startsWith("$2b$") ||
        updates.password.startsWith("$2y$");
      hashedPassword = isAlreadyHash ? updates.password : hashPassword(updates.password);
    }

    try {
      const patch: any = { updatedAt: new Date() };
      if (updates.name) patch.name = updates.name.trim();
      if (updates.email) patch.email = updates.email.trim();
      if (hashedPassword) patch.passwordHash = hashedPassword;
      if (updates.role) patch.role = updates.role;
      if (updates.isActive !== undefined) patch.isActive = updates.isActive;

      await db.update(users).set(patch).where(eq(users.id, userId));
    } catch (err) {
      console.warn("DB update note in updateUserAction:", err);
    }
  }

  if (updates.email && updates.email !== user?.email) {
    const existing = store.getUserByEmail(updates.email);
    if (existing) {
      return { success: false, error: `Email ${updates.email} is already in use by another user.` };
    }
  }

  const patchData: Partial<UserRecord> = {};
  if (updates.name) patchData.name = updates.name.trim();
  if (updates.email) patchData.email = updates.email.trim();
  if (updates.password && updates.password.trim().length > 0) {
    const isAlreadyHash =
      updates.password.startsWith("$2a$") ||
      updates.password.startsWith("$2b$") ||
      updates.password.startsWith("$2y$");
    patchData.passwordHash = isAlreadyHash ? updates.password : hashPassword(updates.password);
  }
  if (updates.role) patchData.role = updates.role;
  if (updates.isActive !== undefined) patchData.isActive = updates.isActive;
  if (updates.avatarUrl !== undefined) patchData.avatarUrl = updates.avatarUrl;

  const updatedUser = store.updateUser(userId, patchData);
  safeRevalidate("/admin/users");
  safeRevalidate("/admin");
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

  if (isUUID(userId)) {
    try {
      await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, userId));
    } catch (err) {
      console.warn("DB toggle note in toggleUserStatusAction:", err);
    }
  }

  const updated = store.deactivateUser(userId, isActive);
  if (!updated) {
    return { success: false, error: "User not found." };
  }

  safeRevalidate("/admin/users");
  safeRevalidate("/admin");
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

  // Prevent deleting primary administrator
  const existingStoreUser = store.getUserById(userId);
  if (existingStoreUser?.email === "admin@kiddieops.com") {
    return { success: false, error: "The primary Administrator account cannot be deleted." };
  }

  if (isUUID(userId)) {
    try {
      // Check if trying to delete primary admin in DB
      const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (dbUser?.email === "admin@kiddieops.com") {
        return { success: false, error: "The primary Administrator account cannot be deleted." };
      }

      // 1. Delete AI Guardian sessions
      await db.delete(aiGuardianSessions).where(eq(aiGuardianSessions.guardianUserId, userId));

      // 2. Delete child media posts captured by this caregiver
      await db.delete(childMediaPosts).where(eq(childMediaPosts.caregiverUserId, userId));

      // 3. Delete activity logs logged by this user
      await db.delete(activityLogs).where(eq(activityLogs.loggedByUserId, userId));

      // 4. Delete complaints filed by or against this user
      await db
        .delete(complaints)
        .where(or(eq(complaints.parentUserId, userId), eq(complaints.caregiverUserId, userId)));
      await db
        .update(complaints)
        .set({ resolvedByUserId: null })
        .where(eq(complaints.resolvedByUserId, userId));

      // 5. Delete authored notices
      await db.delete(notices).where(eq(notices.authorUserId, userId));

      // 6. Delete child guardians mappings
      await db.delete(childGuardians).where(eq(childGuardians.userId, userId));

      // 7. Nullify attendance recorded by this user
      await db
        .update(attendance)
        .set({ recordedByUserId: null })
        .where(eq(attendance.recordedByUserId, userId));

      // 8. Caregiver profile & classroom mappings
      const cgProfiles = await db.select().from(caregivers).where(eq(caregivers.userId, userId));
      for (const cg of cgProfiles) {
        await db.delete(caregiverClassrooms).where(eq(caregiverClassrooms.caregiverId, cg.id));
        await db.delete(caregivers).where(eq(caregivers.id, cg.id));
      }

      // 9. Medical record audit & updates
      await db.delete(medicalRecordAudit).where(eq(medicalRecordAudit.actorUserId, userId));
      await db
        .update(medicalRecords)
        .set({ lastUpdatedByUserId: null })
        .where(eq(medicalRecords.lastUpdatedByUserId, userId));

      // 10. Media assets uploaded by user
      await db
        .update(mediaAssets)
        .set({ uploadedByUserId: null })
        .where(eq(mediaAssets.uploadedByUserId, userId));

      // 11. Finally, forcefully delete the user
      await db.delete(users).where(eq(users.id, userId));
    } catch (err) {
      console.warn("DB delete note in deleteUserAction:", err);
    }
  }

  // Also remove from store if present
  store.deleteUser(userId);

  safeRevalidate("/admin/users");
  safeRevalidate("/admin");
  return { success: true };
}
