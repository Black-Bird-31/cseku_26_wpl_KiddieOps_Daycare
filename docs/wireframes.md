# KiddieOps — UI Wireframes

**Version:** 1.0 (Week 2 — Design & Planning)  
**Source of Truth:** `KiddieOps_SRS.docx`  
**Tool:** AI-generated wireframes (Week 2 deliverable)

> These wireframes are documentation artifacts for planning purposes. They illustrate the intended layout and information architecture of the key screens. Final visual design and implementation will be done in Week 3+.
>
> 🎨 **Interactive HTML Canvas Board:** View the full interactive UI canvas at [`wireframes-canvas.html`](wireframes-canvas.html).
> 📖 **Comprehensive Specification:** See [`ui-wireframes.md`](ui-wireframes.md) for full screen-by-screen UX specifications and role matrices.

![KiddieOps UI Wireframe Canvas Board](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/kiddieops_wireframe_canvas_1787308831099.jpg)

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [WF-01: Login Page](#wf-01-login-page)
3. [WF-02: Parent Dashboard](#wf-02-parent-dashboard)
4. [WF-03: Caregiver Dashboard](#wf-03-caregiver-dashboard)
5. [WF-04: Administrator Dashboard](#wf-04-administrator-dashboard)
6. [WF-05: AI Guardian Chat](#wf-05-ai-guardian-chat)
7. [Screen Inventory](#screen-inventory)
8. [Component Patterns](#component-patterns)

---

## Design Principles

Based on SRS requirements for usability (NFR01) and mobile responsiveness (NFR11):

| Principle | Rationale |
|---|---|
| **Mobile-first** | Parents primarily access the app on mobile devices (NFR11) |
| **Role-scoped views** | UI only shows what the logged-in role is allowed to see (REQ03) |
| **Minimal navigation depth** | Common tasks should be reachable within 2 taps (NFR01) |
| **Clear data hierarchy** | Most important info (attendance, alerts) appears first |
| **Allergy alert prominence** | Allergy flags must be visually distinct wherever child profile is shown (REQ24) |
| **Chat-first AI Guardian** | AI Guardian uses a familiar chat metaphor with quick-query shortcuts (EI02) |

---

## WF-01: Login Page

**SRS References:** REQ01, REQ02, REQ03

![WF-01: KiddieOps Login Page](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_login_1787307610881.jpg)

**Screen description:**

- Single entry point for all roles (REQ01)
- Email + Password form with a "Sign In" button
- On success, system identifies the user's role (REQ02) and redirects to the appropriate dashboard (REQ03)
- Role badges at the bottom are informational — there is no role selector; the backend determines the role from the authenticated account
- No "forgot password" in v1.0 scope (admin resets passwords via user management)

**Component inventory:**
- `LogoHeader` — brand identity
- `LoginForm` — email input, password input, submit button, inline validation errors
- `RoleInfoBadges` — informational (not interactive)

---

## WF-02: Parent Dashboard

**SRS References:** REQ10, REQ16, REQ19, REQ22, REQ24, REQ26, REQ27

![WF-02: Parent Dashboard](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_parent_dashboard_1787307619879.jpg)

**Screen description:**

This is the primary view for a parent/guardian after login (REQ27). It consolidates all child-related information in a single scrollable view:

| Section | Content | SRS Ref |
|---|---|---|
| Stat cards (top) | Today's status, Check-in time, Activity count, Notice count | REQ16, REQ19 |
| Child profile card | Child photo, name, classroom, allergy alert badge | REQ10, REQ24 |
| Recent Activity | Last 3 activity log entries with type and time | REQ19 |
| AI Guardian button | Floating/sticky CTA to open AI Guardian chat | REQ27, EI02 |
| Bottom tab bar | Home, Child, Attendance, AI Guardian, Notices | REQ27 |

**Data scope:** All data on this dashboard is strictly scoped to the logged-in parent's linked child(ren). If a parent has multiple children, a child selector appears at the top (REQ36).

**Component inventory:**
- `DashboardHeader` — greeting + avatar
- `StatCard` × 4 — quick summary widgets
- `ChildProfileCard` — photo, name, classroom, allergy badge
- `ActivityFeedItem` × N — recent activity rows
- `AIGuardianFAB` — floating action button
- `BottomTabBar` — role-scoped navigation

---

## WF-03: Caregiver Dashboard

**SRS References:** REQ15, REQ18, REQ21, REQ25, REQ28

![WF-03: Caregiver Dashboard](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_caregiver_dashboard_1787307661227.jpg)

**Screen description:**

The caregiver's home view (REQ28). Organized around their assigned classroom:

| Section | Content | SRS Ref |
|---|---|---|
| Classroom info card | Classroom name, child count | REQ11, REQ13 |
| Quick action cards | Take Attendance, Log Activity, Medical Records | REQ15, REQ18, REQ21 |
| Today's Attendance table | Child list with status, check-in time, edit action | REQ15 |
| Recent Activities | Last logged activity entries | REQ18 |
| Bottom tab bar | Dashboard, Attendance, Activities, Notices | REQ28 |

**Authorization notes:**
- Medical Records action is only shown if `caregiver.is_medical_authorized = true` (REQ21)
- Only children in the caregiver's assigned classroom are shown (REQ12, REQ28)

**Component inventory:**
- `ClassroomInfoCard` — assigned group summary
- `QuickActionCard` × 3 — shortcut tiles
- `AttendanceTable` — sortable child list with inline status controls
- `ActivityFeedItem` × N — recent log entries
- `BottomTabBar` — caregiver-scoped navigation

---

## WF-04: Administrator Dashboard

**SRS References:** REQ04–REQ14, REQ25, REQ29

![WF-04: Administrator Dashboard](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_admin_dashboard_1787307685980.jpg)

**Screen description:**

Desktop-first layout (wide) with a persistent left sidebar (REQ29). The sidebar provides full navigation access to all admin modules:

**Sidebar navigation:**
- Dashboard
- Users (REQ04–REQ07)
- Children (REQ08–REQ10)
- Caregivers (REQ11–REQ12)
- Classrooms (REQ13–REQ14)
- Medical Records (REQ21)
- Notices (REQ25)
- Reports (REQ29)

**Main content area:**

| Section | Content | SRS Ref |
|---|---|---|
| Stat cards | Total Children, Total Caregivers, Present Today, Active Notices | REQ29 |
| Children by Classroom chart | Bar chart of enrollment per classroom | REQ29 |
| Recent Notices panel | Latest 3 notices with view-all link | REQ25, REQ26 |
| Quick Actions | Add Child, Add User, Publish Notice, View Reports | REQ04, REQ08, REQ25 |

**Component inventory:**
- `SidebarNav` — persistent left navigation (desktop)
- `StatCard` × 4 — summary metrics
- `BarChart` — classroom enrollment visualization
- `NoticeListItem` × 3 — recent notices
- `QuickActionButton` × 4 — admin shortcuts

---

## WF-05: AI Guardian Chat

**SRS References:** REQ30–REQ37, EI02

![WF-05: AI Guardian Chat](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_ai_guardian_1787307651335.jpg)

**Screen description:**

The AI Guardian chat interface (EI02). Accessible from the Parent Dashboard:

| Element | Description | SRS Ref |
|---|---|---|
| Child selector dropdown | Selects the child the question is about; required if guardian has multiple children | EI02, REQ36 |
| Quick-query buttons | Pre-built suggested questions for common queries | EI02 |
| Chat message area | Scrollable thread of parent questions and AI Guardian responses | REQ30, REQ31 |
| Parent bubble (right) | User's typed question | REQ30 |
| AI Guardian bubble (left) | Synthesized AI response using child's data | REQ31 |
| Text input | Free-text entry for natural-language questions | REQ30 |
| Send button | Submits the question to the backend | REQ30 |

**Interaction notes:**
- Child selector defaults to the parent's single linked child; becomes a dropdown if multiple children are linked (EI02)
- Quick-query buttons populate the input field for one-tap common queries
- Follow-up questions within the same session maintain context automatically (REQ32)
- The AI Guardian responds in the same language as the parent's question — Bangla or English (REQ35)
- All queries are scoped server-side to the selected child only; no cross-child data leakage is possible (REQ36)

**Component inventory:**
- `ChildSelectorDropdown` — child picker
- `QuickQueryChip` × N — suggested question pills
- `ChatBubble` (parent variant) — right-aligned user message
- `ChatBubble` (AI variant) — left-aligned AI response with subtle indicator
- `ChatInput` — text field + send button

## WF-06: Complaint Management with Proof against Caregivers

**SRS References:** REQ38, REQ39

![WF-06: Complaint Management System with Proof](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_complaints_system_1787487091888.jpg)

**Screen description:**

- **Parent Complaint Form (Left Modal):** Allows parents to file formal incident reports against specific caregivers, specifying title, description, incident date/time, affected child, and attaching photo/document proof stored via Cloudinary (REQ38).
- **Administrator Resolution Panel (Right):** Triage table of incoming complaints with status tags (`Pending`, `Under Review`, `Resolved`, `Dismissed`). Admin inspects incident details, opens attached proof, records investigation notes, and resolves the case (REQ39).

---

## Screen Inventory

All screens planned for v1.0 per the SRS:

| Screen | Role | SRS Ref | Wireframe |
|---|---|---|---|
| Login | All | REQ01–REQ03 | WF-01 ✅ |
| Parent Dashboard | Parent | REQ27 | WF-02 ✅ |
| Child Profile (view) | Parent | REQ10 | Planned |
| Attendance History (parent) | Parent | REQ16 | Planned |
| Activity Logs (parent view) | Parent | REQ19 | Planned |
| Child Media Gallery | Parent | REQ41 | WF-10 (in Canvas) ✅ |
| File Complaint with Proof | Parent | REQ38 | WF-06 / WF-11 ✅ |
| Medical Record (read-only) | Parent | REQ22 | Planned |
| Notices (parent) | Parent | REQ26 | Planned |
| AI Guardian Chat | Parent | REQ30–REQ37, EI02 | WF-05 ✅ |
| Caregiver Dashboard | Caregiver | REQ28 | WF-03 ✅ |
| Take Attendance | Caregiver | REQ15 | Planned |
| Log Daily Activity | Caregiver | REQ18 | Planned |
| Photo/Video Moments Uploader | Caregiver | REQ40 | WF-08 (in Canvas) ✅ |
| Medical Record (write) | Auth. Caregiver | REQ21 | Planned |
| Notices (caregiver) | Caregiver | REQ25 | Planned |
| Admin Dashboard | Admin | REQ29 | WF-04 ✅ |
| User Management | Admin | REQ04–REQ07 | Planned |
| Child Management | Admin | REQ08–REQ10 | Planned |
| Caregiver Management | Admin | REQ11–REQ12 | Planned |
| Classroom Management | Admin | REQ13–REQ14 | Planned |
| Complaint Management Panel | Admin | REQ39 | WF-06 / WF-04 ✅ |
| Medical Records Overview | Admin | REQ21 | Planned |
| Notice Management | Admin | REQ25 | Planned |

---

## Component Patterns

Shared component behaviors and design rules that apply across all screens:

| Pattern | Description | Screens Affected |
|---|---|---|
| **Allergy Alert Badge** | Red/warning badge shown wherever a child profile appears if `allergy_flag = true` | Parent Dashboard, Caregiver Dashboard, Child Profile, Medical Records |
| **Role Guard** | Unauthenticated or wrong-role users are redirected to login immediately | All protected routes |
| **Child Data Scope** | All data queries include `child_id` filtered through `child_guardians` for parent role | All parent-facing screens |
| **Audit Trigger** | Every read of medical records creates an audit log entry (invisible to UI but required by REQ23) | Medical Record screens |
| **Empty States** | When no data exists (no activity logs today, no notices), a friendly empty state is shown rather than a blank area | All list/feed screens |
| **Loading Skeleton** | While data loads, skeleton placeholders animate in place of content | Dashboard widgets, lists |
| **Inline Validation** | Form fields validate on blur; error messages appear inline below the field | Login, all CRUD forms |
