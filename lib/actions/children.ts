/**
 * Child Management Actions (REQ08, REQ09, REQ10)
 * Synchronizes with PostgreSQL database and maintains in-memory store compatibility.
 */

"use server";

import { store, ChildRecord } from "../mock-data";
import { canManageChildren, canGuardianViewChild } from "../auth";
import { db } from "../db";
import { children, classrooms, mediaAssets, childGuardians, users, medicalRecords } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { safeRevalidate } from "./safe-revalidate";

export interface ChildActionResult {
  success: boolean;
  child?: ChildRecord;
  children?: ChildRecord[];
  error?: string;
}

const isUUID = (str?: string): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Get all children (Admin and Caregivers) from PostgreSQL
 */
export async function getAllChildrenAction(currentRole: string): Promise<ChildActionResult> {
  if (currentRole !== "administrator" && currentRole !== "caregiver") {
    return { success: false, error: "Unauthorized. Staff role required to view all children." };
  }

  try {
    const rawChildren = await db
      .select({
        child: children,
        room: classrooms,
        avatar: mediaAssets,
      })
      .from(children)
      .leftJoin(classrooms, eq(children.classroomId, classrooms.id))
      .leftJoin(mediaAssets, eq(children.avatarAssetId, mediaAssets.id));

    if (rawChildren.length > 0) {
      // Fetch guardians for these children
      const allGuardians = await db.select().from(childGuardians);

      const mapped: ChildRecord[] = rawChildren.map(({ child, room, avatar }) => {
        const guardians = allGuardians.filter((g) => g.childId === child.id);
        return {
          id: child.id,
          name: child.name,
          dateOfBirth: child.dateOfBirth,
          classroomId: child.classroomId || "",
          classroomName: room?.name || "General Classroom",
          allergyFlag: child.allergyFlag,
          emergencyContactName: child.emergencyContactName || "",
          emergencyContactPhone: child.emergencyContactPhone || "",
          avatarAssetId: child.avatarAssetId || undefined,
          avatarUrl: avatar?.secureUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
          guardianIds: guardians.map((g) => g.userId),
          guardianRelationship: guardians[0]?.relationshipLabel || "Guardian",
          createdAt: child.createdAt ? new Date(child.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: child.updatedAt ? new Date(child.updatedAt).toISOString() : new Date().toISOString(),
        };
      });

      // Keep store synchronized
      mapped.forEach((c) => {
        if (!store.getChildById(c.id)) {
          store.addChild(c);
        }
      });

      return { success: true, children: mapped };
    }
  } catch (err) {
    console.warn("Falling back to in-memory store for getAllChildrenAction:", err);
  }

  return { success: true, children: store.getChildren() };
}

/**
 * REQ10: Parent/Guardian shall be able to view the profile of their own child ONLY.
 */
export async function getChildrenForGuardianAction(
  currentRole: string,
  guardianUserId: string
): Promise<ChildActionResult> {
  if (currentRole !== "parent" && currentRole !== "administrator") {
    return { success: false, error: "Unauthorized role for guardian child access." };
  }

  if (isUUID(guardianUserId)) {
    try {
      const links = await db
        .select()
        .from(childGuardians)
        .where(eq(childGuardians.userId, guardianUserId));

      if (links.length > 0) {
        const childIds = links.map((l) => l.childId);
        const rawChildren = await db
          .select({
            child: children,
            room: classrooms,
            avatar: mediaAssets,
          })
          .from(children)
          .leftJoin(classrooms, eq(children.classroomId, classrooms.id))
          .leftJoin(mediaAssets, eq(children.avatarAssetId, mediaAssets.id))
          .where(inArray(children.id, childIds));

        if (rawChildren.length > 0) {
          const mapped: ChildRecord[] = rawChildren.map(({ child, room, avatar }) => ({
            id: child.id,
            name: child.name,
            dateOfBirth: child.dateOfBirth,
            classroomId: child.classroomId || "",
            classroomName: room?.name,
            allergyFlag: child.allergyFlag,
            emergencyContactName: child.emergencyContactName || "",
            emergencyContactPhone: child.emergencyContactPhone || "",
            avatarUrl: avatar?.secureUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
            guardianIds: [guardianUserId],
            createdAt: child.createdAt ? new Date(child.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: child.updatedAt ? new Date(child.updatedAt).toISOString() : new Date().toISOString(),
          }));
          return { success: true, children: mapped };
        }
      }
    } catch (err) {
      console.warn("Falling back to in-memory store for getChildrenForGuardianAction:", err);
    }
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
  if (currentRole === "administrator" || currentRole === "caregiver") {
    if (isUUID(childId)) {
      try {
        const dbChild = await db.select().from(children).where(eq(children.id, childId)).limit(1);
        if (dbChild[0]) {
          const c = dbChild[0];
          return {
            success: true,
            child: {
              id: c.id,
              name: c.name,
              dateOfBirth: c.dateOfBirth,
              classroomId: c.classroomId || "",
              allergyFlag: c.allergyFlag,
              emergencyContactName: c.emergencyContactName || "",
              emergencyContactPhone: c.emergencyContactPhone || "",
              guardianIds: [],
              createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
            },
          };
        }
      } catch {}
    }
    const child = store.getChildById(childId);
    if (!child) return { success: false, error: "Child profile not found." };
    return { success: true, child };
  }

  if (currentRole === "parent") {
    const isAuthorized = canGuardianViewChild(currentUserId, childId);
    if (!isAuthorized) {
      // Also check DB link
      if (isUUID(childId) && isUUID(currentUserId)) {
        try {
          const dbLink = await db
            .select()
            .from(childGuardians)
            .where(eq(childGuardians.childId, childId));
          const hasDbAccess = dbLink.some((l) => l.userId === currentUserId);
          if (!hasDbAccess) {
            return {
              success: false,
              error: "Access Denied (REQ10): You are only authorized to view your own child's profile.",
            };
          }
        } catch {
          return {
            success: false,
            error: "Access Denied (REQ10): You are only authorized to view your own child's profile.",
          };
        }
      } else {
        return {
          success: false,
          error: "Access Denied (REQ10): You are only authorized to view your own child's profile.",
        };
      }
    }
    const child = store.getChildById(childId);
    return { success: true, child: child || undefined };
  }

  return { success: false, error: "Unauthorized." };
}

/**
 * REQ08: Administrator shall be able to add a child profile
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

  let dbChildId: string | undefined = undefined;

  // Insert into PostgreSQL
  try {
    let targetClassroomId: string | null = null;
    if (data.classroomId && isUUID(data.classroomId)) {
      const roomCheck = await db.select().from(classrooms).where(eq(classrooms.id, data.classroomId)).limit(1);
      if (roomCheck[0]) {
        targetClassroomId = roomCheck[0].id;
      }
    }
    if (!targetClassroomId) {
      const defRoom = await db.select().from(classrooms).limit(1);
      targetClassroomId = defRoom[0]?.id || null;
    }

    const [newDbChild] = await db
      .insert(children)
      .values({
        name: data.name.trim(),
        dateOfBirth: data.dateOfBirth,
        classroomId: targetClassroomId,
        allergyFlag: !!data.allergyFlag,
        emergencyContactName: data.emergencyContactName.trim(),
        emergencyContactPhone: data.emergencyContactPhone.trim(),
      })
      .returning();

    if (newDbChild) {
      dbChildId = newDbChild.id;

      // Also upsert initial medical records if allergy specified
      if (data.allergyFlag || data.allergyDetails) {
        try {
          await db
            .insert(medicalRecords)
            .values({
              childId: newDbChild.id,
              allergies: data.allergyDetails?.trim() || "Known allergy registered by Admin",
              hasSevereAllergy: !!data.allergyFlag,
              specialCareInstructions: "Follow classroom emergency care protocol",
            })
            .onConflictDoUpdate({
              target: [medicalRecords.childId],
              set: {
                allergies: data.allergyDetails?.trim() || "Known allergy registered by Admin",
                hasSevereAllergy: !!data.allergyFlag,
                updatedAt: new Date(),
              },
            });
        } catch {}
      }

      // Link guardians if valid UUIDs exist
      if (data.guardianIds && data.guardianIds.length > 0) {
        for (const gId of data.guardianIds) {
          try {
            const userCheck = await db.select().from(users).where(eq(users.id, gId)).limit(1);
            if (userCheck[0]) {
              await db.insert(childGuardians).values({
                childId: newDbChild.id,
                userId: gId,
                relationshipLabel: data.guardianRelationship || "Guardian",
              }).onConflictDoNothing();
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn("Direct DB insert note in createChildAction:", err);
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

  safeRevalidate("/admin/children");
  safeRevalidate("/admin");
  safeRevalidate("/caregiver");
  safeRevalidate("/parent");
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

  if (isUUID(childId)) {
    try {
      const patch: any = { updatedAt: new Date() };
      if (updates.name) patch.name = updates.name.trim();
      if (updates.dateOfBirth) patch.dateOfBirth = updates.dateOfBirth;
      if (updates.classroomId && isUUID(updates.classroomId)) {
        const roomCheck = await db.select().from(classrooms).where(eq(classrooms.id, updates.classroomId)).limit(1);
        if (roomCheck[0]) patch.classroomId = updates.classroomId;
      }
      if (updates.allergyFlag !== undefined) patch.allergyFlag = updates.allergyFlag;
      if (updates.emergencyContactName) patch.emergencyContactName = updates.emergencyContactName.trim();
      if (updates.emergencyContactPhone) patch.emergencyContactPhone = updates.emergencyContactPhone.trim();

      await db.update(children).set(patch).where(eq(children.id, childId));

      if (updates.allergyFlag !== undefined || updates.allergyDetails !== undefined) {
        try {
          await db
            .insert(medicalRecords)
            .values({
              childId: childId,
              allergies: updates.allergyDetails?.trim() || (updates.allergyFlag ? "Known allergy" : null),
              hasSevereAllergy: !!updates.allergyFlag,
            })
            .onConflictDoUpdate({
              target: [medicalRecords.childId],
              set: {
                allergies: updates.allergyDetails?.trim() || (updates.allergyFlag ? "Known allergy" : null),
                hasSevereAllergy: !!updates.allergyFlag,
                updatedAt: new Date(),
              },
            });
        } catch {}
      }
    } catch (err) {
      console.warn("DB update note in updateChildAction:", err);
    }
  }

  const child = store.getChildById(childId);
  if (!child) {
    // Check if in DB
    if (isUUID(childId)) {
      try {
        const dbChild = await db.select().from(children).where(eq(children.id, childId)).limit(1);
        if (dbChild[0]) {
          return {
            success: true,
            child: {
              id: dbChild[0].id,
              name: updates.name || dbChild[0].name,
              dateOfBirth: updates.dateOfBirth || dbChild[0].dateOfBirth,
              classroomId: updates.classroomId || dbChild[0].classroomId || "",
              allergyFlag: updates.allergyFlag ?? dbChild[0].allergyFlag,
              allergyDetails: updates.allergyDetails,
              emergencyContactName: updates.emergencyContactName || dbChild[0].emergencyContactName || "",
              emergencyContactPhone: updates.emergencyContactPhone || dbChild[0].emergencyContactPhone || "",
              guardianIds: updates.guardianIds || [],
              createdAt: dbChild[0].createdAt ? new Date(dbChild[0].createdAt).toISOString() : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        }
      } catch {}
    }
    return { success: false, error: "Child profile not found." };
  }

  const updated = store.updateChild(childId, updates);
  safeRevalidate("/admin/children");
  safeRevalidate("/admin");
  safeRevalidate("/caregiver");
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

  let dbDeleted = false;
  if (isUUID(childId)) {
    try {
      const res = await db.delete(children).where(eq(children.id, childId)).returning();
      if (res && res.length > 0) {
        dbDeleted = true;
      }
    } catch (err) {
      console.warn("DB delete note in deleteChildAction:", err);
    }
  }

  const deleted = store.deleteChild(childId);
  if (!deleted && !dbDeleted) {
    return { success: false, error: "Child profile not found or could not be removed." };
  }

  safeRevalidate("/admin/children");
  safeRevalidate("/admin");
  safeRevalidate("/caregiver");
  return { success: true };
}
