# KiddieOps — System Architecture

**Version:** 2.0 (Week 2 — Design & Planning)  
**Stack:** Next.js · TypeScript · Drizzle ORM · PostgreSQL · Cloudinary

This document describes the planned technical architecture for KiddieOps v1.0. It should be read alongside `KiddieOps_SRS.docx` for full requirement context — REQ/NFR IDs are referenced throughout so implementation choices trace back to a specific requirement.

---

## 1. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                           │
│                                                                    │
│   Next.js App Router — Server Components + Client Components       │
│   Role-scoped dashboards: Admin | Caregiver | Parent/Guardian      │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTP/HTTPS (Server Actions / Route Handlers)
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                            │
│                                                                    │
│   Next.js API Route Handlers & Server Actions                      │
│   ─ Authentication (NextAuth.js / JWT)                             │
│   ─ Role-Based Access Control (RBAC) middleware                    │
│   ─ Domain service modules (see §2.3)                              │
│   ─ Input validation (Zod)                                         │
│   ─ Audit logging (medical records, AI Guardian queries)           │
└───────────────┬───────────────────────────────────────┬────────────┘
                │                                       │
                ▼                                       ▼
┌──────────────────────────────┐         ┌─────────────────────────────┐
│          DATA LAYER          │         │        MEDIA LAYER          │
│                              │         │                             │
│   Drizzle ORM                │         │   Cloudinary                │
│      ↓                       │         │   ─ Image/file upload       │
│   PostgreSQL                 │         │   ─ public_id + secure_url  │
│   ─ Relational schema        │         │     stored in PostgreSQL    │
│   ─ FK constraints           │         │   ─ Profile photos          │
│   ─ Transactions             │         │   ─ Document attachments    │
│   ─ Indexes                  │         └─────────────────────────────┘
│   ─ Encrypted at rest (NFR07)│
└──────────────────────────────┘
                │
                │  (scoped child data read — REQ36)
                ▼
