"use server";

import { db } from "../db";
import { 
  users, 
  classrooms, 
  caregivers, 
  children, 
  childGuardians, 
  caregiverClassrooms, 
  attendance, 
  activityLogs, 
  mediaAssets, 
  childMediaPosts,
  medicalRecords,
  notices
} from "../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { store } from "../mock-data";
import { safeRevalidate } from "./safe-revalidate";

const isUUID = (str?: string): boolean =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export interface ChildMediaPostItem {
  id: string;
  childId: string;
  childName?: string;
  classroomId?: string | null;
  mediaUrl: string;
  mediaType: "photo" | "video";
  caption: string | null;
  capturedAt: string;
}

export interface CaregiverChildItem {
  id: string;
  name: string;
  dateOfBirth: string;
  classroomId: string | null;
  classroomName?: string;
  allergyFlag: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  avatarUrl: string | null;
  todayDiaperCount?: number;
  attendance?: {
    id?: string;
    status: "present" | "late" | "absent" | "excused";
    inTime: string;
    outTime: string;
    notes?: string;
  };
}

export interface ActivityLogItem {
  id: string;
  childId: string;
  childName?: string;
  childAvatarUrl?: string;
  activityType: "meal" | "nap" | "diaper_change" | "learning_activity" | "play_activity" | "mood_note" | "other";
  details: string | null;
  moodRating: number | null;
  durationMinutes: number | null;
  loggedAt: string;
  loggedByName?: string;
}

export interface CaregiverDashboardData {
  success: boolean;
  error?: string;
  caregiver?: {
    id: string;
    name: string;
    email: string;
    contactPhone?: string;
    primaryClassroomId?: string | null;
    isMedicalAuthorized: boolean;
  };
  classrooms: Array<{
    id: string;
    name: string;
    ageRange: string | null;
  }>;
  activeClassroom?: {
    id: string;
    name: string;
    ageRange: string | null;
  };
  children: CaregiverChildItem[];
  recentActivities: ActivityLogItem[];
  mediaPosts: ChildMediaPostItem[];
  stats: {
    totalChildren: number;
    presentCount: number;
    lateCount: number;
    absentCount: number;
  };
}

/**
 * Get all dashboard data for the Caregiver Panel from PostgreSQL
 */
