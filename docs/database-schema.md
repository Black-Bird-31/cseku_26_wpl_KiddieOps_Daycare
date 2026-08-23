# KiddieOps — Database Schema Documentation

**Version:** 2.0 (Week 2 — Design & Planning)  
**Database:** PostgreSQL  
**ORM:** Drizzle ORM (implementation deferred to Week 3)  
**Source of Truth:** `KiddieOps_SRS.docx` — Section 6 (Data Requirements)

> **Important:** This is a documentation-only artifact. No schema code, migration files, or SQL implementation exists at this stage. This document defines the _intended_ PostgreSQL schema that will be implemented using Drizzle ORM in Week 3.

---

## Table of Contents

1. [Enums](#enums)
2. [users](#users)
3. [caregivers](#caregivers)
4. [classrooms](#classrooms)
5. [children](#children)
6. [child_guardians](#child_guardians)
7. [caregiver_classrooms](#caregiver_classrooms)
8. [attendance](#attendance)
9. [activity_logs](#activity_logs)
10. [child_media_posts](#child_media_posts)
11. [complaints](#complaints)
12. [medical_records](#medical_records)
13. [medical_record_audit](#medical_record_audit)
14. [notices](#notices)
15. [ai_guardian_sessions](#ai_guardian_sessions)
16. [media_assets](#media_assets)
17. [Relationships Summary](#relationships-summary)
18. [Drizzle ORM Compatibility Notes](#drizzle-orm-compatibility-notes)

---

## Enums

PostgreSQL native enums will be defined to constrain allowed values on critical columns. Drizzle ORM supports these via `pgEnum`.

| Enum Name | Values | Used In |
|---|---|---|
| `user_role` | `administrator`, `caregiver`, `parent` | `users.role` |
| `attendance_status` | `present`, `absent`, `late`, `excused` | `attendance.status` |
| `activity_type` | `meal`, `nap`, `diaper_change`, `learning_activity`, `play_activity`, `mood_note`, `other` | `activity_logs.activity_type` |
| `medical_audit_action` | `create`, `read`, `update`, `delete` | `medical_record_audit.action` |
| `media_resource_type` | `image`, `raw`, `video` | `media_assets.resource_type` |
| `complaint_status` | `pending`, `under_review`, `resolved`, `dismissed` | `complaints.status` |
| `child_media_type` | `photo`, `video` | `child_media_posts.media_type` |

---

## users

**Purpose:** Stores all user accounts for all three roles (Administrator, Caregiver, Parent/Guardian). A single table is used because all users share the same authentication mechanism (REQ01–REQ03). Role-specific profile data is stored in the `caregivers` table; parent-child linkage is stored in `child_guardians`.

**SRS References:** REQ01–REQ07, NFR06, Section 6.1

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique user identifier |
| `name` | `VARCHAR(255)` | No | — | | Full display name |
| `email` | `VARCHAR(255)` | No | — | UNIQUE | Login email address |
| `password_hash` | `VARCHAR(255)` | No | — | | bcrypt-hashed password (NFR06) |
| `role` | `user_role` (enum) | No | — | | Determines access rights: `administrator`, `caregiver`, `parent` |
| `is_active` | `BOOLEAN` | No | `true` | | Soft-delete / deactivation flag (REQ06) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |
| `avatar_asset_id` | `UUID` | Yes | `NULL` | FK → `media_assets.id` | Optional profile photo stored via Cloudinary |

**Constraints:**
- `email` must be unique across all users
- `password_hash` must never be empty
- `role` must be one of the defined `user_role` enum values

**Indexes:**
- Primary key index on `id`
- Unique index on `email`
- Index on `role` (for role-based queries)
- Index on `is_active`

---

## caregivers

**Purpose:** Stores caregiver-specific profile data. Every caregiver is also a `user` (role = `caregiver`). This table extends the user with caregiver contact details. A caregiver has one primary assigned classroom; the `caregiver_classrooms` junction table handles any future many-to-many extension.

**SRS References:** REQ11–REQ12, Section 6.3

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique caregiver profile ID |
| `user_id` | `UUID` | No | — | FK → `users.id` UNIQUE | One-to-one link back to the user account |
| `contact_phone` | `VARCHAR(20)` | Yes | `NULL` | | Contact phone number |
| `contact_email` | `VARCHAR(255)` | Yes | `NULL` | | Secondary / work contact email |
| `primary_classroom_id` | `UUID` | Yes | `NULL` | FK → `classrooms.id` | Primary assigned classroom (REQ12) |
| `is_medical_authorized` | `BOOLEAN` | No | `false` | | Whether this caregiver can write medical records (REQ21) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Profile creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |

**Constraints:**
- `user_id` must be unique (one caregiver profile per user)
- `user_id` FK references `users.id` with `ON DELETE CASCADE`
- `primary_classroom_id` FK references `classrooms.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Unique index on `user_id`
- Index on `primary_classroom_id`

---

## classrooms

**Purpose:** Represents a classroom or group within the daycare center. Children are assigned to classrooms (REQ14), and caregivers are assigned to classrooms (REQ12). Notices are scoped to classrooms (REQ26).

**SRS References:** REQ13–REQ14, Section 6.4

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique classroom identifier |
| `name` | `VARCHAR(100)` | No | — | UNIQUE | Classroom/group name (e.g., "Sunflower Group") |
| `age_range` | `VARCHAR(50)` | Yes | `NULL` | | Age range description (e.g., "2–4 years") |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |

**Constraints:**
- `name` must be unique

**Indexes:**
- Primary key on `id`
- Unique index on `name`

---

## children

**Purpose:** Stores child profiles. Each child belongs to one classroom and may have one or more parent/guardian users linked via `child_guardians`. Includes the allergy flag and emergency contact required by SRS Section 6.2.

**SRS References:** REQ08–REQ10, Section 6.2

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique child identifier |
| `name` | `VARCHAR(255)` | No | — | | Child's full name |
| `date_of_birth` | `DATE` | No | — | | Date of birth |
| `classroom_id` | `UUID` | Yes | `NULL` | FK → `classrooms.id` | Assigned classroom (REQ14) |
| `allergy_flag` | `BOOLEAN` | No | `false` | | Quick flag for known allergies (REQ08, REQ24) |
| `emergency_contact_name` | `VARCHAR(255)` | Yes | `NULL` | | Emergency contact person name |
| `emergency_contact_phone` | `VARCHAR(20)` | Yes | `NULL` | | Emergency contact phone |
| `avatar_asset_id` | `UUID` | Yes | `NULL` | FK → `media_assets.id` | Optional child profile photo via Cloudinary |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Profile creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |

**Constraints:**
- `classroom_id` FK references `classrooms.id` with `ON DELETE SET NULL`
- `avatar_asset_id` FK references `media_assets.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Index on `classroom_id`
- Index on `allergy_flag` (for quick medical alert queries — REQ24)

---

## child_guardians

**Purpose:** Many-to-many junction table linking children to their parent/guardian user accounts. A child may have multiple guardians; a guardian user may be linked to multiple children (REQ10, REQ36). The AI Guardian's data isolation is enforced by filtering queries through this table.

**SRS References:** REQ10, REQ36, Section 6.1

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `child_id` | `UUID` | No | — | PK (composite), FK → `children.id` | The child in the relationship |
| `user_id` | `UUID` | No | — | PK (composite), FK → `users.id` | The guardian user |
| `relationship_label` | `VARCHAR(50)` | Yes | `NULL` | | Optional label (e.g., "Mother", "Father", "Grandparent") |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | When the linkage was created |

**Constraints:**
- Composite primary key on `(child_id, user_id)` — each child-guardian pair is unique
- `child_id` FK references `children.id` with `ON DELETE CASCADE`
- `user_id` FK references `users.id` with `ON DELETE CASCADE`
- `user_id` must reference a user with `role = 'parent'` (enforced at application layer)

**Indexes:**
- Composite primary key index on `(child_id, user_id)`
- Index on `user_id` (to quickly find all children for a given guardian — REQ36)

---

## caregiver_classrooms

**Purpose:** Junction table for future many-to-many caregiver-to-classroom assignments. In v1.0, a caregiver has one primary classroom stored on the `caregivers` table. This table provides extensibility without requiring a schema change.

**SRS References:** REQ12

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `caregiver_id` | `UUID` | No | — | PK (composite), FK → `caregivers.id` | The caregiver |
| `classroom_id` | `UUID` | No | — | PK (composite), FK → `classrooms.id` | The classroom |
| `assigned_at` | `TIMESTAMPTZ` | No | `NOW()` | | When the assignment was made |

**Constraints:**
- Composite primary key on `(caregiver_id, classroom_id)`
- `caregiver_id` FK references `caregivers.id` with `ON DELETE CASCADE`
- `classroom_id` FK references `classrooms.id` with `ON DELETE CASCADE`

**Indexes:**
- Composite primary key on `(caregiver_id, classroom_id)`
- Index on `classroom_id`

---

## attendance

**Purpose:** Records daily attendance for each child — check-in time, check-out time, and status. One row per child per date. Parents can view their child's history (REQ16); caregivers record it (REQ15); system may display a monthly summary (REQ17).

**SRS References:** REQ15–REQ17, Section 6.5

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique attendance record ID |
| `child_id` | `UUID` | No | — | FK → `children.id` | The child this record belongs to |
| `date` | `DATE` | No | — | | The calendar date |
| `check_in_time` | `TIMETZ` | Yes | `NULL` | | Time of check-in |
| `check_out_time` | `TIMETZ` | Yes | `NULL` | | Time of check-out |
| `status` | `attendance_status` (enum) | No | — | | `present`, `absent`, `late`, `excused` |
| `recorded_by_user_id` | `UUID` | Yes | `NULL` | FK → `users.id` | Caregiver who recorded the entry |
| `notes` | `TEXT` | Yes | `NULL` | | Optional notes for the record |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |

**Constraints:**
- Unique constraint on `(child_id, date)` — one attendance record per child per day
- `child_id` FK references `children.id` with `ON DELETE CASCADE`
- `recorded_by_user_id` FK references `users.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Unique index on `(child_id, date)`
- Index on `child_id` (for parent dashboard attendance history queries)
- Index on `date` (for daily classroom views)

---

## activity_logs

**Purpose:** Records daily activity log entries per child. Each entry represents a single activity event (one meal, one nap, one diaper change, etc.) logged by a caregiver (REQ18). Parents can view the log (REQ19). The system may compute daily summaries (REQ20).

**SRS References:** REQ18–REQ20, Section 6.6

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique log entry ID |
| `child_id` | `UUID` | No | — | FK → `children.id` | The child this entry is about |
| `logged_at` | `TIMESTAMPTZ` | No | `NOW()` | | Timestamp of when the activity occurred |
| `activity_type` | `activity_type` (enum) | No | — | | Type: `meal`, `nap`, `diaper_change`, `learning_activity`, `play_activity`, `mood_note`, `other` |
| `details` | `TEXT` | Yes | `NULL` | | Free-text details or notes about the activity |
| `mood_rating` | `SMALLINT` | Yes | `NULL` | | Optional mood rating 1–5 (for `mood_note` entries) |
| `duration_minutes` | `SMALLINT` | Yes | `NULL` | | Duration in minutes (relevant for naps) |
| `logged_by_user_id` | `UUID` | No | — | FK → `users.id` | Caregiver who logged the entry |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | DB record creation timestamp |

**Constraints:**
- `child_id` FK references `children.id` with `ON DELETE CASCADE`
- `logged_by_user_id` FK references `users.id` with `ON DELETE RESTRICT` (do not lose who logged it)
- `mood_rating` must be between 1 and 5 if not NULL (`CHECK (mood_rating BETWEEN 1 AND 5)`)
- `duration_minutes` must be positive if not NULL (`CHECK (duration_minutes > 0)`)

**Indexes:**
- Primary key on `id`
- Index on `child_id` (primary query pattern)
- Index on `(child_id, logged_at)` (for date-range queries used by AI Guardian — REQ31, REQ33)
- Index on `activity_type` (for daily summary calculations — REQ20)

---

## child_media_posts

**Purpose:** Stores photos and videos uploaded by caregivers capturing children's daily activities, meals, artwork, playtime, or milestones (REQ40). Parents can view media tagged to their child in a private media gallery (REQ41). All binary files are stored in Cloudinary, with metadata stored in `media_assets`.

**SRS References:** REQ40, REQ41, Section 6.11

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique media post ID |
| `caregiver_user_id` | `UUID` | No | — | FK → `users.id` | Caregiver who captured/uploaded the media |
| `child_id` | `UUID` | Yes | `NULL` | FK → `children.id` | Target child (if post is specific to one child) |
| `classroom_id` | `UUID` | Yes | `NULL` | FK → `classrooms.id` | Target classroom (if post is a group activity moment) |
| `media_asset_id` | `UUID` | No | — | FK → `media_assets.id` | Link to Cloudinary metadata record |
| `media_type` | `child_media_type` (enum) | No | `'photo'` | | `photo` or `video` |
| `caption` | `TEXT` | Yes | `NULL` | | Optional caregiver caption / description |
| `captured_at` | `TIMESTAMPTZ` | No | `NOW()` | | When the moment was captured |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Database insert timestamp |

**Constraints:**
- `caregiver_user_id` FK references `users.id` with `ON DELETE RESTRICT`
- `child_id` FK references `children.id` with `ON DELETE CASCADE`
- `classroom_id` FK references `classrooms.id` with `ON DELETE SET NULL`
- `media_asset_id` FK references `media_assets.id` with `ON DELETE CASCADE`
- At least one of `child_id` or `classroom_id` must be non-null (`CHECK (child_id IS NOT NULL OR classroom_id IS NOT NULL)`)

**Indexes:**
- Primary key on `id`
- Index on `child_id` (primary parent gallery lookup — REQ41)
- Index on `classroom_id` (group moment lookup)
- Index on `caregiver_user_id`
- Index on `captured_at DESC` (chronological feed sorting)

---

## complaints

**Purpose:** Allows parents/guardians to submit formal complaints against caregivers directly to the Administrator (REQ38). Supports attaching photo/document proof (stored in Cloudinary via `media_assets`). Administrators can investigate, track status, and record resolution responses (REQ39).

**SRS References:** REQ38, REQ39, Section 6.10

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique complaint ID |
| `parent_user_id` | `UUID` | No | — | FK → `users.id` | The parent who filed the complaint |
| `caregiver_user_id` | `UUID` | No | — | FK → `users.id` | The caregiver against whom the complaint is filed |
| `child_id` | `UUID` | Yes | `NULL` | FK → `children.id` | Affected child (optional context) |
| `title` | `VARCHAR(255)` | No | — | | Complaint subject / headline |
| `description` | `TEXT` | No | — | | Detailed account of the incident/concern |
| `incident_date` | `TIMESTAMPTZ` | Yes | `NULL` | | Approximate date/time of incident |
| `proof_asset_id` | `UUID` | Yes | `NULL` | FK → `media_assets.id` | Optional proof attachment (photo/document in Cloudinary) |
| `status` | `complaint_status` (enum) | No | `'pending'` | | `pending`, `under_review`, `resolved`, `dismissed` |
| `admin_notes` | `TEXT` | Yes | `NULL` | | Administrator's investigation notes / internal response |
| `resolved_by_user_id` | `UUID` | Yes | `NULL` | FK → `users.id` | Admin who resolved the complaint |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Filing timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |
| `resolved_at` | `TIMESTAMPTZ` | Yes | `NULL` | | Resolution timestamp |

**Constraints:**
- `parent_user_id` FK references `users.id` with `ON DELETE RESTRICT`
- `caregiver_user_id` FK references `users.id` with `ON DELETE RESTRICT`
- `child_id` FK references `children.id` with `ON DELETE SET NULL`
- `proof_asset_id` FK references `media_assets.id` with `ON DELETE SET NULL`
- `resolved_by_user_id` FK references `users.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Index on `parent_user_id` (parent view: my filed complaints — REQ38)
- Index on `caregiver_user_id` (admin view: complaints per staff member)
- Index on `status` (admin triage workflow: pending vs resolved — REQ39)
- Index on `created_at DESC`

---

## medical_records

**Purpose:** Stores a child's medical information. One record per child. Contains allergies, chronic conditions, medications, immunizations, physician contact, and special care instructions (REQ21). Parents have read-only access (REQ22). The allergy flag on `children` is derived from this table's allergy data.

**SRS References:** REQ21–REQ24, Section 6.7

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique medical record ID |
| `child_id` | `UUID` | No | — | FK → `children.id` UNIQUE | One medical record per child |
| `allergies` | `TEXT` | Yes | `NULL` | | Known allergies and reactions |
| `has_severe_allergy` | `BOOLEAN` | No | `false` | | Flag for critical allergy alerts (REQ24) |
| `chronic_conditions` | `TEXT` | Yes | `NULL` | | Ongoing medical conditions |
| `medications` | `TEXT` | Yes | `NULL` | | Current medications and dosages |
| `immunizations` | `TEXT` | Yes | `NULL` | | Immunization history |
| `physician_name` | `VARCHAR(255)` | Yes | `NULL` | | Child's physician name |
| `physician_contact` | `VARCHAR(255)` | Yes | `NULL` | | Physician contact information |
| `special_care_instructions` | `TEXT` | Yes | `NULL` | | Special care or handling notes |
| `incident_reports` | `TEXT` | Yes | `NULL` | | Summary of health incidents at the facility |
| `last_updated_by_user_id` | `UUID` | Yes | `NULL` | FK → `users.id` | Who last updated this record |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |

**Constraints:**
- Unique constraint on `child_id` — one medical record per child
- `child_id` FK references `children.id` with `ON DELETE CASCADE`
- `last_updated_by_user_id` FK references `users.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Unique index on `child_id`
- Index on `has_severe_allergy` (for fast medical alert queries — REQ24)

**Note on Encryption (NFR07):** At-rest encryption of medical fields (`allergies`, `chronic_conditions`, `medications`, `immunizations`, etc.) should be implemented at the PostgreSQL/hosting level (e.g., encrypted tablespace or column-level encryption), or the relevant text fields can be application-level encrypted before storage.

---

## medical_record_audit

**Purpose:** Append-only audit log for all access and changes to medical records. Every read and write to `medical_records` (by any user) must generate an audit row (REQ23). This table must never be updated or deleted — it is insert-only.

**SRS References:** REQ23, Section 6.7

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique audit entry ID |
| `medical_record_id` | `UUID` | No | — | FK → `medical_records.id` | The medical record that was accessed/changed |
| `actor_user_id` | `UUID` | No | — | FK → `users.id` | The user who performed the action |
| `action` | `medical_audit_action` (enum) | No | — | | `create`, `read`, `update`, `delete` |
| `changed_fields` | `TEXT` | Yes | `NULL` | | Optional: which fields were changed (for `update` actions) |
| `timestamp` | `TIMESTAMPTZ` | No | `NOW()` | | When the action occurred |

**Constraints:**
- `medical_record_id` FK references `medical_records.id` with `ON DELETE RESTRICT` (preserve audit even if record is deleted — consider archiving instead)
- `actor_user_id` FK references `users.id` with `ON DELETE RESTRICT`
- This table is **insert-only** — no UPDATE or DELETE permissions should be granted to the application user

**Indexes:**
- Primary key on `id`
- Index on `medical_record_id` (to retrieve audit history for a specific record)
- Index on `actor_user_id` (to find all actions by a specific user)
- Index on `timestamp`

---

## notices

**Purpose:** Stores notices (announcements) published by administrators or authorized caregivers. Notices are scoped to classrooms so parents only see notices relevant to their child's group (REQ25, REQ26).

**SRS References:** REQ25–REQ26, Section 6.8

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique notice ID |
| `title` | `VARCHAR(255)` | No | — | | Notice title |
| `description` | `TEXT` | No | — | | Notice body/content |
| `published_at` | `TIMESTAMPTZ` | No | `NOW()` | | Publication timestamp |
| `author_user_id` | `UUID` | No | — | FK → `users.id` | The user who published the notice |
| `classroom_id` | `UUID` | Yes | `NULL` | FK → `classrooms.id` | If set, scopes the notice to this classroom; NULL means center-wide |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | | DB record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | | Last update timestamp |

**Constraints:**
- `author_user_id` FK references `users.id` with `ON DELETE RESTRICT`
- `classroom_id` FK references `classrooms.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Index on `classroom_id` (for classroom-scoped notice queries — REQ26)
- Index on `published_at DESC` (for ordered notice lists)
- Index on `author_user_id`

---

## ai_guardian_sessions

**Purpose:** Persists every AI Guardian query and response for audit purposes (REQ37). Each row is one turn in a parent's conversation. The `session_token` groups turns within the same conversation (REQ32).

**SRS References:** REQ30–REQ37, Section 6.9

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique session entry ID |
| `guardian_user_id` | `UUID` | No | — | FK → `users.id` | The parent/guardian who asked the question |
| `child_id` | `UUID` | No | — | FK → `children.id` | The child the question is about |
| `session_token` | `VARCHAR(255)` | No | — | | Groups multiple turns into one conversation (REQ32) |
| `query_text` | `TEXT` | No | — | | The parent's natural-language question |
| `response_text` | `TEXT` | No | — | | Claude API's synthesized response |
| `language_detected` | `VARCHAR(10)` | Yes | `NULL` | | Detected language: `en`, `bn`, etc. (REQ35) |
| `timestamp` | `TIMESTAMPTZ` | No | `NOW()` | | When the exchange occurred |

**Constraints:**
- `guardian_user_id` FK references `users.id` with `ON DELETE RESTRICT`
- `child_id` FK references `children.id` with `ON DELETE RESTRICT`
- The application layer must verify `(guardian_user_id, child_id)` exists in `child_guardians` before inserting (REQ36)

**Indexes:**
- Primary key on `id`
- Index on `(guardian_user_id, child_id)` (for per-guardian per-child session history)
- Index on `session_token` (to retrieve turns in the same conversation — REQ32)
- Index on `timestamp DESC` (for ordered session retrieval)

---

## media_assets

**Purpose:** Stores Cloudinary metadata for all uploaded files. PostgreSQL never stores binary file data — only the Cloudinary identifiers and metadata. Other tables reference this table by FK when they have an associated media asset.

**SRS References:** NFR07 (file storage); Cloudinary integration decision (Week 2)

| Column | Type | Nullable | Default | Key | Description |
|---|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | PK | Unique media asset ID |
| `public_id` | `VARCHAR(512)` | No | — | UNIQUE | Cloudinary `public_id` — used to reference the asset in Cloudinary |
| `secure_url` | `TEXT` | No | — | | HTTPS URL to the asset on Cloudinary CDN |
| `resource_type` | `media_resource_type` (enum) | No | — | | `image`, `raw`, `video` |
| `format` | `VARCHAR(10)` | Yes | `NULL` | | File format extension (e.g., `jpg`, `pdf`, `png`, `mp4`) |
| `uploaded_by_user_id` | `UUID` | Yes | `NULL` | FK → `users.id` | The user who uploaded the file |
| `uploaded_at` | `TIMESTAMPTZ` | No | `NOW()` | | Upload timestamp |
| `entity_type` | `VARCHAR(50)` | Yes | `NULL` | | Optional: which entity this belongs to (e.g., `child`, `caregiver`, `user`, `complaint`, `child_media_post`) |
| `entity_id` | `UUID` | Yes | `NULL` | | Optional: ID of the linked entity |

**Constraints:**
- `public_id` must be unique (Cloudinary guarantees this, but we enforce it at DB level)
- `uploaded_by_user_id` FK references `users.id` with `ON DELETE SET NULL`

**Indexes:**
- Primary key on `id`
- Unique index on `public_id`
- Index on `(entity_type, entity_id)` (for retrieving all assets belonging to an entity)
- Index on `uploaded_by_user_id`

---

## Relationships Summary

| Relationship | Type | Tables | Notes |
|---|---|---|---|
| User → Caregiver | One-to-One | `users` → `caregivers` | Via `caregivers.user_id` |
| Child → Classroom | Many-to-One | `children` → `classrooms` | Via `children.classroom_id` |
| Child ↔ Guardian | Many-to-Many | `children` ↔ `users` | Via `child_guardians` junction |
| Caregiver ↔ Classroom | Many-to-Many | `caregivers` ↔ `classrooms` | Via `caregiver_classrooms` junction |
| Child → Attendance | One-to-Many | `children` → `attendance` | One record per child per date |
| Child → Activity Logs | One-to-Many | `children` → `activity_logs` | Many log entries per child per day |
| Caregiver → Media Posts | One-to-Many | `users` → `child_media_posts` | Caregiver posts photo/video of children |
| Child → Media Posts | One-to-Many | `children` → `child_media_posts` | Media tagged to a specific child |
| Classroom → Media Posts | One-to-Many | `classrooms` → `child_media_posts` | Media tagged to a group moment |
| Parent → Complaints | One-to-Many | `users` (Parent) → `complaints` | Parent files complaint against a caregiver |
| Caregiver → Complaints | One-to-Many | `users` (Caregiver) → `complaints` | Caregiver targeted in complaint |
| Complaint → Proof Asset | Many-to-One | `complaints` → `media_assets` | Attached photo/document proof |
| Child → Medical Record | One-to-One | `children` → `medical_records` | One medical record per child |
| Medical Record → Audit | One-to-Many | `medical_records` → `medical_record_audit` | Append-only audit history |
| Classroom → Notices | One-to-Many | `classrooms` → `notices` | Optional; NULL = center-wide notice |
| Guardian + Child → AI Sessions | Many-to-Many over time | `users` + `children` → `ai_guardian_sessions` | Each row = one Q&A turn |
| Entity → Media | One-to-One or One-to-Many | `children`/`users`/`caregivers`/`complaints` → `media_assets` | Via FK on owning table or `entity_type` + `entity_id` |

---

## Drizzle ORM Compatibility Notes

This schema is designed to be implemented directly with Drizzle ORM. Key compatibility considerations:

| Feature | Drizzle ORM Approach |
|---|---|
| UUID primary keys | `uuid('id').primaryKey().defaultRandom()` |
| PostgreSQL enums | `pgEnum('user_role', ['administrator', 'caregiver', 'parent'])`, `pgEnum('complaint_status', ['pending', 'under_review', 'resolved', 'dismissed'])`, `pgEnum('child_media_type', ['photo', 'video'])` |
| Timestamps with timezone | `timestamp('created_at', { withTimezone: true }).defaultNow()` |
| Foreign keys | `references(() => users.id, { onDelete: 'cascade' })` |
| Unique constraints | `.unique()` on column or `uniqueIndex()` |
| Composite primary keys | `primaryKey({ columns: [table.childId, table.userId] })` |
| Check constraints | Defined in migration SQL manually (Drizzle does not natively generate CHECK constraints yet) |
| Relations | Defined separately in `relations()` export for join queries |
| Soft deletes | `boolean('is_active').default(true).notNull()` |
| Indexes | `index('idx_name').on(table.column)` in schema definition |
| Migrations | `drizzle-kit generate` creates SQL migration files; `drizzle-kit migrate` applies them |

> No Drizzle ORM code has been written. The above table documents the intended mapping for Week 3 implementation.
