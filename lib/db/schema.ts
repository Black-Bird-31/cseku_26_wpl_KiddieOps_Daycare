import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  time,
  date,
  smallint,
  pgEnum,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// PostgreSQL Enums (matching docs/database-schema.md)
// ============================================================

export const userRoleEnum = pgEnum("user_role", [
  "administrator",
  "caregiver",
  "parent",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "meal",
  "nap",
  "diaper_change",
  "learning_activity",
  "play_activity",
  "mood_note",
  "other",
]);

export const medicalAuditActionEnum = pgEnum("medical_audit_action", [
  "create",
  "read",
  "update",
  "delete",
]);

export const mediaResourceTypeEnum = pgEnum("media_resource_type", [
  "image",
  "raw",
  "video",
]);

export const complaintStatusEnum = pgEnum("complaint_status", [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
]);

export const childMediaTypeEnum = pgEnum("child_media_type", [
  "photo",
  "video",
]);

// ============================================================
// 1. media_assets (Cloudinary Metadata)
// Plain uuid for uploadedByUserId to avoid circular TS reference with users.
// ============================================================
export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  publicId: varchar("public_id", { length: 512 }).notNull().unique(),
  secureUrl: text("secure_url").notNull(),
  resourceType: mediaResourceTypeEnum("resource_type").notNull(),
  format: varchar("format", { length: 10 }),
  uploadedByUserId: uuid("uploaded_by_user_id"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: uuid("entity_id"),
});

// ============================================================
// 2. users (Universal Auth & RBAC)
// ============================================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  avatarAssetId: uuid("avatar_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// 3. classrooms (Rooms / Groups)
// ============================================================
export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  ageRange: varchar("age_range", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// 4. caregivers (Staff Profile Extension)
// ============================================================
export const caregivers = pgTable("caregivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  primaryClassroomId: uuid("primary_classroom_id").references(
    () => classrooms.id,
    { onDelete: "set null" }
  ),
  isMedicalAuthorized: boolean("is_medical_authorized").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// 5. children (Child Profiles)
// ============================================================
export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  classroomId: uuid("classroom_id").references(() => classrooms.id, {
    onDelete: "set null",
  }),
  allergyFlag: boolean("allergy_flag").default(false).notNull(),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  avatarAssetId: uuid("avatar_asset_id").references(() => mediaAssets.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// 6. child_guardians (Many-to-Many Child ↔ Parent)
// ============================================================
export const childGuardians = pgTable(
  "child_guardians",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relationshipLabel: varchar("relationship_label", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.childId, table.userId] }),
    userIdx: index("idx_child_guardians_user").on(table.userId),
  })
);

// ============================================================
// 7. caregiver_classrooms (Many-to-Many Caregiver ↔ Classroom)
// ============================================================
export const caregiverClassrooms = pgTable(
  "caregiver_classrooms",
  {
    caregiverId: uuid("caregiver_id")
      .notNull()
      .references(() => caregivers.id, { onDelete: "cascade" }),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.caregiverId, table.classroomId] }),
    classroomIdx: index("idx_caregiver_classrooms_classroom").on(table.classroomId),
  })
);

// ============================================================
// 8. attendance (Daily Attendance)
// ============================================================
export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    checkInTime: time("check_in_time", { withTimezone: true }),
    checkOutTime: time("check_out_time", { withTimezone: true }),
    status: attendanceStatusEnum("status").notNull(),
    recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqChildDate: uniqueIndex("uniq_attendance_child_date").on(table.childId, table.date),
    childIdx: index("idx_attendance_child").on(table.childId),
    dateIdx: index("idx_attendance_date").on(table.date),
  })
);

// ============================================================
// 9. activity_logs (Daily Routine Logs)
// ============================================================
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
    activityType: activityTypeEnum("activity_type").notNull(),
    details: text("details"),
    moodRating: smallint("mood_rating"),
    durationMinutes: smallint("duration_minutes"),
    loggedByUserId: uuid("logged_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    childIdx: index("idx_activity_logs_child").on(table.childId),
    childTimeIdx: index("idx_activity_logs_child_time").on(table.childId, table.loggedAt),
    typeIdx: index("idx_activity_logs_type").on(table.activityType),
  })
);

