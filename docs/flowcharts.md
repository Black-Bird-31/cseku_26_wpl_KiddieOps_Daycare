# KiddieOps — System Flowcharts

**Version:** 1.0 (Week 2 — Design & Planning)  
**Source of Truth:** `KiddieOps_SRS.docx`

> All flowcharts in this document are documentation artifacts only. They describe planned system behavior to guide implementation in Week 3+.

---

## Table of Contents

1. [FC-01: User Login & Role-Based Routing](#fc-01-user-login--role-based-routing)
2. [FC-02: Caregiver Takes Attendance](#fc-02-caregiver-takes-attendance)
3. [FC-03: Caregiver Logs a Daily Activity](#fc-03-caregiver-logs-a-daily-activity)
4. [FC-04: Authorized Staff Records / Updates a Medical Record](#fc-04-authorized-staff-records--updates-a-medical-record)
5. [FC-05: Parent Views Their Child's Information](#fc-05-parent-views-their-childs-information)
6. [FC-06: AI Guardian Query Flow](#fc-06-ai-guardian-query-flow)
7. [FC-07: Administrator Manages a Child Profile](#fc-07-administrator-manages-a-child-profile)
8. [FC-08: Notice Publishing Flow](#fc-08-notice-publishing-flow)
9. [FC-09: File / Image Upload via Cloudinary](#fc-09-file--image-upload-via-cloudinary)
10. [FC-10: Parent Submits Complaint with Proof & Admin Resolution](#fc-10-parent-submits-complaint-with-proof--admin-resolution)
11. [FC-11: Caregiver Child Photo/Video Upload & Parent Media Gallery](#fc-11-caregiver-child-photovideo-upload--parent-media-gallery)

---

## FC-01: User Login & Role-Based Routing

**Implements:** REQ01, REQ02, REQ03  
**Use Case:** UC-01

```mermaid
flowchart TD
    A([User Opens App]) --> B[/Login Page\]
    B --> C[Enter Email + Password]
    C --> D[Submit]
    D --> E{Credentials Valid?}

    E -- No --> F[Show Error Message]
    F --> C

    E -- Yes --> G{Is Account Active?}
    G -- No --> H[Show 'Account Deactivated' Message]
    H --> B

    G -- Yes --> I[Identify Role]
    I --> J{Role?}

    J -- Administrator --> K[Redirect: /admin/dashboard]
    J -- Caregiver --> L[Redirect: /caregiver/dashboard]
    J -- Parent/Guardian --> M[Redirect: /parent/dashboard]

    K --> N([Admin Dashboard])
    L --> O([Caregiver Dashboard])
    M --> P([Parent Dashboard])
```

---

## FC-02: Caregiver Takes Attendance

**Implements:** REQ15, REQ16, REQ17  
**Use Case:** UC-02

```mermaid
flowchart TD
    A([Caregiver Dashboard]) --> B[Select Attendance]
    B --> C[System Shows Assigned Classroom & Date]
    C --> D[System Loads Child List for Classroom]
    D --> E{For Each Child in List}

    E --> F[/Record Check-in Time\]
    F --> G[/Record Check-out Time\]
    G --> H[/Set Status: Present / Absent / Late / Excused\]
    H --> I[Optional: Add Notes]
    I --> J{More Children?}
    J -- Yes --> E
    J -- No --> K[Save Attendance]

    K --> L{Save Successful?}
    L -- No --> M[Show Error; Retry]
    M --> K
    L -- Yes --> N[Confirmation Shown]
    N --> O([Attendance record stored in DB])
    O --> P([Parent can now view — REQ16])
```

---

## FC-03: Caregiver Logs a Daily Activity

**Implements:** REQ18, REQ19, REQ20  
**Use Case:** UC-03

```mermaid
flowchart TD
    A([Caregiver Dashboard]) --> B[Select Daily Activity Log]
    B --> C[Select Child from Assigned Classroom]
    C --> D[/Choose Activity Type\]
    D --> E{Activity Type}

    E -- Meal --> F[Enter Meal Details / Notes]
    E -- Nap --> G[Enter Duration in Minutes]
    E -- Diaper Change --> H[Enter Notes]
    E -- Learning/Play Activity --> I[Enter Activity Description]
    E -- Mood Note --> J[Rate Mood 1-5 + Notes]
    E -- Other --> K[Enter Free-text Details]

    F --> L[Submit Entry]
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L

    L --> M{Validation OK?}
    M -- No --> N[Show Validation Errors]
    N --> D
    M -- Yes --> O[Save Log Entry]

    O --> P([activity_logs row inserted])
    P --> Q([Parent can view — REQ19])
    P --> R([System can calculate daily summaries — REQ20])
```

---

## FC-04: Authorized Staff Records / Updates a Medical Record

**Implements:** REQ21, REQ22, REQ23, REQ24  
**Use Case:** UC-04

```mermaid
flowchart TD
    A([Staff Member: Admin or Caregiver]) --> B[Select a Child's Profile]
    B --> C[Click 'Medical Records']
    C --> D{Is User Authorized to Write?}

    D -- No: Parent / Unauthorized Caregiver --> E[Show Read-Only View]
    E --> F([REQ22: Parent sees but cannot edit])

    D -- Yes: Admin or Authorized Caregiver --> G[Show Editable Medical Record Form]
    G --> H[/Edit: Allergies, Conditions, Medications,\nImmunizations, Physician, Incidents, Care Notes\]
    H --> I[Submit Changes]
    I --> J{Validation OK?}
    J -- No --> K[Show Validation Errors]
    K --> H
    J -- Yes --> L[Save Medical Record]

    L --> M[Write Audit Row: actor_user_id + action + timestamp]
    M --> N([medical_record_audit row inserted — REQ23])

    L --> O{Has Severe Allergy?}
    O -- Yes --> P[Set allergy_flag = true on children table]
    P --> Q([Alert badge shown when child profile viewed — REQ24])
    O -- No --> R([Record saved successfully])
```

---

## FC-05: Parent Views Their Child's Information

**Implements:** REQ10, REQ16, REQ19, REQ22, REQ26, REQ27

```mermaid
flowchart TD
    A([Parent Logs In]) --> B[Parent Dashboard]

    B --> C{Dashboard Widget: Child Profile}
    C --> D[/Display: Name, DOB, Classroom, Allergy Alert\]

    B --> E{Dashboard Widget: Today's Attendance}
    E --> F[Query attendance WHERE child_id = X AND date = today]
    F --> G[/Show: Present / Absent / Check-in Time\]

    B --> H{Dashboard Widget: Recent Activity Logs}
    H --> I[Query activity_logs WHERE child_id = X ORDER BY logged_at DESC]
    I --> J[/Show: Meals, Naps, Activities from today\]

    B --> K{Dashboard Widget: Medical Alerts}
    K --> L{allergy_flag = true?}
    L -- Yes --> M[/Show Allergy Alert Badge — REQ24\]
    L -- No --> N[No alert shown]

    B --> O{Dashboard Widget: Notices}
    O --> P[Query notices WHERE classroom_id = child's classroom OR center-wide]
    P --> Q[/Show: Recent notices — REQ26\]

    B --> R{AI Guardian Button}
    R --> S([Navigate to AI Guardian Chat — REQ27, EI02])
```

---

## FC-06: AI Guardian Query Flow

**Implements:** REQ30, REQ31, REQ32, REQ33, REQ35, REQ36, REQ37  
**Use Case:** UC-05

```mermaid
flowchart TD
    A([Parent: AI Guardian Page]) --> B[Select Child]
    B --> C{Parent-Child Link Valid?}
    C -- No --> D[Error: Unauthorized]
    D --> B

    C -- Yes --> E[/Type Question in Natural Language\]
    E --> F[Submit]
    F --> G[Server: AIGuardianService receives request]

    G --> H[Verify guardian_user_id + child_id in child_guardians table]
    H --> I{Ownership Confirmed?}
    I -- No --> J[Return 403 Forbidden]
    J --> E

    I -- Yes --> K[Gather Scoped Child Data]
    K --> K1[Query attendance for child]
    K --> K2[Query activity_logs for child]
    K --> K3[Query medical_records for child]
    K1 --> L[Build Claude API Prompt]
    K2 --> L
    K3 --> L

    L --> M{Follow-up in Same Session?}
    M -- Yes --> N[Append recent session turns to prompt]
    M -- No --> O[New session token generated]
    N --> P[Call Claude API]
    O --> P

    P --> Q{Claude API Response OK?}
    Q -- Error --> R[Return Error to Parent]
    R --> E

    Q -- OK --> S[Synthesized Answer Received]
    S --> T[Persist to ai_guardian_sessions]
    T --> T1[guardian_user_id, child_id, session_token, query, response, timestamp]
    T1 --> U([Audit log written — REQ37])

    S --> V[Detect Response Language]
    V --> W{Language: Bangla or English?}
    W -- Bangla --> X[Return Bangla Response — REQ35]
    W -- English --> Y[Return English Response — REQ35]
    X --> Z[/Display Response in Chat UI\]
    Y --> Z

    Z --> AA{Parent has follow-up?}
    AA -- Yes --> E
    AA -- No --> AB([Session Complete])
```

---

## FC-07: Administrator Manages a Child Profile

**Implements:** REQ08, REQ09, REQ10, REQ14

```mermaid
flowchart TD
    A([Admin Dashboard]) --> B[Navigate to Children Management]
    B --> C{Action}

    C -- Add New Child --> D[/Fill Child Profile Form:\nName, DOB, Classroom, Guardian,\nEmergency Contact, Allergy Flag\]
    D --> E{Validation OK?}
    E -- No --> F[Show Errors]
    F --> D
    E -- Yes --> G[Create children record]
    G --> H[Create child_guardians link if guardian user specified]
    H --> I[Assign to classroom: update classroom_id]
    I --> J([Child profile created])

    C -- Update Existing Child --> K[Select Child from List]
    K --> L[/Edit Profile Form\]
    L --> M{Validation OK?}
    M -- No --> N[Show Errors]
    N --> L
    M -- Yes --> O[Update children record]
    O --> P([Profile updated])

    C -- Assign to Classroom --> Q[Select Child + Select Classroom]
    Q --> R[Update children.classroom_id]
    R --> S([Classroom assigned — REQ14])
```

---

## FC-08: Notice Publishing Flow

**Implements:** REQ25, REQ26

```mermaid
flowchart TD
    A([Admin or Authorized Caregiver]) --> B[Navigate to Notices]
    B --> C[Click Publish New Notice]
    C --> D[/Fill: Title, Description, Date\]
    D --> E{Scope}
    E -- Classroom-Specific --> F[/Select Classroom\]
    F --> G[Set classroom_id on notice]
    E -- Center-Wide --> H[Leave classroom_id as NULL]

    G --> I[Submit Notice]
    H --> I

    I --> J{Validation OK?}
    J -- No --> K[Show Errors]
    K --> D
    J -- Yes --> L[Save to notices table]

    L --> M([Notice published with author_user_id + published_at])
    M --> N{Who Can See It?}
    N -- classroom_id set --> O[Parents in that classroom see it — REQ26]
    N -- classroom_id NULL --> P[All parents see it — center-wide]
```

---

## FC-09: File / Image Upload via Cloudinary

**Implements:** Cloudinary integration (Week 2 architecture decision)

```mermaid
flowchart TD
    A([User Initiates Upload]) --> B{What type of upload?}

    B -- Child Profile Photo --> C[Admin selects child; opens upload form]
    B -- User Avatar --> D[User opens profile settings; opens upload form]
    B -- Caregiver Photo --> E[Admin selects caregiver; opens upload form]

    C --> F[File selected by user]
    D --> F
    E --> F

    F --> G[Client sends file to Next.js Server Action]
    G --> H{File valid? Size, type checks}
    H -- No --> I[Return Validation Error to Client]
    I --> F

    H -- Yes --> J[Server calls Cloudinary SDK]
    J --> K[Cloudinary stores binary file]
    K --> L[Cloudinary returns public_id + secure_url + metadata]

    L --> M[Insert row into media_assets table]
    M --> N{Linked entity}
    N -- Child --> O[Update children.avatar_asset_id = media_assets.id]
    N -- User --> P[Update users.avatar_asset_id = media_assets.id]
    N -- Caregiver --> Q[No direct FK; entity_type + entity_id on media_assets row]

    O --> R([Upload complete; client receives secure_url])
    P --> R
    Q --> R
    R --> S[Client displays image using secure_url from Cloudinary CDN]
```

---

## FC-10: Parent Submits Complaint with Proof & Admin Resolution

**Implements:** REQ38, REQ39  
**Use Case:** UC-06

```mermaid
flowchart TD
    A([Parent Dashboard]) --> B[Click 'Complaints / Incident Report']
    B --> C[/Open Complaint Filing Form\]
    C --> D[/Select Target Caregiver\]
    C --> E[/Select Affected Child (Optional)\]
    C --> F[/Enter Title & Incident Description\]
    C --> G[/Optional: Attach Photo / Document Proof\]

    G --> H{Has Proof Attachment?}
    H -- Yes --> I[Upload File to Cloudinary SDK via Server Action]
    I --> J[Cloudinary returns public_id + secure_url]
    J --> K[Insert record into media_assets]
    K --> L[Link proof_asset_id to Complaint]
    H -- No --> L[Set proof_asset_id = NULL]

    L --> M[Save Complaint with status = 'pending']
    M --> N([complaints record inserted in DB])
    N --> O[Administrator Receives Dashboard Alert]

    O --> P([Admin Complaints Management Screen])
    P --> Q[Admin Inspects Complaint Details & Proof Asset]
    Q --> R{Admin Decision}

    R -- Mark Under Review --> S[Update status = 'under_review' + Add notes]
    R -- Resolve Complaint --> T[Take corrective action + Set status = 'resolved']
    R -- Dismiss / Invalid --> U[Add explanation notes + Set status = 'dismissed']

    S --> V[Record resolved_by_user_id & updated_at]
    T --> V
    U --> V
    V --> W([Parent Views Updated Resolution Status & Admin Reply — REQ38, REQ39])
```

---

## FC-11: Caregiver Child Photo/Video Upload & Parent Media Gallery

**Implements:** REQ40, REQ41  
**Use Case:** UC-07

```mermaid
flowchart TD
    A([Caregiver Dashboard]) --> B[Click 'Media Moments / Upload']
    B --> C[/Select Capture Type: Photo or Video\]
    C --> D[/Tag Target Child or Entire Classroom\]
    D --> E[/Add Optional Caption / Activity Note\]
    E --> F[Select Image/Video File from Device]

    F --> G[Submit via Next.js Server Action]
    G --> H{Validation: Format & Size Check}
    H -- Invalid --> I[Show Error; Reject File]
    I --> F

    H -- Valid --> J[Upload to Cloudinary via MediaService]
    J --> K[Cloudinary saves media & generates CDN secure_url]
    K --> L[Insert metadata into media_assets table]
    L --> M[Insert row into child_media_posts]
    M --> N([child_media_posts record created in DB — REQ40])

    N --> O{Parent Logs In}
    O --> P[Navigate to Child Media Gallery]
    P --> Q[Query child_media_posts WHERE child_id IN parent's children OR classroom_id = child's classroom]
    Q --> R[Display High-Resolution Photo/Video Stream with Captions]
    R --> S([Parent Views Child Moments with Strict Data Isolation — REQ41])
```

---

## Flowchart Summary

| ID | Flowchart Name | Primary SRS References |
|---|---|---|
| FC-01 | User Login & Role-Based Routing | REQ01–REQ03 |
| FC-02 | Caregiver Takes Attendance | REQ15–REQ17 |
| FC-03 | Caregiver Logs a Daily Activity | REQ18–REQ20 |
| FC-04 | Authorized Staff Records a Medical Record | REQ21–REQ24 |
| FC-05 | Parent Views Their Child's Information | REQ10, REQ16, REQ19, REQ22, REQ26, REQ27 |
| FC-06 | AI Guardian Query Flow | REQ30–REQ37, EI02 |
| FC-07 | Administrator Manages a Child Profile | REQ08, REQ09, REQ10, REQ14 |
| FC-08 | Notice Publishing Flow | REQ25–REQ26 |
| FC-09 | File / Image Upload via Cloudinary | Architecture / Media Layer |
| FC-10 | Parent Submits Complaint with Proof & Admin Resolution | REQ38–REQ39, UC-06 |
| FC-11 | Caregiver Photo/Video Upload & Parent Media Gallery | REQ40–REQ41, UC-07 |