export async function getCaregiverDashboardDataAction(
  caregiverUserId?: string,
  preferredClassroomId?: string
): Promise<CaregiverDashboardData> {
  try {
    // 1. Fetch classrooms
    const allClassrooms = await db.select().from(classrooms);
    if (allClassrooms.length === 0) {
      return {
        success: true,
        classrooms: [],
        children: [],
        recentActivities: [],
        mediaPosts: [],
        stats: { totalChildren: 0, presentCount: 0, lateCount: 0, absentCount: 0 },
      };
    }

    // 2. Resolve caregiver profile if userId provided
    let caregiverProfile: any = null;
    let selectedCaregiverUser: any = null;

    if (caregiverUserId) {
      const u = await db.select().from(users).where(eq(users.id, caregiverUserId)).limit(1);
      if (u[0]) {
        selectedCaregiverUser = u[0];
        const c = await db.select().from(caregivers).where(eq(caregivers.userId, caregiverUserId)).limit(1);
        if (c[0]) caregiverProfile = c[0];
      }
    }

    // Default caregiver if not found or not passed
    if (!selectedCaregiverUser) {
      const defCaregiver = await db.select().from(users).where(eq(users.role, "caregiver")).limit(1);
      if (defCaregiver[0]) {
        selectedCaregiverUser = defCaregiver[0];
        const c = await db.select().from(caregivers).where(eq(caregivers.userId, defCaregiver[0].id)).limit(1);
        if (c[0]) caregiverProfile = c[0];
      }
    }

    // 3. Determine active classroom
    const isAll = preferredClassroomId === "all";
    let activeRoom: { id: string; name: string; ageRange: string | null } | undefined;

    if (isAll) {
      activeRoom = { id: "all", name: "All Classrooms", ageRange: "All Ages" };
    } else if (preferredClassroomId) {
      activeRoom = allClassrooms.find((r) => r.id === preferredClassroomId);
    } else if (caregiverProfile?.primaryClassroomId) {
      activeRoom = allClassrooms.find((r) => r.id === caregiverProfile.primaryClassroomId);
    }
    
    if (!activeRoom) {
      activeRoom = allClassrooms[0] ? { ...allClassrooms[0] } : undefined;
    }

    // 4. Fetch children enrolled in this classroom (or all if 'all' selected)
    const filterByClassroomId = activeRoom && activeRoom.id !== "all" ? activeRoom.id : null;

    let childRows = await db
      .select({
        child: children,
        avatar: mediaAssets,
      })
      .from(children)
      .leftJoin(mediaAssets, eq(children.avatarAssetId, mediaAssets.id))
      .where(filterByClassroomId ? eq(children.classroomId, filterByClassroomId) : undefined);

    // 5. Fetch today's attendance for these children
    const todayStr = new Date().toISOString().split("T")[0];
    const childIds = childRows.map((r) => r.child.id);

    let todayAttendance: any[] = [];
    if (childIds.length > 0) {
      todayAttendance = await db
        .select()
        .from(attendance)
        .where(
          and(
            inArray(attendance.childId, childIds),
            eq(attendance.date, todayStr)
          )
        );
    }

    // 6. Fetch recent activity logs for classroom/children today
    let recentActivitiesRaw: any[] = [];
    if (childIds.length > 0) {
      recentActivitiesRaw = await db
        .select({
          log: activityLogs,
          child: children,
          avatar: mediaAssets,
          author: users,
        })
        .from(activityLogs)
        .leftJoin(children, eq(activityLogs.childId, children.id))
        .leftJoin(mediaAssets, eq(children.avatarAssetId, mediaAssets.id))
        .leftJoin(users, eq(activityLogs.loggedByUserId, users.id))
        .where(inArray(activityLogs.childId, childIds))
        .orderBy(desc(activityLogs.loggedAt))
        .limit(30);
    }

    // Compute today's diaper changes count per child
    const diaperCounts: Record<string, number> = {};
    recentActivitiesRaw.forEach((r) => {
      if (r.log.activityType === "diaper_change") {
        diaperCounts[r.log.childId] = (diaperCounts[r.log.childId] || 0) + 1;
      }
    });

    // Classroom map for fast name lookup
    const classroomNameMap = new Map(allClassrooms.map((r) => [r.id, r.name]));

    // Map children with their today attendance status and diaper count
    const mappedChildren: CaregiverChildItem[] = childRows.map(({ child, avatar }) => {
      const att = todayAttendance.find((a) => a.childId === child.id);
      const roomName = (child.classroomId && classroomNameMap.get(child.classroomId)) || activeRoom?.name || "General Classroom";
      return {
        id: child.id,
        name: child.name,
        dateOfBirth: child.dateOfBirth,
        classroomId: child.classroomId,
        classroomName: roomName,
        allergyFlag: child.allergyFlag,
        emergencyContactName: child.emergencyContactName,
        emergencyContactPhone: child.emergencyContactPhone,
        avatarUrl: avatar?.secureUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
        todayDiaperCount: diaperCounts[child.id] || 0,
        attendance: {
          id: att?.id,
          status: (att?.status as any) || "present",
          inTime: att?.checkInTime ? att.checkInTime.substring(0, 5) : "08:30",
          outTime: att?.checkOutTime ? att.checkOutTime.substring(0, 5) : "",
          notes: att?.notes || "",
        },
      };
    });

    // Compute attendance statistics
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    mappedChildren.forEach((c) => {
      if (c.attendance?.status === "present") presentCount++;
      else if (c.attendance?.status === "late") lateCount++;
      else if (c.attendance?.status === "absent") absentCount++;
    });

    const recentActivities: ActivityLogItem[] = recentActivitiesRaw.map(
      ({ log, child, avatar, author }) => ({
        id: log.id,
        childId: log.childId,
        childName: child?.name || "Classroom Group",
        childAvatarUrl: avatar?.secureUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
        activityType: log.activityType,
        details: log.details,
        moodRating: log.moodRating,
        durationMinutes: log.durationMinutes,
        loggedAt: log.loggedAt ? new Date(log.loggedAt).toISOString() : new Date().toISOString(),
        loggedByName: author?.name || "Caregiver",
      })
    );

    // 7. Fetch child media posts (photos and videos)
    let mediaPostsRaw: any[] = [];
    if (childIds.length > 0) {
      mediaPostsRaw = await db
        .select({
          post: childMediaPosts,
          asset: mediaAssets,
          child: children,
        })
        .from(childMediaPosts)
        .innerJoin(mediaAssets, eq(childMediaPosts.mediaAssetId, mediaAssets.id))
        .leftJoin(children, eq(childMediaPosts.childId, children.id))
        .where(inArray(childMediaPosts.childId, childIds))
        .orderBy(desc(childMediaPosts.capturedAt))
        .limit(30);
    }

    const mediaPosts: ChildMediaPostItem[] = mediaPostsRaw.map(({ post, asset, child }) => ({
      id: post.id,
      childId: post.childId || "",
      childName: child?.name || "Child",
      classroomId: post.classroomId,
      mediaUrl: asset.secureUrl,
      mediaType: post.mediaType,
      caption: post.caption,
      capturedAt: post.capturedAt ? new Date(post.capturedAt).toISOString() : new Date().toISOString(),
    }));

    return {
      success: true,
      caregiver: selectedCaregiverUser
        ? {
            id: selectedCaregiverUser.id,
            name: selectedCaregiverUser.name,
            email: selectedCaregiverUser.email,
            contactPhone: caregiverProfile?.contactPhone || "+880 1711-223344",
            primaryClassroomId: caregiverProfile?.primaryClassroomId || activeRoom?.id,
            isMedicalAuthorized: caregiverProfile?.isMedicalAuthorized ?? true,
          }
        : undefined,
      classrooms: allClassrooms.map((r) => ({
        id: r.id,
        name: r.name,
        ageRange: r.ageRange,
      })),
      activeClassroom: activeRoom
        ? {
            id: activeRoom.id,
            name: activeRoom.name,
            ageRange: activeRoom.ageRange,
          }
        : undefined,
      children: mappedChildren,
      recentActivities,
      mediaPosts,
      stats: {
        totalChildren: mappedChildren.length,
        presentCount,
        lateCount,
        absentCount,
      },
    };
  } catch (error: any) {
    console.error("Error in getCaregiverDashboardDataAction:", error);
    return {
      success: false,
      error: error.message || "Failed to load caregiver dashboard data from database.",
      classrooms: [],
      children: [],
      recentActivities: [],
      mediaPosts: [],
      stats: { totalChildren: 0, presentCount: 0, lateCount: 0, absentCount: 0 },
    };
  }
}

