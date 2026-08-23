# KiddieOps — Task List / Sprint Backlog

Tracks work by sprint. Each task references its REQ/NFR ID from `KiddieOps_SRS.docx` where applicable, so progress traces back to the SRS. Move items between status columns as you work; keep this file as the single source of truth for "what's next."

Status legend: `☐` To do · `🔄` In progress · `✅` Done

---

## Week 1 — Initiation & SRS

- ✅ Define scope, objectives, and user roles
- ✅ Rename project from DaycareOS to KiddieOps
- ✅ Restructure SRS with sequential REQ IDs (REQ01–REQ37, NFR01–NFR12, EI01–EI02) and MoSCoW priority
- ✅ Build requirement traceability matrix
- ✅ Create repo documentation: README.md, CONTRIBUTING.md, docs/architecture.md, docs/tasks.md

## Week 2 — Design & Planning

- ✅ Finalize database schema / ER diagram — documented in `docs/database-schema.md` and `docs/er-diagram.md`
- ✅ Choose ORM — **Drizzle ORM** (decided Week 2)
- ✅ Finalize tech stack — **Next.js + TypeScript + Drizzle ORM + PostgreSQL + Cloudinary**
- ✅ Update `docs/architechture.md` to v2.0 (reflects new stack)
- ✅ Wireframe: Login screen (REQ01) — see `docs/wireframes.md`
- ✅ Wireframe: Admin Dashboard (REQ29) — see `docs/wireframes.md`
- ✅ Wireframe: Caregiver Dashboard (REQ28) — see `docs/wireframes.md`
- ✅ Wireframe: Parent Dashboard (REQ27) — see `docs/wireframes.md`
- ✅ Wireframe: AI Guardian chat UI (EI02) — see `docs/wireframes.md`
- ✅ Create system flowcharts — documented in `docs/flowcharts.md`
- ☐ Set up GitHub repo structure per updated README (`app/`, `lib/`, `docs/`)
- ☐ Set up task board (GitHub Projects or equivalent) mirroring this file
- ✅ Decide hosting target — TBD; Vercel + Neon/Railway shortlisted (see architecture.md §7)

## Week 3–4 — Development Sprint 1: Core Modules

**Goal: Next.js scaffold, authentication, navigation, and core CRUD (children, caregivers, classrooms).**

- ☐ Initialize Next.js project (TypeScript, App Router)
- ☐ Set up Drizzle ORM + PostgreSQL connection (`lib/db.ts`)
- ☐ Define Drizzle schema for `users`, `caregivers`, `classrooms`, `children`, `child_guardians`, `caregiver_classrooms` (REQ08–REQ14)
- ☐ Run first Drizzle Kit migration
- ☐ Implement NextAuth.js authentication (REQ01, REQ02)
- ☐ `middleware.ts` — Auth + RBAC route protection (REQ03, NFR04, NFR05)
- ☐ Password hashing with bcrypt (NFR06)
- ☐ Server Actions: user management (add/update/deactivate/assign role) (REQ04–REQ07)
- ☐ Server Actions: child management (REQ08–REQ10)
- ☐ Server Actions: caregiver management (REQ11, REQ12)
- ☐ Server Actions: classroom/group management (REQ13, REQ14)
- ☐ Login page `/login` with form + validation (REQ01)
- ☐ Role-based route guarding via middleware (REQ03)
- ☐ Admin — user/child/caregiver/classroom management screens (REQ04–REQ14)
- ☐ Zod input validation on all Server Actions (NFR08)
- ☐ Unit tests for auth + core CRUD
- ☐ PR review pass on all Sprint 1 branches

## Week 5–6 — Development Sprint 2: Daily Operations, Media & Complaints

**Goal: attendance, activity logging, photo/video sharing, complaints with proof, medical records, notices, dashboards.**

