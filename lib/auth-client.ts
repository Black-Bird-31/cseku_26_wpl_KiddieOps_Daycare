/**
 * Client-Side Authentication State Manager
 * Synchronizes localStorage and document.cookie for route guarding.
 */

import { SessionUser } from "./auth";
import { UserRecord } from "./mock-data";

const STORAGE_KEY = "kiddieops_active_user";
const COOKIE_KEY = "kiddieops_session_role";

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse stored user session:", e);
    return null;
  }
}

export function setStoredUser(user: SessionUser | UserRecord): void {
  if (typeof window === "undefined") return;
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
  // Set session cookie for 7 days
  document.cookie = `${COOKIE_KEY}=${user.role}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  // Dispatch custom event to notify components
  window.dispatchEvent(new Event("kiddieops_auth_changed"));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event("kiddieops_auth_changed"));
}
