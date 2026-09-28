"use server";

import { db } from "../db";
import { 
  users, 
  classrooms, 
  children, 
  complaints, 
  notices, 
  mediaAssets 
} from "../db/schema";
import { eq, desc, ne, count } from "drizzle-orm";
import { safeRevalidate } from "./safe-revalidate";

export interface AdminComplaintItem {
  id: string;
  parentUserId: string;
  parentName: string;
  parentEmail?: string;
  caregiverUserId: string;
  caregiverName: string;
  childId: string | null;
  childName?: string;
  incidentTitle: string;
  incidentDescription: string;
  proofAttachmentUrl?: string | null;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  adminNotes: string | null;
  resolvedByName?: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AdminNoticeItem {
  id: string;
  title: string;
  content: string;
  priority: "normal" | "urgent" | "holiday";
  targetAudience: "all" | "caregivers" | "parents";
  authorName: string;
  authorRole?: "administrator" | "caregiver" | "parent" | string;
  classroomId: string | null;
  classroomName?: string;
  publishedAt: string;
}

export interface AdminDashboardData {
  success: boolean;
  error?: string;
  stats: {
    totalChildren: number;
    totalStaff: number;
    totalClassrooms: number;
    pendingIncidents: number;
  };
  complaints: AdminComplaintItem[];
  notices: AdminNoticeItem[];
}

/**
 * Get aggregated statistics, recent complaints, and active notices for Admin Dashboard
 */
export async function getAdminDashboardStatsAction(): Promise<AdminDashboardData> {
  try {
    // 1. Live counts from PostgreSQL
    const totalChildrenRes = await db.select({ val: count() }).from(children);
    const totalStaffRes = await db.select({ val: count() }).from(users);
    const totalClassroomsRes = await db.select({ val: count() }).from(classrooms);
    const pendingIncidentsRes = await db
      .select({ val: count() })
      .from(complaints)
      .where(ne(complaints.status, "resolved"));

    // 2. Fetch recent complaints
    const complaintsList = await getAdminComplaintsAction();

    // 3. Fetch notices
    const noticesList = await getAdminNoticesAction();

    return {
      success: true,
      stats: {
        totalChildren: totalChildrenRes[0]?.val ?? 0,
        totalStaff: totalStaffRes[0]?.val ?? 0,
        totalClassrooms: totalClassroomsRes[0]?.val ?? 0,
        pendingIncidents: pendingIncidentsRes[0]?.val ?? 0,
      },
      complaints: complaintsList.complaints || [],
      notices: noticesList.notices || [],
    };
  } catch (error: any) {
    console.error("Error in getAdminDashboardStatsAction:", error);
    return {
      success: false,
      error: error.message || "Failed to load admin stats from database.",
      stats: { totalChildren: 0, totalStaff: 0, totalClassrooms: 0, pendingIncidents: 0 },
      complaints: [],
      notices: [],
    };
  }
}

/**
 * Get all complaints with parent, caregiver, and child information from PostgreSQL
 */
export async function getAdminComplaintsAction(): Promise<{
  success: boolean;
  error?: string;
  complaints: AdminComplaintItem[];
}> {
  try {
    const rawComplaints = await db
      .select({
        complaint: complaints,
        proof: mediaAssets,
      })
      .from(complaints)
      .leftJoin(mediaAssets, eq(complaints.proofAssetId, mediaAssets.id))
      .orderBy(desc(complaints.createdAt));

    // Fetch related users & children in bulk
    const allUsers = await db.select().from(users);
    const allChildren = await db.select().from(children);

    const mapped: AdminComplaintItem[] = rawComplaints.map(({ complaint, proof }) => {
      const parent = allUsers.find((u) => u.id === complaint.parentUserId);
      const caregiver = allUsers.find((u) => u.id === complaint.caregiverUserId);
      const child = allChildren.find((c) => c.id === complaint.childId);
      const resolver = complaint.resolvedByUserId
        ? allUsers.find((u) => u.id === complaint.resolvedByUserId)
        : null;

      return {
        id: complaint.id,
        parentUserId: complaint.parentUserId,
        parentName: parent?.name || "Parent",
        parentEmail: parent?.email,
        caregiverUserId: complaint.caregiverUserId,
        caregiverName: caregiver?.name || "Caregiver Staff",
        childId: complaint.childId,
        childName: child?.name || "Enrolled Child",
        incidentTitle: complaint.title,
        incidentDescription: complaint.description,
        proofAttachmentUrl: proof?.secureUrl || null,
        status: complaint.status as any,
        adminNotes: complaint.adminNotes,
        resolvedByName: resolver?.name || null,
        resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt).toISOString() : null,
        createdAt: complaint.createdAt ? new Date(complaint.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return { success: true, complaints: mapped };
  } catch (error: any) {
    console.error("Error in getAdminComplaintsAction:", error);
    return { success: false, error: error.message || "Failed to load complaints.", complaints: [] };
  }
}

/**
 * Update complaint resolution and status in PostgreSQL
 */
export async function resolveComplaintAction(
  complaintId: string,
  status: "pending" | "under_review" | "resolved" | "dismissed",
  adminNotes: string,
  resolvedByUserId?: string
): Promise<{ success: boolean; error?: string; complaint?: AdminComplaintItem }> {
  try {
    let resolverId = resolvedByUserId;
    if (!resolverId) {
      const u = await db.select().from(users).where(eq(users.role, "administrator")).limit(1);
      resolverId = u[0]?.id;
    }

    const isResolved = status === "resolved" || status === "dismissed";

    const [updated] = await db
      .update(complaints)
      .set({
        status,
        adminNotes: adminNotes.trim(),
        resolvedByUserId: isResolved ? resolverId : null,
        resolvedAt: isResolved ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(complaints.id, complaintId))
      .returning();

    if (!updated) {
      return { success: false, error: "Complaint record not found in database." };
    }

    safeRevalidate("/admin");
    safeRevalidate("/admin/complaints");
    return { success: true };
  } catch (error: any) {
    console.error("Error in resolveComplaintAction:", error);
    return { success: false, error: error.message || "Failed to update complaint resolution." };
  }
}

/**
 * Delete complaint from PostgreSQL
 */
export async function deleteComplaintAction(
  complaintId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const deleted = await db
      .delete(complaints)
      .where(eq(complaints.id, complaintId))
      .returning();

    if (deleted.length === 0) {
      return { success: false, error: "Complaint not found or already deleted." };
    }

    safeRevalidate("/admin");
    safeRevalidate("/admin/complaints");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteComplaintAction:", error);
    return { success: false, error: error.message || "Failed to delete complaint." };
  }
}

import { store } from "../mock-data";

/**
 * Get all center notices from PostgreSQL (or store fallback)
 */
export async function getAdminNoticesAction(): Promise<{
  success: boolean;
  error?: string;
  notices: AdminNoticeItem[];
}> {
  try {
    const rawNotices = await db
      .select({
        notice: notices,
        author: users,
        classroom: classrooms,
      })
      .from(notices)
      .leftJoin(users, eq(notices.authorUserId, users.id))
      .leftJoin(classrooms, eq(notices.classroomId, classrooms.id))
      .orderBy(desc(notices.publishedAt));

    if (!rawNotices || rawNotices.length === 0) {
      // Fallback to store notices if DB table is currently empty
      const storeItems = store.getNotices();
      const mappedStore: AdminNoticeItem[] = storeItems.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        targetAudience: n.targetAudience,
        authorName: n.authorName,
        authorRole: n.authorRole || "administrator",
        classroomId: null,
        classroomName: undefined,
        publishedAt: n.publishedAt,
      }));
      return { success: true, notices: mappedStore };
    }

    const mapped: AdminNoticeItem[] = rawNotices.map(({ notice, author, classroom }) => {
      let priority: "normal" | "urgent" | "holiday" = "normal";
      const combined = (notice.title + " " + notice.description).toLowerCase();
      if (combined.includes("[holiday]") || combined.includes("holiday") || combined.includes("eid") || combined.includes("puja")) {
        priority = "holiday";
      } else if (
        combined.includes("[urgent]") || 
        combined.includes("urgent") || 
        combined.includes("weather") || 
        combined.includes("advisory") || 
        combined.includes("alert") ||
        combined.includes("emergency")
      ) {
        priority = "urgent";
      }

      let targetAudience: "all" | "caregivers" | "parents" = "all";
      if (combined.includes("[target: caregivers]") || combined.includes("caregiver only") || combined.includes("for caregivers") || combined.includes("staff bulletin")) {
        targetAudience = "caregivers";
      } else if (combined.includes("[target: parents]") || combined.includes("parent only") || combined.includes("for parents") || (classroom && !combined.includes("staff"))) {
        targetAudience = "parents";
      }

      // Clean display content
      const cleanContent = notice.description
        .replace(/\[(URGENT|HOLIDAY|NORMAL)\]/gi, "")
        .replace(/\[Target:\s*(all|caregivers|parents)\]/gi, "")
        .trim();

      return {
        id: notice.id,
        title: notice.title,
        content: cleanContent || notice.description,
        priority,
        targetAudience,
        authorName: author?.name || "Center Administration",
        authorRole: author?.role || "administrator",
        classroomId: notice.classroomId,
        classroomName: classroom?.name,
        publishedAt: notice.publishedAt ? new Date(notice.publishedAt).toISOString() : new Date().toISOString(),
      };
    });

    return { success: true, notices: mapped };
  } catch (error: any) {
    console.error("Error in getAdminNoticesAction:", error);
    // Graceful fallback to mock store in case of DB connection pause
    try {
      const storeItems = store.getNotices();
      const mappedStore: AdminNoticeItem[] = storeItems.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        targetAudience: n.targetAudience,
        authorName: n.authorName,
        authorRole: n.authorRole || "administrator",
        classroomId: null,
        classroomName: undefined,
        publishedAt: n.publishedAt,
      }));
      return { success: true, notices: mappedStore };
    } catch {
      return { success: false, error: error.message || "Failed to load notices.", notices: [] };
    }
  }
}