/**
 * Save / Update attendance roster for a classroom in PostgreSQL
 */
export async function saveAttendanceBatchAction(
  records: Array<{
    childId: string;
    date?: string;
    status: "present" | "late" | "absent" | "excused";
    inTime?: string;
    outTime?: string;
    notes?: string;
  }>,
  recordedByUserId?: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    let authorId = recordedByUserId;

    if (!authorId) {
      const u = await db.select().from(users).where(eq(users.role, "caregiver")).limit(1);
      authorId = u[0]?.id;
    }

    let updatedCount = 0;

    for (const rec of records) {
      const attDate = rec.date || todayStr;
      const formattedInTime = rec.inTime ? (rec.inTime.length === 5 ? `${rec.inTime}:00` : rec.inTime) : "08:30:00";
      const formattedOutTime = rec.outTime ? (rec.outTime.length === 5 ? `${rec.outTime}:00` : rec.outTime) : null;

      await db
        .insert(attendance)
        .values({
          childId: rec.childId,
          date: attDate,
          status: rec.status,
          checkInTime: formattedInTime,
          checkOutTime: formattedOutTime,
          recordedByUserId: authorId || null,
          notes: rec.notes || null,
        })
        .onConflictDoUpdate({
          target: [attendance.childId, attendance.date],
          set: {
            status: rec.status,
            checkInTime: formattedInTime,
            checkOutTime: formattedOutTime,
            recordedByUserId: authorId || null,
            notes: rec.notes || null,
            updatedAt: new Date(),
          },
        });

      updatedCount++;
    }

    safeRevalidate("/caregiver");
    return { success: true, count: updatedCount };
  } catch (error: any) {
    console.error("Error in saveAttendanceBatchAction:", error);
    return { success: false, error: error.message || "Failed to save attendance." };
  }
}

/**
 * Log a daily routine activity into PostgreSQL activity_logs
 */
