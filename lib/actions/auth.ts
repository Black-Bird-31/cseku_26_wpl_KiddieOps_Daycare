/**
 * Authentication Server Actions
 * Handles login against PostgreSQL database with bcrypt password verification,
 * and maintains fallback/sync with in-memory store.
 */

"use server";

import { db } from "../db";
import { users } from "../db/schema";
import { store } from "../mock-data";
import { AuthResult, SessionUser, verifyPassword } from "../auth";

export async function loginAction(email: string, passwordAttempt: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check PostgreSQL Database
  try {
    const dbUsers = await db.select().from(users);
    const dbUser = dbUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (dbUser) {
      if (!dbUser.isActive) {
        return {
          success: false,
          error: "This user account has been deactivated. Please contact the administrator.",
        };
      }

      const isValidPassword = verifyPassword(passwordAttempt, dbUser.passwordHash);
      if (!isValidPassword) {
        return { success: false, error: "Invalid email or password" };
      }

      // Sync into store for consistent in-memory access
      if (!store.getUserById(dbUser.id)) {
        store.addUser({
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          passwordHash: dbUser.passwordHash,
          role: dbUser.role as any,
          isActive: dbUser.isActive,
        });
      }

      const sessionUser: SessionUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as any,
        isActive: dbUser.isActive,
      };

      let redirectUrl = "/";
      if (dbUser.role === "administrator") redirectUrl = "/admin";
      else if (dbUser.role === "caregiver") redirectUrl = "/caregiver";
      else redirectUrl = "/parent";

      return {
        success: true,
        user: sessionUser,
        redirectUrl,
      };
    }
  } catch (err) {
    console.warn("Database lookup in loginAction encountered error:", err);
  }

  // 2. Fallback to in-memory store (for testing, offline, or mock-data accounts)
  const storeUser = store.getUserByEmail(cleanEmail);
  if (storeUser) {
    if (!storeUser.isActive) {
      return {
        success: false,
        error: "This user account has been deactivated. Please contact the administrator.",
      };
    }

    if (!verifyPassword(passwordAttempt, storeUser.passwordHash)) {
      return { success: false, error: "Invalid email or password" };
    }

    const sessionUser: SessionUser = {
      id: storeUser.id,
      name: storeUser.name,
      email: storeUser.email,
      role: storeUser.role,
      avatarUrl: storeUser.avatarUrl,
      isActive: storeUser.isActive,
    };

    let redirectUrl = "/";
    if (storeUser.role === "administrator") redirectUrl = "/admin";
    else if (storeUser.role === "caregiver") redirectUrl = "/caregiver";
    else redirectUrl = "/parent";

    return {
      success: true,
      user: sessionUser,
      redirectUrl,
    };
  }

  return { success: false, error: "Invalid email or password" };
}
