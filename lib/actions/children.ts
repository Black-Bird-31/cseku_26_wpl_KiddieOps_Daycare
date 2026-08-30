/**
 * Child Management Actions (REQ08, REQ09, REQ10)
 */

import { store, ChildRecord } from "../mock-data";
import { canManageChildren, canGuardianViewChild } from "../auth";

export interface ChildActionResult {
  success: boolean;
  child?: ChildRecord;
  children?: ChildRecord[];
  error?: string;
}

/**
 * Get all children (Admin and Caregivers)
 */
export async function getAllChildrenAction(currentRole: string): Promise<ChildActionResult> {
  if (currentRole !== "administrator" && currentRole !== "caregiver") {
    return { success: false, error: "Unauthorized. Staff role required to view all children." };
  }
  return { success: true, children: store.getChildren() };
}

/**
 * REQ10: Parent/Guardian shall be able to view the profile of their own child ONLY.
 * Enforces strict isolation per guardian ID.
 */
export async function getChildrenForGuardianAction(
  currentRole: string,
  guardianUserId: string
): Promise<ChildActionResult> {
  if (currentRole !== "parent" && currentRole !== "administrator") {
    return { success: false, error: "Unauthorized role for guardian child access." };
  }

  const parentChildren = store.getChildrenForGuardian(guardianUserId);
  return { success: true, children: parentChildren };
}

/**
 * REQ10: Single child view with guardian authorization check
 */
export async function getChildByIdAction(
  currentRole: string,
  currentUserId: string,
  childId: string
): Promise<ChildActionResult> {
  // Admin & Caregiver can view all children
  if (currentRole === "administrator" || currentRole === "caregiver") {
    const child = store.getChildById(childId);
    if (!child) return { success: false, error: "Child profile not found." };
    return { success: true, child };
  }

  // Parent can ONLY view their own child
  if (currentRole === "parent") {
    const isAuthorized = canGuardianViewChild(currentUserId, childId);
    if (!isAuthorized) {
      return {
        success: false,
        error: "Access Denied (REQ10): You are only authorized to view your own child's profile.",
      };
    }
    const child = store.getChildById(childId);
    return { success: true, child: child || undefined };
  }

  return { success: false, error: "Unauthorized." };
}

/**
 * REQ08: Administrator shall be able to add a child profile,
 * including ID, name, date of birth, classroom/group, guardian information, contact details, allergy flag, and emergency contact.
 */
export async function createChildAction(
  currentRole: string,
  data: {
    name: string;
    dateOfBirth: string;
    classroomId: string;
    allergyFlag: boolean;
    allergyDetails?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    guardianIds: string[];
    guardianRelationship?: string;
    avatarAssetId?: string;
    avatarUrl?: string;
  }
): Promise<ChildActionResult> {
  if (!canManageChildren(currentRole)) {
    return { success: false, error: "Unauthorized (REQ08). Only Administrator can add child profiles." };
  }

  if (!data.name || !data.dateOfBirth || !data.emergencyContactName || !data.emergencyContactPhone) {
    return { success: false, error: "Child Name, DOB, Emergency Contact Name and Phone are mandatory." };
  }

  const newChild = store.addChild({
    name: data.name.trim(),
    dateOfBirth: data.dateOfBirth,
    classroomId: data.classroomId || "room-butterflies",
    allergyFlag: !!data.allergyFlag,
    allergyDetails: data.allergyDetails?.trim() || undefined,
    emergencyContactName: data.emergencyContactName.trim(),
    emergencyContactPhone: data.emergencyContactPhone.trim(),
    guardianIds: data.guardianIds.length > 0 ? data.guardianIds : ["user-parent-01"],
    guardianRelationship: data.guardianRelationship || "Guardian",
    avatarAssetId: data.avatarAssetId,
    avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
  });

  return { success: true, child: newChild };
}

/**
 * REQ09: Administrator shall be able to update an existing child profile
 */
export async function updateChildAction(
  currentRole: string,
  childId: string,
  updates: Partial<Omit<ChildRecord, "id" | "createdAt">>
): Promise<ChildActionResult> {
  if (!canManageChildren(currentRole)) {
    return { success: false, error: "Unauthorized (REQ09). Only Administrator can update child profiles." };
  }

  const child = store.getChildById(childId);
  if (!child) {
    return { success: false, error: "Child profile not found." };
  }

  const updated = store.updateChild(childId, updates);
  return { success: true, child: updated || undefined };
}

/**
 * REQ08/REQ09: Administrator shall be able to delete a child profile
 */
export async function deleteChildAction(
  currentRole: string,
  childId: string
): Promise<ChildActionResult> {
  if (!canManageChildren(currentRole)) {
    return { success: false, error: "Unauthorized. Only Administrator can remove child profiles." };
  }

  const deleted = store.deleteChild(childId);
  if (!deleted) {
    return { success: false, error: "Child profile not found or could not be removed." };
  }

  return { success: true };
}