// ============================================================
// 10. child_media_posts (Photo / Video Moment Sharing — REQ40, REQ41)
// ============================================================
export const childMediaPosts = pgTable(
  "child_media_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    caregiverUserId: uuid("caregiver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    childId: uuid("child_id").references(() => children.id, {
      onDelete: "cascade",
    }),
    classroomId: uuid("classroom_id").references(() => classrooms.id, {
      onDelete: "set null",
    }),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "cascade" }),
    mediaType: childMediaTypeEnum("media_type").default("photo").notNull(),
    caption: text("caption"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    childIdx: index("idx_child_media_posts_child").on(table.childId),
    classroomIdx: index("idx_child_media_posts_classroom").on(table.classroomId),
    caregiverIdx: index("idx_child_media_posts_caregiver").on(table.caregiverUserId),
    capturedIdx: index("idx_child_media_posts_captured").on(table.capturedAt),
  })
);

// ============================================================
// 11. complaints (Parent Complaint against Caregivers — REQ38, REQ39)
// ============================================================
export const complaints = pgTable(
  "complaints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentUserId: uuid("parent_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    caregiverUserId: uuid("caregiver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    childId: uuid("child_id").references(() => children.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    incidentDate: timestamp("incident_date", { withTimezone: true }),
    proofAssetId: uuid("proof_asset_id").references(() => mediaAssets.id, {
      onDelete: "set null",
    }),
    status: complaintStatusEnum("status").default("pending").notNull(),
    adminNotes: text("admin_notes"),
    resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => ({
    parentIdx: index("idx_complaints_parent").on(table.parentUserId),
    caregiverIdx: index("idx_complaints_caregiver").on(table.caregiverUserId),
    statusIdx: index("idx_complaints_status").on(table.status),
    createdIdx: index("idx_complaints_created").on(table.createdAt),
  })
);

// ============================================================
// 12. medical_records (Child Medical Profiles)
// ============================================================
export const medicalRecords = pgTable(
  "medical_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .unique()
      .references(() => children.id, { onDelete: "cascade" }),
    allergies: text("allergies"),
    hasSevereAllergy: boolean("has_severe_allergy").default(false).notNull(),
    chronicConditions: text("chronic_conditions"),
    medications: text("medications"),
    immunizations: text("immunizations"),
    physicianName: varchar("physician_name", { length: 255 }),
    physicianContact: varchar("physician_contact", { length: 255 }),
    specialCareInstructions: text("special_care_instructions"),
    incidentReports: text("incident_reports"),
    lastUpdatedByUserId: uuid("last_updated_by_user_id").references(
      () => users.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    severeAllergyIdx: index("idx_medical_records_severe_allergy").on(table.hasSevereAllergy),
  })
);

// ============================================================
// 13. medical_record_audit (Immutable Access Log)
// ============================================================
export const medicalRecordAudit = pgTable(
  "medical_record_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicalRecordId: uuid("medical_record_id")
      .notNull()
      .references(() => medicalRecords.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: medicalAuditActionEnum("action").notNull(),
    changedFields: text("changed_fields"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    recordIdx: index("idx_medical_audit_record").on(table.medicalRecordId),
    actorIdx: index("idx_medical_audit_actor").on(table.actorUserId),
    timestampIdx: index("idx_medical_audit_timestamp").on(table.timestamp),
  })
);

// ============================================================
// 14. notices (Announcements & Bulletins)
// ============================================================
export const notices = pgTable(
  "notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    classroomId: uuid("classroom_id").references(() => classrooms.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    classroomIdx: index("idx_notices_classroom").on(table.classroomId),
    publishedIdx: index("idx_notices_published").on(table.publishedAt),
  })
);

