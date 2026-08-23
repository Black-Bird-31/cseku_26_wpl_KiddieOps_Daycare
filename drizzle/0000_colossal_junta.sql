DO $$ BEGIN
 CREATE TYPE "public"."activity_type" AS ENUM('meal', 'nap', 'diaper_change', 'learning_activity', 'play_activity', 'mood_note', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."child_media_type" AS ENUM('photo', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."complaint_status" AS ENUM('pending', 'under_review', 'resolved', 'dismissed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."media_resource_type" AS ENUM('image', 'raw', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."medical_audit_action" AS ENUM('create', 'read', 'update', 'delete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('administrator', 'caregiver', 'parent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"details" text,
	"mood_rating" smallint,
	"duration_minutes" smallint,
	"logged_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_guardian_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guardian_user_id" uuid NOT NULL,
	"child_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"query_text" text NOT NULL,
	"response_text" text NOT NULL,
	"language_detected" varchar(10),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"date" date NOT NULL,
	"check_in_time" time with time zone,
	"check_out_time" time with time zone,
	"status" "attendance_status" NOT NULL,
	"recorded_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caregiver_classrooms" (
	"caregiver_id" uuid NOT NULL,
	"classroom_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "caregiver_classrooms_caregiver_id_classroom_id_pk" PRIMARY KEY("caregiver_id","classroom_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "caregivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"primary_classroom_id" uuid,
	"is_medical_authorized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "caregivers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "child_guardians" (
	"child_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"relationship_label" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_guardians_child_id_user_id_pk" PRIMARY KEY("child_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "child_media_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caregiver_user_id" uuid NOT NULL,
	"child_id" uuid,
	"classroom_id" uuid,
	"media_asset_id" uuid NOT NULL,
	"media_type" "child_media_type" DEFAULT 'photo' NOT NULL,
	"caption" text,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_of_birth" date NOT NULL,
	"classroom_id" uuid,
	"allergy_flag" boolean DEFAULT false NOT NULL,
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(20),
	"avatar_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classrooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"age_range" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classrooms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" uuid NOT NULL,
	"caregiver_user_id" uuid NOT NULL,
	"child_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"incident_date" timestamp with time zone,
	"proof_asset_id" uuid,
	"status" "complaint_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"resolved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(512) NOT NULL,
	"secure_url" text NOT NULL,
	"resource_type" "media_resource_type" NOT NULL,
	"format" varchar(10),
	"uploaded_by_user_id" uuid,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	CONSTRAINT "media_assets_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medical_record_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medical_record_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" "medical_audit_action" NOT NULL,
	"changed_fields" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"allergies" text,
	"has_severe_allergy" boolean DEFAULT false NOT NULL,
	"chronic_conditions" text,
	"medications" text,
	"immunizations" text,
	"physician_name" varchar(255),
	"physician_contact" varchar(255),
	"special_care_instructions" text,
	"incident_reports" text,
	"last_updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "medical_records_child_id_unique" UNIQUE("child_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_user_id" uuid NOT NULL,
	"classroom_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"avatar_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_logged_by_user_id_users_id_fk" FOREIGN KEY ("logged_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_guardian_sessions" ADD CONSTRAINT "ai_guardian_sessions_guardian_user_id_users_id_fk" FOREIGN KEY ("guardian_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_guardian_sessions" ADD CONSTRAINT "ai_guardian_sessions_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caregiver_classrooms" ADD CONSTRAINT "caregiver_classrooms_caregiver_id_caregivers_id_fk" FOREIGN KEY ("caregiver_id") REFERENCES "public"."caregivers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caregiver_classrooms" ADD CONSTRAINT "caregiver_classrooms_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caregivers" ADD CONSTRAINT "caregivers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "caregivers" ADD CONSTRAINT "caregivers_primary_classroom_id_classrooms_id_fk" FOREIGN KEY ("primary_classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_guardians" ADD CONSTRAINT "child_guardians_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_guardians" ADD CONSTRAINT "child_guardians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_media_posts" ADD CONSTRAINT "child_media_posts_caregiver_user_id_users_id_fk" FOREIGN KEY ("caregiver_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_media_posts" ADD CONSTRAINT "child_media_posts_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_media_posts" ADD CONSTRAINT "child_media_posts_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "child_media_posts" ADD CONSTRAINT "child_media_posts_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "children" ADD CONSTRAINT "children_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "children" ADD CONSTRAINT "children_avatar_asset_id_media_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaints" ADD CONSTRAINT "complaints_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaints" ADD CONSTRAINT "complaints_caregiver_user_id_users_id_fk" FOREIGN KEY ("caregiver_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaints" ADD CONSTRAINT "complaints_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaints" ADD CONSTRAINT "complaints_proof_asset_id_media_assets_id_fk" FOREIGN KEY ("proof_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_record_audit" ADD CONSTRAINT "medical_record_audit_medical_record_id_medical_records_id_fk" FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_record_audit" ADD CONSTRAINT "medical_record_audit_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_last_updated_by_user_id_users_id_fk" FOREIGN KEY ("last_updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notices" ADD CONSTRAINT "notices_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notices" ADD CONSTRAINT "notices_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_avatar_asset_id_media_assets_id_fk" FOREIGN KEY ("avatar_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_logs_child" ON "activity_logs" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_logs_child_time" ON "activity_logs" USING btree ("child_id","logged_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activity_logs_type" ON "activity_logs" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_sessions_guardian_child" ON "ai_guardian_sessions" USING btree ("guardian_user_id","child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_sessions_token" ON "ai_guardian_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_sessions_timestamp" ON "ai_guardian_sessions" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_attendance_child_date" ON "attendance" USING btree ("child_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_child" ON "attendance" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caregiver_classrooms_classroom" ON "caregiver_classrooms" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_caregivers_classroom" ON "caregivers" USING btree ("primary_classroom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_guardians_user" ON "child_guardians" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_media_posts_child" ON "child_media_posts" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_media_posts_classroom" ON "child_media_posts" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_media_posts_caregiver" ON "child_media_posts" USING btree ("caregiver_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_media_posts_captured" ON "child_media_posts" USING btree ("captured_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_children_classroom" ON "children" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_children_allergy_flag" ON "children" USING btree ("allergy_flag");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_parent" ON "complaints" USING btree ("parent_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_caregiver" ON "complaints" USING btree ("caregiver_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_status" ON "complaints" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_complaints_created" ON "complaints" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_media_assets_entity" ON "media_assets" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_media_assets_uploader" ON "media_assets" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_medical_audit_record" ON "medical_record_audit" USING btree ("medical_record_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_medical_audit_actor" ON "medical_record_audit" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_medical_audit_timestamp" ON "medical_record_audit" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_medical_records_severe_allergy" ON "medical_records" USING btree ("has_severe_allergy");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notices_classroom" ON "notices" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notices_published" ON "notices" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_is_active" ON "users" USING btree ("is_active");