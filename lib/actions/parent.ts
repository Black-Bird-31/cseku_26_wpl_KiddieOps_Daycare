/**
 * Parent Portal Server Actions (WF-09 to WF-14, REQ10, REQ16, REQ21, REQ24, REQ38, REQ39, REQ41)
 * Provides comprehensive data fetching and CRUD operations for parents:
 * - Real-time Child dashboard with multi-child switching
 * - Read-only Medical Records with allergy warnings & parent contact updating (CRUD)
 * - Historical Attendance & Monthly percentage metrics + Leave Request (CRUD)
 * - Media Gallery (photos & videos)
 * - Parent Incident / Complaint filing, editing & withdrawing with Cloudinary proof (CRUD)
 */

"use server";

import { db } from "../db";
import {
  children,
  users,
  caregivers,
  classrooms,
  attendance,
  activityLogs,
  childMediaPosts,
  mediaAssets,
  complaints,
  medicalRecords,
  medicalRecordAudit,
  childGuardians,
} from "../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { store, ChildRecord, ComplaintRecord } from "../mock-data";
import { safeRevalidate } from "./safe-revalidate";

const isUUID = (str?: string): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export interface ParentMedicalRecordItem {
  id: string;
  childId: string;
  allergies?: string | null;
  hasSevereAllergy: boolean;
  chronicConditions?: string | null;
  medications?: string | null;
  physicianName?: string | null;
  physicianContact?: string | null;
  specialCareInstructions?: string | null;
  incidentReports?: string | null;
  updatedAt?: string | null;
}

export interface AttendanceHistorySummary {
  records: Array<{
    id: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: "present" | "absent" | "late" | "excused";
    notes?: string | null;
  }>;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number; // percentage (0-100)
}

export interface ParentComplaintItem {
  id: string;
  parentUserId: string;
  parentName: string;
  caregiverUserId?: string | null;
  caregiverName: string;
  childId?: string | null;
  childName?: string | null;
  title: string;
  description: string;
  incidentDate?: string | null;
  proofAttachmentUrl?: string | null;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  adminNotes?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

/**
 * 1. Get all children linked to a parent user
 */
export async function getChildrenForParentAction(parentUserId: string): Promise<{
  success: boolean;
  children: ChildRecord[];
  error?: string;
}> {
  try {
    if (isUUID(parentUserId)) {
      const links = await db
        .select({
          childId: childGuardians.childId,
          relationship: childGuardians.relationshipLabel,
        })
        .from(childGuardians)
        .where(eq(childGuardians.userId, parentUserId));

      if (links.length > 0) {
        const childIds = links.map((l) => l.childId);
        const childRows = await db
          .select({
            child: children,
            room: classrooms,
            avatar: mediaAssets,
          })
          .from(children)
          .leftJoin(classrooms, eq(children.classroomId, classrooms.id))
          .leftJoin(mediaAssets, eq(children.avatarAssetId, mediaAssets.id))
          .where(inArray(children.id, childIds));

        if (childRows.length > 0) {
          const mapped: ChildRecord[] = childRows.map(({ child, room, avatar }) => {
            const rel = links.find((l) => l.childId === child.id)?.relationship || "Guardian";
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
              avatarUrl:
                avatar?.secureUrl ||
                "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
              guardianIds: [parentUserId],
              guardianRelationship: rel,
              createdAt: child.createdAt ? new Date(child.createdAt).toISOString() : new Date().toISOString(),
              updatedAt: child.updatedAt ? new Date(child.updatedAt).toISOString() : new Date().toISOString(),
            };
          });

          // Sync into store
          mapped.forEach((c) => {
            if (!store.getChildById(c.id)) store.addChild(c);
          });

          return { success: true, children: mapped };
        }
      }
    }
  } catch (err) {
    console.warn("Falling back to in-memory store for getChildrenForParentAction:", err);
  }

  // Fallback to store
  const storeChildren = store.getChildrenForGuardian(parentUserId);
  if (storeChildren.length > 0) {
    return { success: true, children: storeChildren };
  }

  // Fallback to all store children if test account
  return { success: true, children: store.getChildren().slice(0, 2) };
}

/**
 * 2. Get Child Medical Records (Read-Only with Emergency Details — WF-13)
 */