export async function logActivityAction(data: {
  childId: string;
  activityType: "meal" | "nap" | "diaper_change" | "learning_activity" | "play_activity" | "mood_note" | "other";
  details: string;
  moodRating?: number;
  durationMinutes?: number;
  loggedByUserId?: string;
}): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    let authorId = data.loggedByUserId;
    if (!authorId) {
      const u = await db.select().from(users).where(eq(users.role, "caregiver")).limit(1);
      authorId = u[0]?.id;
    }

    if (!authorId) {
      return { success: false, error: "Caregiver author ID could not be identified." };
    }

    const inserted = await db
      .insert(activityLogs)
      .values({
        childId: data.childId,
        activityType: data.activityType,
        details: data.details,
        moodRating: data.moodRating ?? 5,
        durationMinutes: data.durationMinutes ?? 15,
        loggedByUserId: authorId,
        loggedAt: new Date(),
      })
      .returning();

    safeRevalidate("/caregiver");
    return { success: true, logId: inserted[0]?.id };
  } catch (error: any) {
    console.error("Error in logActivityAction:", error);
    return { success: false, error: error.message || "Failed to log routine activity." };
  }
}

/**
 * Upload a photo/video moment for a child and save to PostgreSQL child_media_posts
 */
export async function createChildMediaPostAction(data: {
  childId: string;
  classroomId?: string;
  caregiverUserId?: string;
  mediaAssetId?: string;
  mediaUrl: string;
  mediaType?: "photo" | "video";
  publicId?: string;
  caption?: string;
}): Promise<{ success: boolean; error?: string; postId?: string }> {
  try {
    let authorId = data.caregiverUserId;
    if (!authorId) {
      const u = await db.select().from(users).where(eq(users.role, "caregiver")).limit(1);
      authorId = u[0]?.id;
    }

    if (!authorId) {
      return { success: false, error: "Caregiver ID required." };
    }

    const isVideo =
      data.mediaType === "video" ||
      data.mediaUrl.startsWith("data:video") ||
      data.mediaUrl.includes(".mp4") ||
      data.mediaUrl.includes(".webm");
    const mType: "photo" | "video" = isVideo ? "video" : "photo";
    const resType: "video" | "image" = isVideo ? "video" : "image";

    let assetId = data.mediaAssetId;
    if (!assetId) {
      const pubId = data.publicId || `kiddieops/moment_${Date.now()}`;
      const [newAsset] = await db
        .insert(mediaAssets)
        .values({
          publicId: pubId,
          secureUrl: data.mediaUrl,
          resourceType: resType,
          format: isVideo ? "mp4" : "jpg",
          uploadedByUserId: authorId,
          entityType: "child_media",
          entityId: data.childId,
        })
        .returning();
      assetId = newAsset?.id;
    }

    const [newPost] = await db
      .insert(childMediaPosts)
      .values({
        childId: data.childId,
        classroomId: data.classroomId || null,
        caregiverUserId: authorId,
        mediaAssetId: assetId,
        mediaType: mType,
        caption: data.caption || (isVideo ? "Classroom video moment" : "Classroom activity moment"),
        capturedAt: new Date(),
      })
      .returning();

    safeRevalidate("/caregiver");
    safeRevalidate("/parent");
    return { success: true, postId: newPost?.id };
  } catch (error: any) {
    console.error("Error in createChildMediaPostAction:", error);
    return { success: false, error: error.message || "Failed to save media post." };
  }
}

/**
 * Log a student's specific daily routine item (meal, nap, diaper change with counter, new word, mood)
 */