// ============================================================
// 15. ai_guardian_sessions (Claude AI Q&A Turn History)
// ============================================================
export const aiGuardianSessions = pgTable(
  "ai_guardian_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guardianUserId: uuid("guardian_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "restrict" }),
    sessionToken: varchar("session_token", { length: 255 }).notNull(),
    queryText: text("query_text").notNull(),
    responseText: text("response_text").notNull(),
    languageDetected: varchar("language_detected", { length: 10 }),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    guardianChildIdx: index("idx_ai_sessions_guardian_child").on(
      table.guardianUserId,
      table.childId
    ),
    tokenIdx: index("idx_ai_sessions_token").on(table.sessionToken),
    timestampIdx: index("idx_ai_sessions_timestamp").on(table.timestamp),
  })
);

// ============================================================
// Drizzle Relations
// ============================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  caregiverProfile: one(caregivers, {
    fields: [users.id],
    references: [caregivers.userId],
  }),
  avatarAsset: one(mediaAssets, {
    fields: [users.avatarAssetId],
    references: [mediaAssets.id],
  }),
  childGuardians: many(childGuardians),
  activityLogs: many(activityLogs),
  attendanceRecords: many(attendance),
  authoredNotices: many(notices),
  filedComplaints: many(complaints, { relationName: "parentComplaints" }),
  targetedComplaints: many(complaints, { relationName: "caregiverComplaints" }),
  mediaPosts: many(childMediaPosts),
  aiSessions: many(aiGuardianSessions),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [mediaAssets.uploadedByUserId],
    references: [users.id],
  }),
}));

export const caregiversRelations = relations(caregivers, ({ one, many }) => ({
  user: one(users, {
    fields: [caregivers.userId],
    references: [users.id],
  }),
  primaryClassroom: one(classrooms, {
    fields: [caregivers.primaryClassroomId],
    references: [classrooms.id],
  }),
  caregiverClassrooms: many(caregiverClassrooms),
}));

export const classroomsRelations = relations(classrooms, ({ many }) => ({
  children: many(children),
  primaryCaregivers: many(caregivers),
  caregiverClassrooms: many(caregiverClassrooms),
  notices: many(notices),
  mediaPosts: many(childMediaPosts),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [children.classroomId],
    references: [classrooms.id],
  }),
  avatarAsset: one(mediaAssets, {
    fields: [children.avatarAssetId],
    references: [mediaAssets.id],
  }),
  childGuardians: many(childGuardians),
  attendance: many(attendance),
  activityLogs: many(activityLogs),
  medicalRecord: one(medicalRecords, {
    fields: [children.id],
    references: [medicalRecords.childId],
  }),
  mediaPosts: many(childMediaPosts),
  complaints: many(complaints),
  aiSessions: many(aiGuardianSessions),
}));

export const childGuardiansRelations = relations(childGuardians, ({ one }) => ({
  child: one(children, {
    fields: [childGuardians.childId],
    references: [children.id],
  }),
  guardian: one(users, {
    fields: [childGuardians.userId],
    references: [users.id],
  }),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one, many }) => ({
  child: one(children, {
    fields: [medicalRecords.childId],
    references: [children.id],
  }),
  lastUpdatedByUser: one(users, {
    fields: [medicalRecords.lastUpdatedByUserId],
    references: [users.id],
  }),
  auditLogs: many(medicalRecordAudit),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  parentUser: one(users, {
    fields: [complaints.parentUserId],
    references: [users.id],
    relationName: "parentComplaints",
  }),
  caregiverUser: one(users, {
    fields: [complaints.caregiverUserId],
    references: [users.id],
    relationName: "caregiverComplaints",
  }),
  child: one(children, {
    fields: [complaints.childId],
    references: [children.id],
  }),
  proofAsset: one(mediaAssets, {
    fields: [complaints.proofAssetId],
    references: [mediaAssets.id],
  }),
  resolvedByUser: one(users, {
    fields: [complaints.resolvedByUserId],
    references: [users.id],
  }),
}));

export const childMediaPostsRelations = relations(childMediaPosts, ({ one }) => ({
  caregiverUser: one(users, {
    fields: [childMediaPosts.caregiverUserId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [childMediaPosts.childId],
    references: [children.id],
  }),
  classroom: one(classrooms, {
    fields: [childMediaPosts.classroomId],
    references: [classrooms.id],
  }),
  mediaAsset: one(mediaAssets, {
    fields: [childMediaPosts.mediaAssetId],
    references: [mediaAssets.id],
  }),
}));