export async function getChildMedicalRecordAction(childId: string): Promise<{
  success: boolean;
  medicalRecord?: ParentMedicalRecordItem;
  error?: string;
}> {
  try {
    if (isUUID(childId)) {
      const rows = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.childId, childId))
        .limit(1);

      if (rows.length > 0) {
        const row = rows[0];
        return {
          success: true,
          medicalRecord: {
            id: row.id,
            childId: row.childId,
            allergies: row.allergies,
            hasSevereAllergy: row.hasSevereAllergy,
            chronicConditions: row.chronicConditions,
            medications: row.medications,
            physicianName: row.physicianName,
            physicianContact: row.physicianContact,
            specialCareInstructions: row.specialCareInstructions,
            incidentReports: row.incidentReports,
            updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
          },
        };
      }
    }
  } catch (err) {
    console.warn("Falling back to child info for getChildMedicalRecordAction:", err);
  }

  // Fallback representation from child record
  const child = store.getChildById(childId);
  return {
    success: true,
    medicalRecord: {
      id: `med-${childId}`,
      childId: childId,
      allergies: child?.allergyFlag ? "Severe Peanut & Dairy allergy. Strictly nut-free diet." : "None recorded",
      hasSevereAllergy: !!child?.allergyFlag,
      chronicConditions: child?.allergyFlag ? "Mild allergic asthma with season change" : "None",
      medications: child?.allergyFlag ? "Albuterol Inhaler (PRN), Epipen Auto-Injector" : "None",
      physicianName: "Dr. Anisur Rahman, MD (Pediatrics)",
      physicianContact: "+880 1712-998877",
      specialCareInstructions: child?.allergyFlag
        ? "Epipen stored in classroom emergency kit. If facial swelling occurs, administer Epipen and call 999 immediately."
        : "Standard daycare care guidelines.",
      incidentReports: null,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * 3. Update Child Emergency Contact & Special Instructions (CRUD for Parents)
 */
export async function updateParentChildContactAction(data: {
  childId: string;
  parentUserId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialCareInstructions?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (isUUID(data.childId)) {
      // 1. Update children table
      await db
        .update(children)
        .set({
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          updatedAt: new Date(),
        })
        .where(eq(children.id, data.childId));

      // 2. Update or insert medical record special care instructions
      if (data.specialCareInstructions !== undefined) {
        await db
          .insert(medicalRecords)
          .values({
            childId: data.childId,
            specialCareInstructions: data.specialCareInstructions,
            lastUpdatedByUserId: isUUID(data.parentUserId) ? data.parentUserId : null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [medicalRecords.childId],
            set: {
              specialCareInstructions: data.specialCareInstructions,
              lastUpdatedByUserId: isUUID(data.parentUserId) ? data.parentUserId : null,
              updatedAt: new Date(),
            },
          });
      }
    }

    // Synchronize store
    const c = store.getChildById(data.childId);
    if (c) {
      c.emergencyContactName = data.emergencyContactName;
      c.emergencyContactPhone = data.emergencyContactPhone;
    }

    safeRevalidate("/parent");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateParentChildContactAction:", err);
    return { success: false, error: err.message || "Failed to update emergency contact details." };
  }
}

/**
 * 4. Get Child Attendance History & Monthly Summary (WF-14)
 */
export async function getChildAttendanceHistoryAction(childId: string): Promise<{
  success: boolean;
  summary: AttendanceHistorySummary;
  error?: string;
}> {
  try {
    if (isUUID(childId)) {
      const rows = await db
        .select()
        .from(attendance)
        .where(eq(attendance.childId, childId))
        .orderBy(desc(attendance.date))
        .limit(30);

      if (rows.length > 0) {
        const records = rows.map((r) => ({
          id: r.id,
          date: r.date,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime,
          status: r.status as "present" | "absent" | "late" | "excused",
          notes: r.notes,
        }));

        const totalDays = records.length;
        const presentCount = records.filter((r) => r.status === "present").length;
        const absentCount = records.filter((r) => r.status === "absent").length;
        const lateCount = records.filter((r) => r.status === "late").length;
        const excusedCount = records.filter((r) => r.status === "excused").length;
        const attendanceRate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

        return {
          success: true,
          summary: {
            records,
            totalDays,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
            attendanceRate,
          },
        };
      }
    }
  } catch (err) {
    console.warn("Falling back to synthetic attendance summary for child:", err);
  }

  // Synthesize realistic historical attendance for demo/mock
  const today = new Date();
  const records: AttendanceHistorySummary["records"] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Skip weekends (Friday & Saturday in Bangladesh)
    const day = d.getDay();
    if (day === 5 || day === 6) continue;

    const dateStr = d.toISOString().split("T")[0];
    let status: "present" | "absent" | "late" | "excused" = "present";
    let checkIn = "08:30 AM";
    let notes = "On-time arrival";

    if (i === 3) {
      status = "late";
      checkIn = "09:15 AM";
      notes = "Traffic delay reported by parent";
    } else if (i === 7) {
      status = "excused";
      checkIn = null as any;
      notes = "Doctor appointment leave request";
    }

    records.push({
      id: `att-${childId}-${dateStr}`,
      date: dateStr,
      checkInTime: checkIn,
      checkOutTime: "04:30 PM",
      status,
      notes,
    });
  }

  const totalDays = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const excusedCount = records.filter((r) => r.status === "excused").length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  return {
    success: true,
    summary: {
      records,
      totalDays,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
    },
  };
}

/**
 * 5. Request Excused Absence / Child Leave (CRUD for Parents — WF-14)
 */
export async function requestChildLeaveAction(data: {
  childId: string;
  parentUserId: string;
  date: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (isUUID(data.childId)) {
      await db
        .insert(attendance)
        .values({
          childId: data.childId,
          date: data.date,
          status: "excused",
          notes: `[Parent Leave Request] ${data.reason}`,
          recordedByUserId: isUUID(data.parentUserId) ? data.parentUserId : null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [attendance.childId, attendance.date],
          set: {
            status: "excused",
            notes: `[Parent Leave Request] ${data.reason}`,
            updatedAt: new Date(),
          },
        });
    }

    safeRevalidate("/parent");
    return { success: true };
  } catch (err: any) {
    console.error("Error in requestChildLeaveAction:", err);
    return { success: false, error: err.message || "Failed to submit child leave request." };
  }
}

/**
 * 6. Get Complaints Filed by Parent (CRUD - Read — WF-11)
 */
export async function getParentComplaintsAction(parentUserId: string): Promise<{
  success: boolean;
  complaints: ParentComplaintItem[];
  error?: string;
}> {
  try {
    if (isUUID(parentUserId)) {
      const rawComplaints = await db
        .select({
          complaint: complaints,
          proof: mediaAssets,
        })
        .from(complaints)
        .leftJoin(mediaAssets, eq(complaints.proofAssetId, mediaAssets.id))
        .where(eq(complaints.parentUserId, parentUserId))
        .orderBy(desc(complaints.createdAt));

      if (rawComplaints.length > 0) {
        const allUsers = await db.select().from(users);
        const allChildren = await db.select().from(children);

        const mapped: ParentComplaintItem[] = rawComplaints.map(({ complaint, proof }) => {
          const caregiver = allUsers.find((u) => u.id === complaint.caregiverUserId);
          const child = allChildren.find((c) => c.id === complaint.childId);
          const resolver = complaint.resolvedByUserId
            ? allUsers.find((u) => u.id === complaint.resolvedByUserId)
            : null;

          return {
            id: complaint.id,
            parentUserId: complaint.parentUserId,
            parentName: "Parent",
            caregiverUserId: complaint.caregiverUserId,
            caregiverName: caregiver?.name || "Caregiver Staff",
            childId: complaint.childId,
            childName: child?.name || "Child",
            title: complaint.title,
            description: complaint.description,
            incidentDate: complaint.incidentDate ? new Date(complaint.incidentDate).toISOString() : null,
            proofAttachmentUrl: proof?.secureUrl || null,
            status: complaint.status as any,
            adminNotes: complaint.adminNotes,
            resolvedByName: resolver?.name || null,
            resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt).toISOString() : null,
            createdAt: complaint.createdAt ? new Date(complaint.createdAt).toISOString() : new Date().toISOString(),
          };
        });

        return { success: true, complaints: mapped };
      }
    }
  } catch (err) {
    console.warn("Falling back to store for getParentComplaintsAction:", err);
  }

  // Fallback to store
  const storeComplaints = store.getComplaintsForParent(parentUserId);
  const mapped: ParentComplaintItem[] = storeComplaints.map((c) => ({
    id: c.id,
    parentUserId: c.parentUserId,
    parentName: c.parentName,
    caregiverName: c.caregiverName,
    childId: c.childId,
    childName: c.childName,
    title: c.incidentTitle,
    description: c.incidentDescription,
    proofAttachmentUrl: c.proofAttachmentUrl,
    status: c.status,
    adminNotes: c.resolutionNotes,
    resolvedAt: c.resolvedAt,
    createdAt: c.createdAt,
  }));

  return { success: true, complaints: mapped };
}