export async function logStudentRoutineAction(data: {
  childId: string;
  childName?: string;
  caregiverUserId?: string;
  routineType: "meal" | "nap" | "diaper_change" | "new_word" | "mood" | "other";
  // Meal details
  mealTime?: string;
  mealItems?: string;
  portionEaten?: string;
  // Nap details
  napStartTime?: string;
  napEndTime?: string;
  napDurationMinutes?: number;
  napQuality?: string;
  // Diaper details
  diaperTime?: string;
  diaperType?: "wet" | "soiled" | "both" | "dry";
  // New word milestone
  wordSpoken?: string;
  wordContext?: string;
  wordTime?: string;
  // Mood details
  moodRating?: number;
  moodState?: string;
  // General
  observations?: string;
}): Promise<{ success: boolean; error?: string; logId?: string; todayDiaperCount?: number }> {
  try {
    let authorId = data.caregiverUserId;
    if (!authorId) {
      const u = await db.select().from(users).where(eq(users.role, "caregiver")).limit(1);
      authorId = u[0]?.id;
    }

    let activityType: "meal" | "nap" | "diaper_change" | "learning_activity" | "play_activity" | "mood_note" | "other" = "other";
    let formattedDetails = "";
    let duration = 0;
    let mood = data.moodRating ?? 5;

    switch (data.routineType) {
      case "meal":
        activityType = "meal";
        formattedDetails = `🍎 Meal (${data.mealTime || "Scheduled"}): ${data.mealItems || "Balanced portion"}. Portion Eaten: ${data.portionEaten || "100%"}. ${data.observations ? `Notes: ${data.observations}` : ""}`;
        duration = 20;
        break;
      case "nap":
        activityType = "nap";
        duration = data.napDurationMinutes || 60;
        formattedDetails = `💤 Nap Time: ${data.napStartTime || "--"} to ${data.napEndTime || "--"} (${duration} min). Quality: ${data.napQuality || "Restful sleep"}. ${data.observations ? `Notes: ${data.observations}` : ""}`;
        break;
      case "diaper_change":
        activityType = "diaper_change";
        formattedDetails = `🧷 Diaper Change at ${data.diaperTime || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Condition: ${data.diaperType || "wet"}. ${data.observations ? `Notes: ${data.observations}` : ""}`;
        duration = 5;
        break;
      case "new_word":
        activityType = "learning_activity";
        formattedDetails = `💬 New Word Spoken: "${data.wordSpoken || ""}"! Context: ${data.wordContext || "During classroom conversation"}. ${data.observations ? `Notes: ${data.observations}` : ""}`;
        duration = 15;
        mood = 5;
        break;
      case "mood":
        activityType = "mood_note";
        formattedDetails = `😊 Mood Observation: ${data.moodState || "Happy"} (${mood}/5 stars). ${data.observations || ""}`;
        duration = 10;
        break;
      default:
        activityType = "other";
        formattedDetails = data.observations || "Daily classroom observation.";
    }

    const [inserted] = await db
      .insert(activityLogs)
      .values({
        childId: data.childId,
        activityType,
        details: formattedDetails,
        moodRating: mood,
        durationMinutes: duration,
        loggedByUserId: authorId || (await db.select().from(users).limit(1))[0].id,
        loggedAt: new Date(),
      })
      .returning();

    // Query today's diaper change count for this child
    const todayLogs = await db
      .select()
      .from(activityLogs)
      .where(and(eq(activityLogs.childId, data.childId), eq(activityLogs.activityType, "diaper_change")));

    const todayDiaperCount = todayLogs.length;

    safeRevalidate("/caregiver");
    safeRevalidate("/parent");
    return { success: true, logId: inserted?.id, todayDiaperCount };
  } catch (error: any) {
    console.error("Error in logStudentRoutineAction:", error);
    return { success: false, error: error.message || "Failed to log student routine." };
  }
}

/**
 * Send an urgent emergency alert to parents for a specific student
 */
export async function sendStudentEmergencyAlertAction(data: {
  childId: string;
  childName: string;
  caregiverUserId?: string;
  classroomId?: string;
  alertType: "medical" | "allergy" | "injury" | "fever" | "urgent_pickup" | "other";
  title: string;
  description: string;
  actionTaken?: string;
}): Promise<{ success: boolean; error?: string; alertId?: string }> {
  try {
    let authorId = data.caregiverUserId;
    if (!authorId) {
      const u = await db.select().from(users).where(eq(users.role, "caregiver")).limit(1);
      authorId = u[0]?.id;
    }

    const emergencyDetails = `🚨 [EMERGENCY ALERT: ${data.title.toUpperCase()}] For ${data.childName}. Details: ${data.description}. Action Taken: ${data.actionTaken || "Immediate caregiver care"}`;

    // 1. Insert into activity_logs
    const [act] = await db
      .insert(activityLogs)
      .values({
        childId: data.childId,
        activityType: "other",
        details: emergencyDetails,
        moodRating: 1,
        durationMinutes: 0,
        loggedByUserId: authorId || (await db.select().from(users).limit(1))[0].id,
        loggedAt: new Date(),
      })
      .returning();

    // 2. Broadcast high-priority notice
    await db.insert(notices).values({
      title: `🚨 EMERGENCY ALERT: ${data.childName} — ${data.title}`,
      description: `${data.description} | Action Taken: ${data.actionTaken || "Immediate protocol applied by caregiver."}`,
      classroomId: data.classroomId && isUUID(data.classroomId) ? data.classroomId : null,
      authorUserId: authorId || (await db.select().from(users).limit(1))[0].id,
      publishedAt: new Date(),
    });

    // 3. If medical / allergy, append to medicalRecords
    if (data.alertType === "medical" || data.alertType === "allergy" || data.alertType === "injury") {
      try {
        const existingMed = await db.select().from(medicalRecords).where(eq(medicalRecords.childId, data.childId)).limit(1);
        const incidentNote = `[${new Date().toLocaleDateString()}] ${data.title}: ${data.description} (Action: ${data.actionTaken || "None"})`;
        if (existingMed[0]) {
          const updatedReports = existingMed[0].incidentReports
            ? `${existingMed[0].incidentReports}\n${incidentNote}`
            : incidentNote;
          await db.update(medicalRecords).set({ incidentReports: updatedReports }).where(eq(medicalRecords.childId, data.childId));
        }
      } catch {}
    }

    safeRevalidate("/caregiver");
    safeRevalidate("/parent");
    safeRevalidate("/admin");

    return { success: true, alertId: act?.id };
  } catch (error: any) {
    console.error("Error in sendStudentEmergencyAlertAction:", error);
    return { success: false, error: error.message || "Failed to send emergency alert." };
  }
}