┌────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL AI SERVICE                            │
│                                                                    │
│   Claude API (Anthropic)                                           │
│   ─ AI Guardian Assistant (REQ30–REQ37)                            │
│   ─ Never called directly from the browser                         │
│   ─ Always via the server-side Application Layer                   │
└────────────────────────────────────────────────────────────────────┘
```

The system is a **Next.js full-stack application** using the App Router with Server Components, Server Actions, and Route Handlers. There is no separate Express backend — all API and business logic runs inside Next.js. The data layer is PostgreSQL accessed exclusively through Drizzle ORM.

---

## 2. Layer-by-Layer Component Detail

### 2.1 Presentation Layer (Next.js — App Router)

| Concern | Detail |
|---|---|
| Framework | Next.js 14+ with App Router |
| Language | TypeScript |
| Rendering | Server Components by default; Client Components where interactivity is needed |
| Styling | Vanilla CSS (mobile-first, responsive) |
| Routing | File-system routing via `app/` directory |
| Auth pages | `/login` — common entry point (REQ01) |
| Role-scoped routes | `/admin/...`, `/caregiver/...`, `/parent/...` |
| Layouts | Per-role root layouts that render role-appropriate navigation |

**Key pages / route segments** (derived from SRS Section 3 & EI01):

| Route | Primary Role(s) | SRS Ref |
|---|---|---|
| `/login` | All | REQ01–REQ03 |
| `/admin/dashboard` | Administrator | REQ29 |
| `/admin/users` | Administrator | REQ04–REQ07 |
| `/admin/children` | Administrator | REQ08–REQ10 |
| `/admin/caregivers` | Administrator | REQ11–REQ12 |
| `/admin/classrooms` | Administrator | REQ13–REQ14 |
| `/admin/notices` | Administrator | REQ25 |
| `/admin/medical-records` | Administrator | REQ21 |
| `/admin/complaints` | Administrator | REQ39 |
| `/caregiver/dashboard` | Caregiver | REQ28 |
| `/caregiver/attendance` | Caregiver | REQ15–REQ17 |
| `/caregiver/activity-logs` | Caregiver | REQ18–REQ20 |
| `/caregiver/media` | Caregiver | REQ40 |
| `/caregiver/medical-records` | Authorized Caregiver | REQ21 |
| `/caregiver/notices` | Caregiver | REQ25 |
| `/parent/dashboard` | Parent/Guardian | REQ27 |
| `/parent/child` | Parent/Guardian | REQ10 |
| `/parent/attendance` | Parent/Guardian | REQ16 |
| `/parent/activity-logs` | Parent/Guardian | REQ19 |
| `/parent/gallery` | Parent/Guardian | REQ41 |
| `/parent/complaints` | Parent/Guardian | REQ38 |
| `/parent/medical-records` | Parent/Guardian | REQ22 |
| `/parent/notices` | Parent/Guardian | REQ26 |
| `/parent/ai-guardian` | Parent/Guardian | REQ30–REQ37, EI02 |

**Reusable UI Component Categories:**

- `AuthGuard` — redirects unauthenticated/wrong-role users (REQ03)
- `ChildCard` — displays child summary (REQ08, REQ10)
- `AttendanceTable` — caregiver and parent views (REQ15, REQ16)
- `ActivityLogForm` / `ActivityLogList` — logging and viewing (REQ18, REQ19)
- `MediaUploader` / `MediaGalleryGrid` — photo/video capture and parent gallery (REQ40, REQ41)
- `ComplaintForm` / `ComplaintManagementTable` — parent filing with proof and admin resolution (REQ38, REQ39)
- `MedicalRecordViewer` / `MedicalRecordEditor` — read vs write (REQ21, REQ22)
- `NoticeBoard` — notice display (REQ25, REQ26)
- `AIGuardianChat` — chat interface with child selector (EI02)
- `DashboardWidget` — summary cards for dashboards
- `AlertBadge` — critical medical flags (REQ24)

---

### 2.2 Application Layer (Server Actions & Route Handlers)

The application layer runs exclusively server-side within Next.js. It handles:

**Authentication & Authorization (REQ01–REQ03, NFR04–NFR06)**

- User login: credential validation, session creation
- JWT or session tokens with role embedded
- Middleware-based route protection (`middleware.ts`) — checks auth and role on every request to protected routes
- Passwords hashed with bcrypt (NFR06); never logged or returned in responses

**Authorization (RBAC) Rules:**

- `Administrator` — full CRUD on users, children, caregivers, classrooms, notices; read/write medical records; view all reports; review, investigate, and resolve parent complaints (REQ39)
- `Caregiver` — read own classroom/children; write attendance and activity logs for assigned children; upload photos/videos of children (REQ40); write medical records only if explicitly authorized
- `Parent/Guardian` — read-only access scoped strictly to own child(ren); submit formal complaints with proof against caregivers (REQ38); view photos/videos of own child in media gallery (REQ41); AI Guardian chat scoped to own child(ren)

**Input Validation (NFR08):**

- Zod schemas validate all form/API inputs on the server
- Client-side validation mirrors server schemas for UX

**Business Logic / Domain Services:**

| Service Module | Responsibility | SRS Ref |
|---|---|---|
| `AuthService` | Login, logout, session management | REQ01–REQ03 |
| `UserService` | Create/update/deactivate user accounts | REQ04–REQ07 |
| `ChildService` | Child profile CRUD; guardian linkage | REQ08–REQ10 |
| `CaregiverService` | Caregiver profile CRUD; classroom assignment | REQ11–REQ12 |
| `ClassroomService` | Classroom CRUD; child assignment | REQ13–REQ14 |
| `AttendanceService` | Record check-in/check-out; attendance history | REQ15–REQ17 |
| `ActivityLogService` | Log daily activities; compute daily summaries | REQ18–REQ20 |
| `ChildMediaService` | Upload child photos/videos; tag children/classes; retrieve isolated gallery feed | REQ40–REQ41 |
| `ComplaintService` | File complaints with proof attachments; manage investigation status & admin responses | REQ38–REQ39 |
| `MedicalRecordService` | Read/write medical records; enforce write authorization; trigger audit log | REQ21–REQ24 |
| `MedicalAuditService` | Write audit entries on every medical record access/change | REQ23 |
| `NoticeService` | Publish and retrieve notices by classroom | REQ25–REQ26 |
| `AIGuardianService` | Gather scoped child data, call Claude API, persist session, enforce data isolation | REQ30–REQ37 |
| `MediaService` | Upload files to Cloudinary; store metadata in PostgreSQL | — |

**Audit Logging (REQ23, REQ37):**

- Every medical record read and write records: `actor_user_id`, `action`, `timestamp`
- Every AI Guardian query and response is persisted: `guardian_user_id`, `child_id`, `query`, `response`, `timestamp`
- Every complaint submission and administrative status change is logged with actor ID and timestamp

---

### 2.3 Domain Modules

The following domain modules are derived directly from SRS Section 3 (Functional Requirements) and Section 6 (Data Requirements).

| Module | Description | Key SRS Requirements |
|---|---|---|
| **Authentication & Access Control** | Login, role identification, RBAC | REQ01–REQ03 |
| **User Management** | Admin creates/updates/deactivates user accounts; assigns roles | REQ04–REQ07 |
| **Child Management** | Child profile lifecycle; guardian linking; allergy flag | REQ08–REQ10 |
| **Caregiver Management** | Caregiver profiles; classroom assignment | REQ11–REQ12 |
| **Classroom / Group Management** | Create/update groups; assign children and caregivers | REQ13–REQ14 |
| **Attendance Management** | Daily check-in/check-out; status; history; monthly summary | REQ15–REQ17 |
| **Daily Activity Logging** | Meals, naps, diaper changes, play/learning, mood; daily summaries | REQ18–REQ20 |
| **Child Media & Moment Sharing** | Caregiver photo/video capture & upload; parent private gallery feed | REQ40–REQ41 |
| **Complaint Management** | Parent complaints with proof against caregivers; admin resolution workflow | REQ38–REQ39 |
| **Medical Records Management** | Allergies, conditions, medications, immunizations, physician, incidents; access control; audit; alerts | REQ21–REQ24 |
| **Notice Management** | Publish notices; view notices scoped to classroom | REQ25–REQ26 |
| **Dashboards** | Role-specific landing pages with summaries | REQ27–REQ29 |
| **AI Guardian Assistant** | Natural-language Q&A; Claude API; data isolation; follow-up; bilingual | REQ30–REQ37, EI02 |

---

### 2.4 Data Layer (Drizzle ORM + PostgreSQL)

| Concern | Detail |
|---|---|
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Connection | Drizzle client initialized in a singleton module (`lib/db.ts`) |
| Schema definition | TypeScript Drizzle schema files (`lib/schema/*.ts`) |
| Migrations | Drizzle Kit (`drizzle-kit generate`, `drizzle-kit migrate`) |
| Transactions | `db.transaction(async (tx) => { ... })` for multi-step writes |
| Primary keys | UUID (`gen_random_uuid()`) on all tables |
| Timestamps | `created_at`, `updated_at` with `DEFAULT NOW()` on appropriate tables |
| Soft deletes | `is_active` boolean flag on `users` for deactivation (REQ06) |
| Enums | PostgreSQL native enums via Drizzle `pgEnum` (e.g., `user_role`, `attendance_status`, `activity_type`, `complaint_status`, `child_media_type`) |
| Indexes | On foreign keys and frequently-queried columns |
| Constraints | FK constraints with appropriate cascade rules; unique constraints on email |

Full table definitions are documented in [`database-schema.md`](database-schema.md).

---

### 2.5 Media Layer (Cloudinary)

Cloudinary handles all binary file storage. PostgreSQL stores only Cloudinary metadata — never binary data.

| Concern | Detail |
|---|---|
| Provider | Cloudinary |
| SDK | Cloudinary Node.js SDK (server-side only) |
| Upload entry point | `MediaService` — invoked from Server Actions / Route Handlers |
| Files stored | Profile photos (children, caregivers, users); medical document attachments; **complaint proof attachments (photos/documents)**; **child activity photos & videos uploaded by caregivers** |
| Metadata persisted in PostgreSQL | `public_id`, `secure_url`, `resource_type`, `format`, `uploaded_at`, linked entity ID |

**Media reference pattern:**
- **Child & User Avatars:** Reference `media_assets` record via FK (`avatar_asset_id`).
- **Complaint Proof Attachments:** The `complaints` table references `media_assets.id` (`proof_asset_id`) for attached evidence.
- **Child Photos & Videos:** The `child_media_posts` table links each post to a `media_assets` record, tagging the child and/or classroom for isolated gallery rendering.

See the `media_assets`, `complaints`, and `child_media_posts` tables in [`database-schema.md`](database-schema.md).

---

### 2.6 External AI Service (Claude API)

- The backend (`AIGuardianService` running in Next.js Server Actions) calls the Claude API — **never** the browser.
- The Anthropic API key lives in server-side environment variables, never exposed to the client.

**AI Guardian Query Flow (REQ30–REQ37):**

1. Parent submits a natural-language question via the chat UI (EI02).
2. `AIGuardianService` verifies the requesting user is a guardian linked to the requested child (REQ36).
3. Service gathers that child's scoped data: recent attendance, activity logs, media moments, medical records.
4. Service constructs a Claude API prompt including the question and the scoped context.
5. Claude API returns a synthesized natural-language answer.
6. Service persists the query + response in `ai_guardian_sessions` (REQ37).
7. Response is returned to the parent's chat UI.

**Follow-up / Session Context (REQ32):** Recent turns in the active session are appended to the Claude API prompt.

**Bilingual Support (REQ35):** The system prompt instructs Claude to respond in the parent's language (Bangla or English). No separate translation service.

**Data Isolation (REQ36):** Every Claude API call is constructed using only the single target child's data — scoped at the database query layer, not just the prompt.

---

## 3. Security Architecture (NFR04–NFR08)

| Control | Implementation |
|---|---|
| Password storage | bcrypt hashing; never logged or returned (NFR06) |
| Session / tokens | NextAuth.js session; role re-validated on sensitive operations |
| Route protection | `middleware.ts` enforces authentication and role on every request |
| Medical records | Explicit ownership/authorization check on every access — role alone is insufficient (REQ21, REQ22) |
| Child media isolation | Caregiver uploads are tagged by child/classroom; parents only access photos/videos linked to their child (REQ40, REQ41) |
| Complaint security | Complaints visible only to filing parent and administrator; target caregiver cannot delete complaints (REQ38, REQ39) |
| AI Guardian isolation | DB-layer scoping per guardian → child link (REQ36) |
| Transport security | HTTPS for all traffic |
| Data at rest | Medical records and sensitive child data encrypted (NFR07) |
| Input validation | Zod schemas on server; mirrored client-side (NFR08) |
| SQL injection prevention | Drizzle ORM parameterized queries |
| Audit trail | Medical record and AI Guardian events logged with actor identity + timestamp (REQ23, REQ37) |

---

## 4. Project Directory Structure (Planned)

```
kiddieops/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── children/
│   │   ├── caregivers/
│   │   ├── classrooms/
│   │   ├── notices/
│   │   ├── complaints/           # Admin complaint review (REQ39)
│   │   └── medical-records/
│   ├── caregiver/
│   │   ├── dashboard/
│   │   ├── attendance/
│   │   ├── activity-logs/
│   │   ├── media/                # Photo/video uploader (REQ40)
│   │   ├── medical-records/
│   │   └── notices/
│   ├── parent/
│   │   ├── dashboard/
│   │   ├── child/
│   │   ├── attendance/
│   │   ├── activity-logs/
│   │   ├── gallery/              # Child photo/video feed (REQ41)
│   │   ├── complaints/           # Submit complaint with proof (REQ38)
│   │   ├── medical-records/
│   │   ├── notices/
│   │   └── ai-guardian/
│   ├── api/                      # Route Handlers
│   └── layout.tsx
├── components/
│   ├── ui/                       # Base design system components
│   └── domain/                   # Feature-specific components
├── lib/
│   ├── db.ts                     # Drizzle client singleton
│   ├── schema/                   # Drizzle schema files (TypeScript)
│   ├── services/                 # Domain service modules
│   ├── validations/              # Zod validation schemas
│   └── cloudinary.ts             # Cloudinary SDK client
├── middleware.ts                 # Auth + RBAC route protection
├── docs/
│   ├── KiddieOps_SRS.docx
│   ├── architechture.md          # This file
│   ├── database-schema.md
│   ├── er-diagram.md
│   ├── flowcharts.md
│   ├── ui-wireframes.md
│   ├── wireframes-canvas.html
│   ├── wireframes.md
│   ├── api-contract.md
│   └── tasks.md
├── drizzle.config.ts
├── next.config.ts
├── tsconfig.json
├── CONTRIBUTING.md
└── README.md
```

---

## 5. Environment Variables (Planned)

```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kiddieops

# Authentication
NEXTAUTH_SECRET=change-me
NEXTAUTH_URL=http://localhost:3000

# AI Guardian
ANTHROPIC_API_KEY=your-claude-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 6. Week 2 Decisions Made

| Decision | Resolution |
|---|---|
| Framework | Next.js (full-stack — replaces separate Express backend) |
| ORM | Drizzle ORM (replaces Prisma/Sequelize — was open in Week 1) |
| Database | PostgreSQL |
| Image/file storage | Cloudinary |
| Auth library | NextAuth.js (to be finalized during implementation) |
| Caregiver ↔ classroom | One primary classroom per caregiver; can extend to many-to-many if needed |
| AI Guardian context window | Last N turns of the active session (N to be tuned during Sprint 3) |

---

## 7. Open Questions / Decisions for Week 3+

- [ ] Exact hosting target: Vercel (frontend + serverless) + Neon/Railway (PostgreSQL) vs. single VPS
- [ ] NextAuth.js vs. custom JWT implementation
- [ ] Drizzle Kit migration workflow (automatic vs. manual review of generated SQL)
- [ ] Cloudinary upload strategy (signed vs. unsigned uploads for admin-facing forms)
- [ ] Exact conversation context window size for Claude API follow-up (REQ32)