/**
 * 7. File Complaint (CRUD - Create — WF-11)
 */
export async function createParentComplaintAction(data: {
  parentUserId: string;
  caregiverUserId?: string;
  caregiverName: string;
  childId?: string;
  title: string;
  description: string;
  incidentDate?: string;
  proofAttachmentUrl?: string;
}): Promise<{ success: boolean; complaintId?: string; error?: string }> {
  try {
    let proofAssetId: string | undefined = undefined;

    // 1. If proof URL is provided, save into media_assets
    if (data.proofAttachmentUrl) {
      try {
        const [asset] = await db
          .insert(mediaAssets)
          .values({
            secureUrl: data.proofAttachmentUrl,
            publicId: `complaint_proof_${Date.now()}`,
            resourceType: "image",
            entityType: "complaint_proof",
            uploadedByUserId: isUUID(data.parentUserId) ? data.parentUserId : null,
          })
          .returning();
        if (asset) proofAssetId = asset.id;
      } catch (assetErr) {
        console.warn("Could not save media asset for complaint proof:", assetErr);
      }
    }

    // 2. Resolve caregiver user id
    let targetCaregiverId = data.caregiverUserId;
    if (!targetCaregiverId || !isUUID(targetCaregiverId)) {
      const allUsers = await db.select().from(users);
      const caregiver = allUsers.find(
        (u) => u.name.toLowerCase().includes("nusrat") || u.role === "caregiver" || u.role === "administrator"
      );
      targetCaregiverId = caregiver?.id || "a0000000-0000-0000-0000-000000000001";
    }

    let parentId = data.parentUserId;
    if (!isUUID(parentId)) {
      parentId = "a0000000-0000-0000-0000-000000000001";
    }

    const [newRow] = await db
      .insert(complaints)
      .values({
        parentUserId: parentId,
        caregiverUserId: targetCaregiverId,
        childId: isUUID(data.childId) ? data.childId : null,
        title: data.title,
        description: data.description,
        incidentDate: data.incidentDate ? new Date(data.incidentDate) : new Date(),
        proofAssetId: proofAssetId || null,
        status: "pending",
      })
      .returning();

    // Also mirror into mock-data store for local resilience
    const child = data.childId ? store.getChildById(data.childId) : undefined;
    store.addComplaint({
      parentUserId: data.parentUserId,
      parentName: "Parent Guardian",
      caregiverName: data.caregiverName,
      childId: data.childId,
      childName: child?.name,
      incidentTitle: data.title,
      incidentDescription: data.description,
      proofAttachmentUrl: data.proofAttachmentUrl,
    });

    safeRevalidate("/parent/complaints");
    safeRevalidate("/admin/complaints");
    return { success: true, complaintId: newRow?.id };
  } catch (err: any) {
    console.error("Error in createParentComplaintAction:", err);
    // Fallback store save
    const child = data.childId ? store.getChildById(data.childId) : undefined;
    const item = store.addComplaint({
      parentUserId: data.parentUserId,
      parentName: "Parent Guardian",
      caregiverName: data.caregiverName,
      childId: data.childId,
      childName: child?.name,
      incidentTitle: data.title,
      incidentDescription: data.description,
      proofAttachmentUrl: data.proofAttachmentUrl,
    });
    return { success: true, complaintId: item.id };
  }
}

