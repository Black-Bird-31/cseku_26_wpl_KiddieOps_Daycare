# KiddieOps — Entity-Relationship Diagram

**Version:** 2.0 (Week 2 — Design & Planning)  
**Source:** `KiddieOps_SRS.docx` — Section 6 (Data Requirements)  
**Schema reference:** [`database-schema.md`](database-schema.md)

> This ER diagram is a documentation artifact only. It represents the intended PostgreSQL relational schema to be implemented with Drizzle ORM in Week 3. No database code exists yet.

---

## Full ER Diagram

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR password_hash
        user_role role
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        UUID avatar_asset_id FK
    }

    caregivers {
        UUID id PK
        UUID user_id FK UK
        VARCHAR contact_phone
        VARCHAR contact_email
        UUID primary_classroom_id FK
        BOOLEAN is_medical_authorized
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    classrooms {
        UUID id PK
        VARCHAR name UK
        VARCHAR age_range
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    children {
        UUID id PK
        VARCHAR name
        DATE date_of_birth
        UUID classroom_id FK
        BOOLEAN allergy_flag
        VARCHAR emergency_contact_name
        VARCHAR emergency_contact_phone
        UUID avatar_asset_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    child_guardians {
        UUID child_id FK
        UUID user_id FK
        VARCHAR relationship_label
        TIMESTAMPTZ created_at
    }

    caregiver_classrooms {
        UUID caregiver_id FK
        UUID classroom_id FK
        TIMESTAMPTZ assigned_at
    }

    attendance {
        UUID id PK
        UUID child_id FK
        DATE date
        TIMETZ check_in_time
        TIMETZ check_out_time
        attendance_status status
        UUID recorded_by_user_id FK
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    activity_logs {
        UUID id PK
        UUID child_id FK
        TIMESTAMPTZ logged_at
        activity_type activity_type
        TEXT details
        SMALLINT mood_rating
        SMALLINT duration_minutes
        UUID logged_by_user_id FK
        TIMESTAMPTZ created_at
    }

    child_media_posts {
        UUID id PK
        UUID caregiver_user_id FK
        UUID child_id FK
        UUID classroom_id FK
        UUID media_asset_id FK
        child_media_type media_type
        TEXT caption
        TIMESTAMPTZ captured_at
        TIMESTAMPTZ created_at
    }

    complaints {
        UUID id PK
        UUID parent_user_id FK
        UUID caregiver_user_id FK
        UUID child_id FK
        VARCHAR title
        TEXT description
        TIMESTAMPTZ incident_date
        UUID proof_asset_id FK
        complaint_status status
        TEXT admin_notes
        UUID resolved_by_user_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ resolved_at
    }

    medical_records {
        UUID id PK
        UUID child_id FK UK
        TEXT allergies
        BOOLEAN has_severe_allergy
        TEXT chronic_conditions
        TEXT medications
        TEXT immunizations
        VARCHAR physician_name
        VARCHAR physician_contact
        TEXT special_care_instructions
        TEXT incident_reports
        UUID last_updated_by_user_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    medical_record_audit {
        UUID id PK
        UUID medical_record_id FK
        UUID actor_user_id FK
        medical_audit_action action
        TEXT changed_fields
        TIMESTAMPTZ timestamp
    }

    notices {
        UUID id PK
        VARCHAR title
        TEXT description
        TIMESTAMPTZ published_at
        UUID author_user_id FK
        UUID classroom_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    ai_guardian_sessions {
        UUID id PK
        UUID guardian_user_id FK
        UUID child_id FK
        VARCHAR session_token
        TEXT query_text
        TEXT response_text
        VARCHAR language_detected
        TIMESTAMPTZ timestamp
    }

    media_assets {
        UUID id PK
        VARCHAR public_id UK
        TEXT secure_url
        media_resource_type resource_type
        VARCHAR format
        UUID uploaded_by_user_id FK
        TIMESTAMPTZ uploaded_at
        VARCHAR entity_type
        UUID entity_id
    }

    %% ── User ↔ Role-Specific Extensions ──────────────────────────────────
    users ||--o| caregivers : "has caregiver profile"

    %% ── User ↔ Media ──────────────────────────────────────────────────────
    users }o--o| media_assets : "avatar_asset_id"
    media_assets }o--o| users : "uploaded_by"

    %% ── Classroom relationships ────────────────────────────────────────────
    caregivers }o--o| classrooms : "primary_classroom_id"
    caregivers }o--o{ classrooms : "caregiver_classrooms"

    %% ── Child relationships ────────────────────────────────────────────────
    classrooms ||--o{ children : "has children"
    children }o--o| media_assets : "avatar_asset_id"

    %% ── Child ↔ Guardian (many-to-many) ───────────────────────────────────
    children }o--o{ users : "child_guardians"

    %% ── Attendance ────────────────────────────────────────────────────────
    children ||--o{ attendance : "has attendance records"
    users ||--o{ attendance : "recorded_by"

    %% ── Activity Logs ─────────────────────────────────────────────────────
    children ||--o{ activity_logs : "has activity logs"
    users ||--o{ activity_logs : "logged_by"

    %% ── Child Media & Moments (Photo/Video) ───────────────────────────────
    users ||--o{ child_media_posts : "caregiver uploads"
    children ||--o{ child_media_posts : "tagged child"
    classrooms ||--o{ child_media_posts : "tagged classroom"
    child_media_posts ||--|| media_assets : "media_asset_id"

    %% ── Complaints with Proof Attachments ────────────────────────────────
    users ||--o{ complaints : "parent files"
    users ||--o{ complaints : "caregiver target"
    users ||--o{ complaints : "resolved_by admin"
    children ||--o{ complaints : "child context"
    complaints }o--o| media_assets : "proof_asset_id"

    %% ── Medical Records ───────────────────────────────────────────────────
    children ||--o| medical_records : "has one medical record"
    users ||--o{ medical_records : "last_updated_by"
    medical_records ||--o{ medical_record_audit : "has audit entries"
    users ||--o{ medical_record_audit : "performed by actor"

    %% ── Notices ───────────────────────────────────────────────────────────
    users ||--o{ notices : "authored by"
    classrooms ||--o{ notices : "scoped to classroom"

    %% ── AI Guardian Sessions ──────────────────────────────────────────────
    users ||--o{ ai_guardian_sessions : "guardian asks"
    children ||--o{ ai_guardian_sessions : "subject of session"
```

---

## Entity Descriptions

| Entity | Role in System | SRS Reference |
|---|---|---|
| `users` | All accounts: administrators, caregivers, parent/guardians | REQ01–REQ07, §6.1 |
| `caregivers` | Extends `users` with caregiver-specific data | REQ11–REQ12, §6.3 |
| `classrooms` | Groups/rooms children are enrolled in | REQ13–REQ14, §6.4 |
| `children` | Core child profile data | REQ08–REQ10, §6.2 |
| `child_guardians` | Links children to parent/guardian accounts (many-to-many) | REQ10, REQ36 |
| `caregiver_classrooms` | Links caregivers to classrooms (many-to-many, extensibility) | REQ12 |
| `attendance` | Daily check-in/check-out records per child | REQ15–REQ17, §6.5 |
| `activity_logs` | Daily activity events per child (meals, naps, etc.) | REQ18–REQ20, §6.6 |
| `child_media_posts` | Photos and videos uploaded by caregivers for kids/classrooms | REQ40–REQ41, §6.11 |
| `complaints` | Parent complaints filed against caregivers with proof attachments & admin resolution | REQ38–REQ39, §6.10 |
| `medical_records` | Child's complete medical profile (one per child) | REQ21–REQ24, §6.7 |
| `medical_record_audit` | Insert-only audit trail of all medical record access/changes | REQ23, §6.7 |
| `notices` | Daycare announcements, scoped to classroom or center-wide | REQ25–REQ26, §6.8 |
| `ai_guardian_sessions` | Persisted AI Guardian Q&A turns for audit (REQ37) and follow-up context (REQ32) | REQ30–REQ37, §6.9 |
| `media_assets` | Cloudinary metadata only — avatar, proof files, activity photos/videos | Cloudinary integration |

---

## Key Cardinality Rules

| Relationship | Cardinality | Note |
|---|---|---|
| `users` → `caregivers` | 1 : 0..1 | A user who is a caregiver has exactly one caregiver profile |
| `children` → `classrooms` | Many : 1 | Many children per classroom; one classroom per child |
| `children` ↔ `users` (guardians) | Many : Many | Via `child_guardians`; one child can have multiple guardians, one guardian can have multiple children |
| `caregivers` ↔ `classrooms` | Many : Many | Via `caregiver_classrooms`; primary classroom also on `caregivers` table |
| `children` → `attendance` | 1 : Many | One attendance record per child per date (unique constraint) |
| `children` → `activity_logs` | 1 : Many | Many log entries per child per day |
| `caregivers` → `child_media_posts` | 1 : Many | Caregiver can post multiple photos/videos of kids |
| `children` → `child_media_posts` | 1 : Many | Child has multiple tagged photos/videos in gallery |
| `parents` → `complaints` | 1 : Many | Parent can file complaints against caregivers with proof |
| `caregivers` → `complaints` | 1 : Many | Caregiver can be target of multiple complaints |
| `complaints` → `media_assets` | Many : 0..1 | Optional proof attachment in Cloudinary |
| `children` → `medical_records` | 1 : 1 | Exactly one medical record per child (unique constraint on `child_id`) |
| `medical_records` → `medical_record_audit` | 1 : Many | Every access generates an audit row |
| `classrooms` → `notices` | 1 : Many | Notices scoped to a classroom; NULL classroom_id = center-wide |
| `children` → `ai_guardian_sessions` | 1 : Many | Many Q&A sessions per child over time |
