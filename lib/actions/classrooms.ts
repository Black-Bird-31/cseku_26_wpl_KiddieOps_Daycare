/**
 * Classroom Management Actions
 * Full CRUD operations for classrooms with PostgreSQL persistence & store synchronization.
 */

"use server";

import { db } from "../db";
import { classrooms, children, caregiverClassrooms, caregivers, notices, childMediaPosts } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { store, ClassroomRecord } from "../mock-data";
import { safeRevalidate } from "./safe-revalidate";

export interface ClassroomItem extends ClassroomRecord {
  childrenCount?: number;
  caregiversCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassroomActionResult {
  success: boolean;
  classroom?: ClassroomItem;
  classrooms?: ClassroomItem[];
  error?: string;
}

const isUUID = (str?: string): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Get all classrooms with children & caregiver counts
 */
export async function getClassroomsAction(): Promise<ClassroomActionResult> {
  try {
    const dbRooms = await db.select().from(classrooms);
    const dbChildren = await db.select().from(children);
    const dbCaregiverClassrooms = await db.select().from(caregiverClassrooms);

    if (dbRooms.length > 0) {
      const mapped: ClassroomItem[] = dbRooms.map((room) => {
        const roomChildren = dbChildren.filter((c) => c.classroomId === room.id);
        const roomCaregivers = dbCaregiverClassrooms.filter((cc) => cc.classroomId === room.id);

        return {
          id: room.id,
          name: room.name,
          ageRange: room.ageRange || "All Ages",
          childrenCount: roomChildren.length,
          caregiversCount: roomCaregivers.length,
          createdAt: room.createdAt ? new Date(room.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: room.updatedAt ? new Date(room.updatedAt).toISOString() : new Date().toISOString(),
        };
      });

      // Keep store updated
      mapped.forEach((r) => {
        if (!store.getClassroomById(r.id)) {
          store.addClassroom({
            id: r.id,
            name: r.name,
            ageRange: r.ageRange,
          });
        }
      });

      return { success: true, classrooms: mapped };
    }
  } catch (err) {
    console.warn("DB lookup error in getClassroomsAction:", err);
  }

  // Fallback to store
  const storeRooms = store.getClassrooms();
  const allChildren = store.getChildren();
  const mapped: ClassroomItem[] = storeRooms.map((r) => ({
    ...r,
    childrenCount: allChildren.filter((c) => c.classroomId === r.id).length,
    caregiversCount: 1,
  }));

  return { success: true, classrooms: mapped };
}

/**
 * Create a new classroom (Admin only)
 */
export async function createClassroomAction(
  currentRole: string,
  data: { name: string; ageRange?: string }
): Promise<ClassroomActionResult> {
  if (currentRole !== "administrator") {
    return { success: false, error: "Unauthorized. Only Administrator can add classrooms." };
  }

  const cleanName = data.name.trim();
  if (!cleanName) {
    return { success: false, error: "Classroom name is required." };
  }

  let dbRoomRecord: any = null;

  try {
    const [inserted] = await db
      .insert(classrooms)
      .values({
        name: cleanName,
        ageRange: data.ageRange?.trim() || "18m – 3y",
      })
      .returning();

    dbRoomRecord = inserted;
  } catch (err: any) {
    console.warn("DB insert note in createClassroomAction:", err);
    if (err?.code === "23505") {
      return { success: false, error: `A classroom named "${cleanName}" already exists.` };
    }
  }

  const newRoom = store.addClassroom({
    id: dbRoomRecord?.id,
    name: cleanName,
    ageRange: data.ageRange?.trim() || "18m – 3y",
  });

  safeRevalidate("/admin/classrooms");
  safeRevalidate("/admin");
  safeRevalidate("/caregiver");
  return { success: true, classroom: { ...newRoom, childrenCount: 0, caregiversCount: 0 } };
}

/**
 * Update an existing classroom (Admin only)
 */
export async function updateClassroomAction(
  currentRole: string,
  classroomId: string,
  updates: { name?: string; ageRange?: string }
): Promise<ClassroomActionResult> {
  if (currentRole !== "administrator") {
    return { success: false, error: "Unauthorized. Only Administrator can update classrooms." };
  }

  if (isUUID(classroomId)) {
    try {
      const patch: any = { updatedAt: new Date() };
      if (updates.name) patch.name = updates.name.trim();
      if (updates.ageRange !== undefined) patch.ageRange = updates.ageRange.trim();

      await db.update(classrooms).set(patch).where(eq(classrooms.id, classroomId));
    } catch (err) {
      console.warn("DB update note in updateClassroomAction:", err);
    }
  }

  const updated = store.updateClassroom(classroomId, {
    name: updates.name?.trim(),
    ageRange: updates.ageRange?.trim(),
  });

  safeRevalidate("/admin/classrooms");
  safeRevalidate("/admin");
  safeRevalidate("/caregiver");
  return { success: true, classroom: updated ? { ...updated } : undefined };
}

/**
 * Delete a classroom (Admin only)
 */
export async function deleteClassroomAction(
  currentRole: string,
  classroomId: string
): Promise<ClassroomActionResult> {
  if (currentRole !== "administrator") {
    return { success: false, error: "Unauthorized. Only Administrator can delete classrooms." };
  }

  if (isUUID(classroomId)) {
    try {
      // 1. Unassign children from this room
      await db.update(children).set({ classroomId: null }).where(eq(children.classroomId, classroomId));

      // 2. Remove caregiver classroom assignments
      await db.delete(caregiverClassrooms).where(eq(caregiverClassrooms.classroomId, classroomId));

      // 3. Unassign caregivers primary room
      await db
        .update(caregivers)
        .set({ primaryClassroomId: null })
        .where(eq(caregivers.primaryClassroomId, classroomId));

      // 4. Set notices classroomId to null
      await db.update(notices).set({ classroomId: null }).where(eq(notices.classroomId, classroomId));

      // 5. Set child media posts classroomId to null
      await db.update(childMediaPosts).set({ classroomId: null }).where(eq(childMediaPosts.classroomId, classroomId));

      // 6. Delete classroom record
      await db.delete(classrooms).where(eq(classrooms.id, classroomId));
    } catch (err) {
      console.warn("DB delete note in deleteClassroomAction:", err);
    }
  }

  store.deleteClassroom(classroomId);

  safeRevalidate("/admin/classrooms");
  safeRevalidate("/admin");
  safeRevalidate("/caregiver");
  return { success: true };
}
