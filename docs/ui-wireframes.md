# KiddieOps UI Wireframes

**Version:** 2.1 (Week 2 — Design & Planning)  
**Primary Source of Truth:** `KiddieOps_SRS.docx` (REQ01–REQ41, NFR01–NFR12, EI01–EI02)  
**Interactive Visual Canvas Board:** [`wireframes-canvas.html`](wireframes-canvas.html)

---

## 1. Design Overview

KiddieOps UI/UX wireframes are designed with a **mobile-first, role-scoped architecture** tailored for modern daycare centers in Bangladesh. The design prioritizes instant operational efficiency for staff, transparent accountability for administrators, and effortless, media-rich, conversational access for parents.

### Visual Canvas Board Overview

![KiddieOps Visual UI Wireframe Canvas Board](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/kiddieops_wireframe_canvas_1787308831099.jpg)

> 🎨 **Interactive HTML Canvas:** Open [`docs/wireframes-canvas.html`](wireframes-canvas.html) in any web browser to view, pan, and filter all 14 live interactive screen artboards across all roles.

### Core UX Principles
- **Mobile-First Parent Experience (NFR11):** Parents access updates on handheld devices; feeds, media moments, complaints, and AI Guardian chats fit one-handed thumb interaction.
- **Strict Role Scoping (REQ02, REQ03, NFR05):** The UI strictly renders features allowed by the authenticated role.
- **Transparent Accountability & Complaints with Proof (REQ38, REQ39):** Parents can file formal incident reports against caregivers with photo/document evidence, while administrators investigate and manage resolution workflows.
- **Child Photo & Video Moment Sharing (REQ40, REQ41):** Caregivers easily share captured moments during daily activities; parents access a privacy-isolated media gallery.
- **Prominent Medical & Allergy Safety (REQ24):** High-visibility alerts (red badge with icon) appear on any view where a child with a severe allergy is shown.
- **Natural Language First (EI02, REQ30, REQ35):** The AI Guardian chat supports free-form queries in both Bengali (বাংলা) and English with pre-composed quick prompt pills.
- **Minimal Navigation Depth (NFR01):** Key tasks (taking attendance, logging a meal, uploading a moment, checking child status) require $\le 2$ taps/clicks.

---

## 2. User Roles & Permission Boundaries

| Role | Accessible Interface Modules | Security & Isolation Rules |
|---|---|---|
| **Administrator** | Dashboard, User/Staff Management, Child Registration, Classrooms, Complaint Management & Resolution, Medical Oversight, Notice Publisher, System Reports | Full CRUD access across center resources; investigates parent complaints (REQ04–REQ14, REQ25, REQ29, REQ39) |
| **Caregiver (Teacher)** | Caregiver Dashboard, Classroom Attendance Sheet, Daily Activity Logger, Photo/Video Moment Uploader, Medical Incident Notes (if authorized), Notices | Scoped strictly to assigned classroom and children (REQ11, REQ15, REQ18, REQ21, REQ28, REQ40) |
| **Parent / Guardian** | Parent Dashboard, Child Profile, Attendance History, Daily Timeline, Child Media Gallery, Complaint Filing with Proof, Read-Only Medical Records, Notices, AI Guardian Chat | Scoped 100% to linked child(ren) only; complaints delivered directly to Admin with strict confidentiality (REQ10, REQ16, REQ19, REQ22, REQ26, REQ27, REQ36, REQ38, REQ41) |

---

## 3. Navigation Structure

```
                      ┌────────────────────────────┐
                      │    WF-01: Login Gateway    │
                      └─────────────┬──────────────┘
                                    │ (Role Identified - REQ02)
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│   ADMINISTRATOR   │       │     CAREGIVER     │       │  PARENT/GUARDIAN  │
├───────────────────┤       ├───────────────────┤       ├───────────────────┤
│ WF-02: Dashboard  │       │ WF-06: Dashboard  │       │ WF-09: Dashboard  │
│ WF-03: Children   │       │ WF-07: Attendance │       │ WF-10: Media Gall.│
│ WF-04: Staff/Users│       │ WF-08: ActivityLog│       │ WF-11: Complaints │
│ WF-05: Complaints │       │ WF-09: MediaUpload│       │ WF-12: AI Guardian│
│ WF-06: Notices    │       │ WF-10: Medical(W) │       │ WF-13: Medical (R)│
└───────────────────┘       └───────────────────┘       └───────────────────┘
```