/**
 * Get full live feed and activity history for a specific child (used by both Caregiver and Parent)
 */
export async function getChildLiveFeedAction(childId: string): Promise<{
  success: boolean;
  error?: string;
  child?: any;
  todayAttendance?: any;
  todayDiaperCount: number;
  activities: ActivityLogItem[];
  mediaPosts: ChildMediaPostItem[];
  emergencyAlerts: Array<{ id: string; title: string; description: string; time: string }>;
}> {
  try {
    // 1. Fetch child
    const childRows = await db
      .select({
        child: children,
        avatar: mediaAssets,
        room: classrooms,
      })
      .from(children)
      .leftJoin(mediaAssets, eq(children.avatarAssetId, mediaAssets.id))
      .leftJoin(classrooms, eq(children.classroomId, classrooms.id))
      .where(eq(children.id, childId))
      .limit(1);

    if (childRows.length === 0) {
      return {
        success: false,
        error: "Child not found in database.",
        todayDiaperCount: 0,
        activities: [],
        mediaPosts: [],
        emergencyAlerts: [],
      };
    }

    const currentChild = childRows[0];

    // 2. Fetch today's attendance
    const todayStr = new Date().toISOString().split("T")[0];
    const att = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.childId, childId), eq(attendance.date, todayStr)))
      .limit(1);

    // 3. Fetch activities for this child
    const acts = await db
      .select({
        log: activityLogs,
        author: users,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.loggedByUserId, users.id))
      .where(eq(activityLogs.childId, childId))
      .orderBy(desc(activityLogs.loggedAt))
      .limit(50);

    let diaperCount = 0;
    const emergencyAlerts: Array<{ id: string; title: string; description: string; time: string }> = [];

    const mappedActs: ActivityLogItem[] = acts.map(({ log, author }) => {
      if (log.activityType === "diaper_change") {
        diaperCount++;
      }
      if (log.details && log.details.includes("[EMERGENCY ALERT:")) {
        emergencyAlerts.push({
          id: log.id,
          title: log.details.split("]")[0].replace("🚨 [EMERGENCY ALERT: ", "").trim(),
          description: log.details.split("]").slice(1).join("]").trim(),
          time: log.loggedAt ? new Date(log.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        });
      }
      return {
        id: log.id,
        childId: log.childId,
        childName: currentChild.child.name,
        childAvatarUrl: currentChild.avatar?.secureUrl,
        activityType: log.activityType,
        details: log.details,
        moodRating: log.moodRating,
        durationMinutes: log.durationMinutes,
        loggedAt: log.loggedAt ? new Date(log.loggedAt).toISOString() : new Date().toISOString(),
        loggedByName: author?.name || "Caregiver",
      };
    });

    // 4. Fetch media posts (photos and videos) for this child
    const media = await db
      .select({
        post: childMediaPosts,
        asset: mediaAssets,
      })
      .from(childMediaPosts)
      .innerJoin(mediaAssets, eq(childMediaPosts.mediaAssetId, mediaAssets.id))
      .where(eq(childMediaPosts.childId, childId))
      .orderBy(desc(childMediaPosts.capturedAt))
      .limit(30);

    const mappedMedia: ChildMediaPostItem[] = media.map(({ post, asset }) => ({
      id: post.id,
      childId: post.childId || childId,
      childName: currentChild.child.name,
      classroomId: post.classroomId,
      mediaUrl: asset.secureUrl,
      mediaType: post.mediaType,
      caption: post.caption,
      capturedAt: post.capturedAt ? new Date(post.capturedAt).toISOString() : new Date().toISOString(),
    }));

    return {
      success: true,
      child: {
        id: currentChild.child.id,
        name: currentChild.child.name,
        dateOfBirth: currentChild.child.dateOfBirth,
        classroomId: currentChild.child.classroomId,
        classroomName: currentChild.room?.name || "General Classroom",
        allergyFlag: currentChild.child.allergyFlag,
        emergencyContactName: currentChild.child.emergencyContactName,
        emergencyContactPhone: currentChild.child.emergencyContactPhone,
        avatarUrl: currentChild.avatar?.secureUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
      },
      todayAttendance: att[0]
        ? {
            status: att[0].status,
            inTime: att[0].checkInTime ? att[0].checkInTime.substring(0, 5) : "08:30",
            outTime: att[0].checkOutTime ? att[0].checkOutTime.substring(0, 5) : "",
            notes: att[0].notes || "",
          }
        : null,
      todayDiaperCount: diaperCount,
      activities: mappedActs,
      mediaPosts: mappedMedia,
      emergencyAlerts,
    };
  } catch (error: any) {
    console.error("Error in getChildLiveFeedAction:", error);
    return {
      success: false,
      error: error.message || "Failed to load child feed.",
      todayDiaperCount: 0,
      activities: [],
      mediaPosts: [],
      emergencyAlerts: [],
    };
  }
}