// Convenient alias for shared consumer portals (Parent & Caregiver)
export const getCenterNoticesAction = getAdminNoticesAction;

/**
 * Create/Broadcast a new notice in PostgreSQL
 */
export async function createNoticeAction(data: {
  title: string;
  description: string;
  priority?: "normal" | "urgent" | "holiday";
  targetAudience?: "all" | "caregivers" | "parents";
  authorUserId?: string;
  classroomId?: string;
}): Promise<{ success: boolean; error?: string; noticeId?: string }> {
  try {
    if (!data.title.trim() || !data.description.trim()) {
      return { success: false, error: "Title and description are required." };
    }

    let authorId = data.authorUserId;
    if (!authorId) {
      const u = await db.select().from(users).where(eq(users.role, "administrator")).limit(1);
      authorId = u[0]?.id;
    }

    if (!authorId) {
      return { success: false, error: "Admin author ID required." };
    }

    // Embed priority and audience tags into description so schema preserves them
    const tags: string[] = [];
    if (data.priority && data.priority !== "normal") {
      tags.push(`[${data.priority.toUpperCase()}]`);
    }
    if (data.targetAudience && data.targetAudience !== "all") {
      tags.push(`[Target: ${data.targetAudience}]`);
    }
    const fullDescription = tags.length > 0 ? `${tags.join(" ")} ${data.description.trim()}` : data.description.trim();

    const [newNotice] = await db
      .insert(notices)
      .values({
        title: data.title.trim(),
        description: fullDescription,
        authorUserId: authorId,
        classroomId: data.classroomId || null,
        publishedAt: new Date(),
      })
      .returning();

    // Keep store synchronized
    try {
      let authorName = "Center Administration";
      let authorRole = "administrator";
      if (authorId) {
        const authorUser = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
        if (authorUser[0]) {
          authorName = authorUser[0].name;
          authorRole = authorUser[0].role;
        }
      }
      store.addNotice({
        title: data.title.trim(),
        content: data.description.trim(),
        priority: data.priority || "normal",
        targetAudience: data.targetAudience || "all",
        authorName,
        authorRole,
      });
    } catch (e) {
      console.warn("Store sync notice warning:", e);
    }

    // Revalidate all portals that consume notices
    safeRevalidate("/admin");
    safeRevalidate("/admin/notices");
    safeRevalidate("/parent");
    safeRevalidate("/parent/notices");
    safeRevalidate("/caregiver");
    safeRevalidate("/caregiver/notices");

    return { success: true, noticeId: newNotice.id };
  } catch (error: any) {
    console.error("Error in createNoticeAction:", error);
    return { success: false, error: error.message || "Failed to publish notice." };
  }
}

/**
 * Delete a notice from PostgreSQL
 */
export async function deleteNoticeAction(
  noticeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const deleted = await db
      .delete(notices)
      .where(eq(notices.id, noticeId))
      .returning();

    try {
      store.deleteNotice(noticeId);
    } catch (e) {
      console.warn("Store delete notice warning:", e);
    }

    if (deleted.length === 0) {
      // It might have been a store-only ID
      safeRevalidate("/admin");
      safeRevalidate("/admin/notices");
      safeRevalidate("/parent");
      safeRevalidate("/parent/notices");
      safeRevalidate("/caregiver");
      safeRevalidate("/caregiver/notices");
      return { success: true };
    }

    safeRevalidate("/admin");
    safeRevalidate("/admin/notices");
    safeRevalidate("/parent");
    safeRevalidate("/parent/notices");
    safeRevalidate("/caregiver");
    safeRevalidate("/caregiver/notices");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteNoticeAction:", error);
    return { success: false, error: error.message || "Failed to delete notice." };
  }
}