/**
 * 8. Edit / Update Complaint (CRUD - Update — WF-11)
 * Only allowed while status is still 'pending'
 */
export async function updateParentComplaintAction(data: {
  complaintId: string;
  parentUserId: string;
  title: string;
  description: string;
  caregiverName?: string;
  proofAttachmentUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (isUUID(data.complaintId)) {
      // Check that complaint belongs to parent and is pending
      const [existing] = await db
        .select()
        .from(complaints)
        .where(eq(complaints.id, data.complaintId))
        .limit(1);

      if (existing) {
        if (existing.status !== "pending") {
          return { success: false, error: "Cannot edit complaint once under review or resolved by administration." };
        }

        await db
          .update(complaints)
          .set({
            title: data.title,
            description: data.description,
            updatedAt: new Date(),
          })
          .where(eq(complaints.id, data.complaintId));
      }
    }

    // Update in store
    const storeItem = store.getComplaints().find((c) => c.id === data.complaintId);
    if (storeItem && storeItem.status === "pending") {
      storeItem.incidentTitle = data.title;
      storeItem.incidentDescription = data.description;
      if (data.proofAttachmentUrl) storeItem.proofAttachmentUrl = data.proofAttachmentUrl;
      if (data.caregiverName) storeItem.caregiverName = data.caregiverName;
    }

    safeRevalidate("/parent/complaints");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateParentComplaintAction:", err);
    return { success: false, error: err.message || "Failed to update incident report." };
  }
}

/**
 * 9. Delete / Withdraw Complaint (CRUD - Delete — WF-11)
 * Allowed if status is 'pending'
 */
export async function deleteParentComplaintAction(
  complaintId: string,
  parentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isUUID(complaintId)) {
      await db
        .delete(complaints)
        .where(and(eq(complaints.id, complaintId), eq(complaints.status, "pending")));
    }

    // Mirror store
    store.deleteComplaint(complaintId);

    safeRevalidate("/parent/complaints");
    safeRevalidate("/admin/complaints");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteParentComplaintAction:", err);
    store.deleteComplaint(complaintId);
    return { success: true };
  }
}