/**
 * Caregiver action to enroll/add a child to classroom and PostgreSQL
 */
export async function caregiverCreateChildAction(
  caregiverUserId: string | undefined,
  data: {
    name: string;
    dateOfBirth: string;
    classroomId?: string;
    allergyFlag: boolean;
    allergyDetails?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    avatarUrl?: string;
    avatarAssetId?: string;
  }
): Promise<{ success: boolean; error?: string; child?: any }> {
  try {
    if (!data.name?.trim() || !data.dateOfBirth || !data.emergencyContactName?.trim() || !data.emergencyContactPhone?.trim()) {
      return { success: false, error: "Name, DOB, and emergency contact details are required." };
    }

    let targetClassroomId: string | null = null;
    if (data.classroomId && isUUID(data.classroomId)) {
      const rm = await db.select().from(classrooms).where(eq(classrooms.id, data.classroomId)).limit(1);
      if (rm[0]) targetClassroomId = rm[0].id;
    }

    if (!targetClassroomId) {
      const defRoom = await db.select().from(classrooms).limit(1);
      targetClassroomId = defRoom[0]?.id || null;
    }

    let assetId = data.avatarAssetId;
    if (!assetId && data.avatarUrl) {
      try {
        const [asset] = await db
          .insert(mediaAssets)
          .values({
            publicId: `kiddieops/child_avatar_${Date.now()}`,
            secureUrl: data.avatarUrl,
            resourceType: "image",
            format: "jpg",
            uploadedByUserId: caregiverUserId && isUUID(caregiverUserId) ? caregiverUserId : null,
            entityType: "child_avatar",
          })
          .returning();
        if (asset) assetId = asset.id;
      } catch {}
    }

    const [newChild] = await db
      .insert(children)
      .values({
        name: data.name.trim(),
        dateOfBirth: data.dateOfBirth,
        classroomId: targetClassroomId,
        allergyFlag: !!data.allergyFlag,
        emergencyContactName: data.emergencyContactName.trim(),
        emergencyContactPhone: data.emergencyContactPhone.trim(),
        avatarAssetId: assetId || null,
      })
      .returning();

    if (newChild && (data.allergyFlag || data.allergyDetails)) {
      try {
        await db
          .insert(medicalRecords)
          .values({
            childId: newChild.id,
            allergies: data.allergyDetails?.trim() || (data.allergyFlag ? "Known food/environmental allergy" : null),
            hasSevereAllergy: !!data.allergyFlag,
            lastUpdatedByUserId: caregiverUserId && isUUID(caregiverUserId) ? caregiverUserId : null,
          })
          .onConflictDoUpdate({
            target: [medicalRecords.childId],
            set: {
              allergies: data.allergyDetails?.trim() || (data.allergyFlag ? "Known food/environmental allergy" : null),
              hasSevereAllergy: !!data.allergyFlag,
              updatedAt: new Date(),
            },
          });
      } catch {}
    }

    // Sync in memory store
    const inMemChild = store.addChild({
      name: data.name.trim(),
      dateOfBirth: data.dateOfBirth,
      classroomId: targetClassroomId || "room-butterflies",
      allergyFlag: !!data.allergyFlag,
      allergyDetails: data.allergyDetails?.trim(),
      emergencyContactName: data.emergencyContactName.trim(),
      emergencyContactPhone: data.emergencyContactPhone.trim(),
      guardianIds: [],
      avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
    });

    safeRevalidate("/caregiver");
    safeRevalidate("/admin/children");
    safeRevalidate("/admin");

    return {
      success: true,
      child: {
        id: newChild ? newChild.id : inMemChild.id,
        name: data.name.trim(),
        dateOfBirth: data.dateOfBirth,
        classroomId: targetClassroomId,
        allergyFlag: !!data.allergyFlag,
        emergencyContactName: data.emergencyContactName.trim(),
        emergencyContactPhone: data.emergencyContactPhone.trim(),
        avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80",
      },
    };
  } catch (error: any) {
    console.error("Error in caregiverCreateChildAction:", error);
    return { success: false, error: error.message || "Failed to create child record." };
  }
}