- ☐ Backend: attendance endpoints — check-in/check-out, status (REQ15–REQ17)
- ☐ Backend: daily activity log endpoints (REQ18–REQ20)
- ☐ Backend & Cloudinary: Caregiver child photo/video upload endpoints (REQ40)
- ☐ Backend: Parent private child media gallery stream endpoints (REQ41)
- ☐ Backend & Cloudinary: Parent complaint filing with proof attachment (REQ38)
- ☐ Backend: Admin complaint investigation, status tracking & resolution (REQ39)
- ☐ Backend: medical records endpoints + read/write permission checks (REQ21, REQ22)
- ☐ Backend: medical record audit logging (REQ23)
- ☐ Backend: medical alert flag logic (REQ24)
- ☐ Backend: notice endpoints (REQ25, REQ26)
- ☐ Frontend: Caregiver — attendance screen (REQ15)
- ☐ Frontend: Caregiver — daily activity logging form (REQ18)
- ☐ Frontend: Caregiver — photo/video moments uploader (REQ40)
- ☐ Frontend: Parent — private child media gallery feed (REQ41)
- ☐ Frontend: Parent — complaint submission form with proof attachment (REQ38)
- ☐ Frontend: Admin — complaint resolution and investigation dashboard (REQ39)
- ☐ Frontend: Medical records screen — write view (staff) and read-only view (parent) (REQ21, REQ22)
- ☐ Frontend: Notice board — publish (staff) and view (parent) (REQ25, REQ26)
- ☐ Frontend: Parent Dashboard — pull together child profile, attendance status, recent logs, media moments, medical alerts, notices (REQ27)
- ☐ Frontend: Caregiver Dashboard — assigned classroom, child list, quick links (REQ28)
- ☐ Frontend: Admin Dashboard — management shortcuts, pending complaints, basic reports (REQ29)
- ☐ Encrypt medical data at rest (NFR07)
- ☐ Unit/integration tests for attendance, logging, media upload, complaints, and medical records permission boundaries
- ☐ PR review pass on all Sprint 2 branches

## Week 7–8 — Development Sprint 3: AI Guardian Assistant

**Goal: AI Guardian chat feature end-to-end.**

- ☐ Backend: `ai_guardian_sessions` table + endpoint
- ☐ Backend: data-gathering layer — pull scoped attendance/logs/milestones/medical data for a child (REQ31)
- ☐ Backend: Claude API integration — send question + scoped context, return synthesized answer (REQ30, REQ31)
- ☐ Backend: session/follow-up context handling (REQ32)
- ☐ Backend: enforce per-guardian child data isolation on every AI Guardian call (REQ36)
- ☐ Backend: encrypt AI Guardian data in transit/at rest + log queries & responses (REQ37)
- ☐ Backend: comparative query support — time-period comparisons (REQ33)
- ☐ Backend (stretch): predictive scheduling suggestions (REQ34, Could-Have)
- ☐ Backend: Bangla/English response handling (REQ35)
- ☐ Frontend: AI Guardian chat UI — child selector, message area, input, send, quick-query buttons (EI02)
- ☐ Frontend: multi-child selector for guardians with more than one child
- ☐ Manual QA: verify a parent cannot retrieve another child's data via the AI Guardian under any phrasing
- ☐ PR review pass on all Sprint 3 branches

## Week 9+ — Hardening & Demo Prep

- ☐ Cross-browser check: Chrome, Edge, Firefox (NFR10)
- ☐ Responsive/mobile pass across all screens, prioritizing parent-facing views (NFR11)
- ☐ Security review: RBAC boundaries, medical record access, complaints privacy, AI Guardian isolation (NFR04, NFR05, REQ36)
- ☐ Performance check on core flows — login, attendance view, log view (NFR02)
- ☐ Seed demo data (sample children, caregivers, a few days of logs, media moments) for presentation
- ☐ Final walkthrough against Section 10 (Acceptance Criteria) of the SRS
- ☐ Prepare demo script / presentation

---

## Future / Backlog (beyond v1.0)

Ideas raised during development that are out of scope for the course deadline — capture here instead of building now (see CONTRIBUTING.md §"Working with the SRS").

- ☐ Native mobile app (v1.0 is responsive web only — see SRS Constraint #5)
- ☐ SMS/push notifications for notices
- ☐ Multi-branch daycare center support