---

## 4. Wireframe Screens

---

### Screen WF-01: Universal Login Gateway

![WF-01: Login Screen](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_login_1787307610881.jpg)

- **Role:** All Users (Administrator, Caregiver, Parent/Guardian)
- **Purpose:** Secure single entry-point for credential authentication and automated role-based dashboard redirection.
- **Main Actions:**
  - Enter email address and password.
  - Submit login credentials for bcrypt verification.
  - Automatic redirect to role-specific dashboard upon successful identification.
- **Key UI Elements:**
  - Header: KiddieOps logo & platform slogan.
  - Card: Email input field, password input with toggle, "Remember me" checkbox, Primary "Sign In" button.
  - Footer: Security note and RBAC routing indicator.
- **Related SRS Requirements:** `REQ01`, `REQ02`, `REQ03`, `NFR04`, `NFR06`.

---

### Screen WF-02: Administrator Overview Dashboard

![WF-02: Admin Dashboard](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_admin_dashboard_1787307685980.jpg)

- **Role:** Administrator
- **Purpose:** Central command center displaying live operational KPIs, classroom occupancy, attendance metrics, pending complaints, and quick admin shortcuts.
- **Main Actions:**
  - View center-wide aggregate stats (total children, staff on duty, present count, pending complaints).
  - Review classroom enrollment capacity bar chart.
  - Trigger quick administrative actions (+ Add Child, Review Complaints, 📢 Publish Notice).
  - Navigate to sub-modules via the persistent left sidebar.
- **Key UI Elements:**
  - Left Sidebar: Logo, Navigation links (Dashboard, Users, Children, Caregivers, Classrooms, Complaints, Medical, Notices, Reports).
  - Stat Cards: Enrolled Children (38), Present Today (34), Caregivers (8), Pending Complaints (2).
  - Visual Charts: Classroom capacity distribution gauges.
  - Quick Operations Toolbar.
- **Related SRS Requirements:** `REQ04`, `REQ08`, `REQ11`, `REQ13`, `REQ25`, `REQ29`, `REQ39`.

---

### Screen WF-03: Child Registration & Enrollment Management

- **Role:** Administrator
- **Purpose:** Manage the complete roster of enrolled children and execute new child intake workflows.
- **Main Actions:**
  - Search and filter children by name, classroom, or allergy status.
  - Open child registration modal.
  - Assign classroom group and link parent/guardian accounts.
  - Toggle severe allergy alert flag.
- **Key UI Elements:**
  - Search bar and "+ Add Child" button.
  - Child Roster Data Table: Name, DOB, Classroom, Allergy Flag Badge (`⚠️ PEANUT`), Action buttons (Edit/View).
  - Add Child Intake Form Modal: Name field, DOB date-picker, Classroom dropdown (REQ14), Linked Guardian selector (REQ10), Emergency contact input (REQ08), Severe Allergy Checkbox (REQ24).
- **Related SRS Requirements:** `REQ08`, `REQ09`, `REQ10`, `REQ14`, `REQ24`.

---

### Screen WF-04: Staff & Caregiver Management

- **Role:** Administrator
- **Purpose:** Oversee caregiver profiles, assign teachers to classrooms, and grant medical record authoring privileges.
- **Main Actions:**
  - View caregiver directory with contact details and current assignments.
  - Assign / re-assign caregivers to classrooms/groups.
  - Toggle `is_medical_authorized` permission switch per caregiver.
- **Key UI Elements:**
  - Caregiver Roster Table: Staff Name, Assigned Classroom, Phone, Medical Authorization Status (`Authorized` / `Read Only`), Account Status (`Active`).
  - Classroom Assignment Control Panel: Staff selector, Classroom dropdown, "Update Assignment" button.