/**
 * Caregiver action to update child information
 */
export async function caregiverUpdateChildAction(
  caregiverUserId: string | undefined,
  childId: string,
  data: {
    name?: string;
    dateOfBirth?: string;
    classroomId?: string;
    allergyFlag?: boolean;
    allergyDetails?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    avatarUrl?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isUUID(childId)) {
      const patch: any = { updatedAt: new Date() };
      if (data.name) patch.name = data.name.trim();
      if (data.dateOfBirth) patch.dateOfBirth = data.dateOfBirth;
      if (data.classroomId && isUUID(data.classroomId)) {
        patch.classroomId = data.classroomId;
      }
      if (data.allergyFlag !== undefined) patch.allergyFlag = data.allergyFlag;
      if (data.emergencyContactName) patch.emergencyContactName = data.emergencyContactName.trim();
      if (data.emergencyContactPhone) patch.emergencyContactPhone = data.emergencyContactPhone.trim();

      await db.update(children).set(patch).where(eq(children.id, childId));

      if (data.allergyFlag !== undefined || data.allergyDetails !== undefined) {
        try {
          await db
            .insert(medicalRecords)
            .values({
              childId: childId,
              allergies: data.allergyDetails?.trim() || (data.allergyFlag ? "Known allergy" : null),
              hasSevereAllergy: !!data.allergyFlag,
              lastUpdatedByUserId: caregiverUserId && isUUID(caregiverUserId) ? caregiverUserId : null,
            })
            .onConflictDoUpdate({
              target: [medicalRecords.childId],
              set: {
                allergies: data.allergyDetails?.trim() || (data.allergyFlag ? "Known allergy" : null),
                hasSevereAllergy: !!data.allergyFlag,
                updatedAt: new Date(),
              },
            });
        } catch {}
      }
    }

    // Sync in store
    store.updateChild(childId, {
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      classroomId: data.classroomId,
      allergyFlag: data.allergyFlag,
      allergyDetails: data.allergyDetails,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      avatarUrl: data.avatarUrl,
    });

    safeRevalidate("/caregiver");
    safeRevalidate("/admin/children");
    safeRevalidate("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error in caregiverUpdateChildAction:", error);
    return { success: false, error: error.message || "Failed to update child profile." };
  }
}

/**
 * Caregiver action to delete a child from classroom and database
 */
export async function caregiverDeleteChildAction(
  caregiverUserId: string | undefined,
  childId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let dbDeleted = false;
    if (isUUID(childId)) {
      const res = await db.delete(children).where(eq(children.id, childId)).returning();
      if (res && res.length > 0) {
        dbDeleted = true;
      }
    }

    const storeDeleted = store.deleteChild(childId);

    if (!dbDeleted && !storeDeleted) {
      return { success: false, error: "Child record could not be found or removed." };
    }

    safeRevalidate("/caregiver");
    safeRevalidate("/admin/children");
    safeRevalidate("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error in caregiverDeleteChildAction:", error);
    return { success: false, error: error.message || "Failed to delete child." };
  }
}