- **Related SRS Requirements:** `REQ11`, `REQ12`, `REQ21`.

---

### Screen WF-05: Administrator Complaint Investigation & Resolution Panel

![WF-05: Complaint Management System with Proof](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_complaints_system_1787487091888.jpg)

- **Role:** Administrator
- **Purpose:** Comprehensive triage and investigation panel for parent complaints filed against caregivers, with attached proof preview, internal case notes, and formal status resolution.
- **Main Actions:**
  - Review incoming parent complaints with status tags (`Pending`, `Under Review`, `Resolved`, `Dismissed`).
  - Inspect incident details, targeted caregiver, and attached photo/document evidence from Cloudinary.
  - Write internal investigation notes.
  - Update complaint status and send formal administrative response to the filing parent.
- **Key UI Elements:**
  - Complaints Data Table: Complaint ID, Date, Filing Parent, Affected Child, Target Caregiver, Title, Proof Badge (`📷 Photo Attached`), Status Badge.
  - Investigation & Resolution Panel: Full incident statement, proof thumbnail previewer, Admin Notes textarea, Action Buttons (`Mark Under Review`, `Resolve & Notify Parent`, `Dismiss`).
- **Related SRS Requirements:** `REQ38`, `REQ39`, `NFR05`.

---

### Screen WF-06: Caregiver Active Dashboard

![WF-06: Caregiver Dashboard](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_caregiver_dashboard_1787307661227.jpg)

- **Role:** Caregiver (Teacher)
- **Purpose:** Primary workspace for teachers to manage their classroom, view real-time student presence, log routine activities, and share photos/videos.
- **Main Actions:**
  - View assigned classroom status and current child headcount.
  - Quick tap to open Attendance Roster, Activity Logger, or Photo/Video Uploader.
  - Review feed of today's logged events.
- **Key UI Elements:**
  - Classroom Banner: Classroom name ("Sunflower Classroom"), Caregiver name, Enrolled count, "Present Now" badge.
  - Quick Action Tiles: 📋 Take Attendance, 📝 Log Activity, 📸 Share Moment.
  - Live Classroom Activity Feed with timestamped event items.
  - Bottom Tab Navigation.
- **Related SRS Requirements:** `REQ15`, `REQ18`, `REQ21`, `REQ28`, `REQ40`.

---

### Screen WF-07: Classroom Daily Attendance Sheet

- **Role:** Caregiver
- **Purpose:** Record daily check-in, check-out times, and attendance statuses for every child in the assigned group.
- **Main Actions:**
  - Select attendance date.
  - Bulk action: "Mark All Present".
  - Record check-in / check-out time per child.
  - Set status flag: `Present`, `Absent`, `Late`, `Excused`.
- **Key UI Elements:**
  - Header: Date selector and action buttons ("Mark All Present", "Save Roster").
  - Attendance Roster Table: Child Name, Status Badge, Check-In time input (`08:30`), Check-Out time input.
- **Related SRS Requirements:** `REQ15`, `REQ16`, `REQ17`.

---

### Screen WF-08: Caregiver Child Photo & Video Moments Uploader

- **Role:** Caregiver
- **Purpose:** Allow teachers to capture or upload photos and video clips of children during daycare activities, arts & crafts, playtime, or milestones.
- **Main Actions:**
  - Select target child or tag the entire classroom.
  - Choose media type (Photo or Video).
  - Drag and drop or browse files for upload to Cloudinary.
  - Add descriptive caption / activity note.
  - Post moment to parent feed.
- **Key UI Elements:**
  - Tag Child / Classroom selector.
  - Media Type selector (`📸 Photo` / `🎥 Video Clip`).
  - Drag & Drop Upload Zone with file validation indicators (format, size limit 50MB).
  - Caption textarea ("Liam created a sunflower painting in arts class!").
  - "Post Moment to Parent Gallery" primary button.
- **Related SRS Requirements:** `REQ40`, `NFR07`.

---

### Screen WF-09: Parent Mobile Dashboard

![WF-09: Parent Mobile Dashboard](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_parent_dashboard_1787307619879.jpg)

- **Role:** Parent / Guardian
- **Purpose:** Mobile-optimized glanceable dashboard providing real-time visibility into their child's day, safety alerts, activity feed, photo moments, and complaint options.
- **Main Actions:**
  - Switch active child (for parents with multiple enrolled kids).
  - View real-time check-in and presence status.
  - Read prominent allergy/medical warnings.
  - Quick tap to open Media Gallery or File a Complaint.
  - Tap floating CTA to open conversational AI Guardian.
- **Key UI Elements:**
  - Top Bar: App branding, Child selector (`Liam J. ▾`).
  - Severe Allergy Warning Banner (`⚠️ Medical Alert: Severe Peanut Allergy on file`).
  - Status Glance Cards: Today's Status (`Present · 8:30 AM`), New Moments (`2 Photos`).
  - Quick Action Buttons: `📸 Media Gallery (REQ41)`, `⚠️ File Complaint (REQ38)`.
  - Activity Feed: Visual cards for meals, naps, activities.
  - AI Guardian Highlight Banner with "Open Chat" CTA.
  - Bottom Tab Bar: Home, Gallery, AI Chat, Report.
- **Related SRS Requirements:** `REQ10`, `REQ16`, `REQ19`, `REQ24`, `REQ26`, `REQ27`, `REQ38`, `REQ41`.

---

### Screen WF-10: Parent Child Photo & Video Media Gallery

- **Role:** Parent / Guardian
- **Purpose:** Private, child-isolated photo and video stream allowing parents to experience their child's daycare moments throughout the week.
- **Main Actions:**
  - Browse chronological visual timeline of photos and videos.
  - Filter by month or activity category.
  - Play video clips and view high-resolution photos.
  - Read caregiver captions and timestamps.
- **Key UI Elements:**
  - Gallery Header with active child indicator and month filter.
  - 2-Column Responsive Media Grid: Photo and video cards with thumbnail previews, play icon for videos, caption overlays, and teacher credit ("Riya K. · 10:30 AM").
  - Privacy Scoping Notice (`🔒 Privacy Protected: Scoped strictly to your child`).
- **Related SRS Requirements:** `REQ41`, `REQ36`.

---

### Screen WF-11: Parent Complaint Filing with Proof Attachment

![WF-11: Parent Complaint Form](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_complaints_system_1787487091888.jpg)

- **Role:** Parent / Guardian
- **Purpose:** Formal and confidential complaint submission tool allowing parents to report caregiver misconduct, safety violations, or neglect, with attached proof.
- **Main Actions:**
  - Select target caregiver from dropdown.
  - Select affected child.
  - Enter incident date/time, subject title, and detailed statement.
  - Attach optional proof photo or document.
  - Submit directly to administrator.
  - Track investigation status and view administrator response.
- **Key UI Elements:**
  - Target Caregiver selector dropdown.
  - Affected Child selector.
  - Incident Date/Time picker.
  - Complaint Title input & Description textarea.
  - Attached Proof Dropzone with file preview thumbnail.
  - Submit button: "Submit Complaint to Administrator".
  - Confidentiality guarantee badge (`🛡️ Delivered directly to Administrator; not visible to caregivers`).
- **Related SRS Requirements:** `REQ38`, `REQ39`, `NFR05`.

---

### Screen WF-12: AI Guardian Conversational Assistant

![WF-12: AI Guardian Chat](C:/Users/88017/.gemini/antigravity-ide/brain/75cbeaa2-c37b-43b2-903e-e8527c0c5685/wireframe_ai_guardian_1787307651335.jpg)

- **Role:** Parent / Guardian
- **Purpose:** Conversational chat interface powered by Claude API to synthesize complex historical timelines, compare routines, and answer parent questions in Bengali or English.
- **Main Actions:**
  - Select child scope.
  - Toggle language mode (`EN` / `বাংলা`).
  - Tap suggested quick-query prompt chips.
  - Type free-form natural language questions.
- **Key UI Elements:**
  - Header: AI Guardian badge, Bilingual switcher button (`EN | বাংলা`).
  - Context Isolation Banner (`🔒 Isolated Context: Liam Johnson`).
  - Quick Prompt Pills: `🍽️ How did Liam eat today?`, `😴 Compare nap to weekly avg`, `😊 Mood analysis`.
  - Chat Stream with contextual answers.
  - Bottom Input Bar.
- **Related SRS Requirements:** `REQ30`, `REQ31`, `REQ32`, `REQ33`, `REQ35`, `REQ36`, `REQ37`, `EI02`.

---

### Screen WF-13: Medical Records (Parent Read-Only View)

- **Role:** Parent / Guardian
- **Purpose:** Secure, transparent read-only access to their child's health file, emergency contacts, and allergies.
- **Main Actions:**
  - Review recorded allergies, conditions, and special handling instructions.
  - Inspect physician contact details and medication instructions.
- **Key UI Elements:**
  - Header: Child name and Read-Only Security Badge (`🔒 Audit Logged`).
  - Allergy Card: Highlighting severe triggers and EpiPen location.
  - Medication Card: Current prescribed medicines and dosages.
  - Primary Pediatrician Card.
- **Related SRS Requirements:** `REQ21`, `REQ22`, `REQ23`, `REQ24`, `NFR07`.

---

### Screen WF-14: Attendance History & Monthly Summary

- **Role:** Parent / Guardian
- **Purpose:** View historical attendance logs, check-in/out timestamps, and monthly attendance percentage metrics.
- **Main Actions:**
  - Select calendar month.
  - Review monthly summary statistics (Total Present, Absent, Late).
  - Inspect chronological daily attendance log table.
- **Key UI Elements:**
  - Month Header & Overall Attendance Rate badge (`95%`).
  - 3-Column Metric Cards: Present Count (18), Absent Count (1), Late Count (1).
  - Historical Attendance Table.
- **Related SRS Requirements:** `REQ16`, `REQ17`.

---

## 5. Traceability Matrix — Wireframes to SRS

| Screen ID | Screen Name | User Role | Related SRS Requirements |
|---|---|---|---|
| **WF-01** | Universal Login Gateway | All Users | REQ01, REQ02, REQ03, NFR04, NFR06 |
| **WF-02** | Administrator Overview Dashboard | Admin | REQ04, REQ08, REQ11, REQ13, REQ25, REQ29, REQ39 |
| **WF-03** | Child Registration & Enrollment | Admin | REQ08, REQ09, REQ10, REQ14, REQ24 |
| **WF-04** | Caregiver & Staff Management | Admin | REQ11, REQ12, REQ21 |
| **WF-05** | Admin Complaint Resolution Panel | Admin | REQ38, REQ39, NFR05 |
| **WF-06** | Caregiver Active Dashboard | Caregiver | REQ15, REQ18, REQ21, REQ28, REQ40 |
| **WF-07** | Classroom Attendance Sheet | Caregiver | REQ15, REQ16, REQ17 |
| **WF-08** | Caregiver Photo/Video Moments Uploader | Caregiver | REQ40, NFR07 |
| **WF-09** | Parent Mobile Dashboard | Parent | REQ10, REQ16, REQ19, REQ24, REQ26, REQ27, REQ38, REQ41 |
| **WF-10** | Parent Child Media Gallery | Parent | REQ41, REQ36 |
| **WF-11** | Parent Complaint Filing with Proof | Parent | REQ38, REQ39, NFR05 |
| **WF-12** | AI Guardian Conversational Assistant | Parent | REQ30, REQ31, REQ32, REQ33, REQ35, REQ36, REQ37, EI02 |
| **WF-13** | Medical Records (Read-Only) | Parent | REQ21, REQ22, REQ23, REQ24, NFR07 |
| **WF-14** | Attendance History & Monthly Summary | Parent | REQ16, REQ17 |

---

*All wireframe designs are documentation artifacts for Week 2. Implementation with Next.js, TypeScript, and Drizzle ORM will proceed in Week 3.*
