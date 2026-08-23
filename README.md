# KiddieOps

**Smart Daycare Management and AI Guardian Platform**

KiddieOps is a web-based, mobile-responsive daycare management platform built for daycare centers and childcare facilities in Bangladesh. It gives administrators and caregivers simple tools to run daily operations, and gives parents real-time, meaningful insight into their child's day through a conversational **AI Guardian Assistant** — instead of forcing them to scroll through raw timelines of meals, naps, and diaper changes.

> Course project — Web Programming and Mobile Application Development.
> Status: **Week 2 — Design & Planning**

---

## Why this project

Daycare centers in Bangladesh largely rely on paper logs or informal messaging groups to communicate a child's day to parents, which is easy to lose, hard to search, and gives no real sense of trends over time. Parents are left piecing together their child's routine, health, and development from scattered updates instead of getting a clear, synthesized picture.

KiddieOps is scoped around that gap: a simple, role-based daycare operations system, paired with an AI Guardian Assistant that can answer a parent's actual question — *"did she sleep less than usual today?"* — by reading across attendance, activity logs, and medical records for that specific child, rather than requiring the parent to dig through raw entries themselves.

## Core features

- **Role-based platform** — Administrator, Caregiver, and Parent/Guardian each get a dashboard scoped to what they're allowed to see and do
- **Attendance management** — daily check-in/check-out tracking per classroom/group, with history for parents
- **Daily activity logging** — meals, naps, diaper changes, play/learning activity, and mood, logged per child by caregivers
- **Child photo & video moment sharing** — caregivers capture and share daily moments; parents view photos and video clips in a private, child-isolated media gallery (Cloudinary CDN)
- **Parent complaint system with proof** — parents can submit formal incident reports against caregivers directly to administrators with attached photo/document evidence; administrators investigate, manage status, and respond
- **Medical records** — allergies, conditions, medications, immunizations, and incident reports, with strict read/write permissions and a full audit log
- **Notice board** — announcements from admins/caregivers to parents (closures, fee reminders, events, policy updates)
- **AI Guardian Assistant** — a chat-based assistant (powered by the Claude API) that answers parents' natural-language questions by synthesizing that child's own logs, trends, and milestones — supports Bangla and English, follow-up questions, and time-period comparisons
- **Data isolation by design** — every parent's session, media feed, and AI Guardian queries are strictly scoped to their own child's data

See [`docs/KiddieOps_SRS.docx`](docs/KiddieOps_SRS.docx) for the full Software Requirements Specification, including requirement IDs (REQ01–REQ41, NFR01–NFR12, EI01–EI02), MoSCoW priorities, and a full traceability matrix.

## Tech stack

| Layer            | Technology                                                              |
| ---------------- | ----------------------------------------------------------------------- |
| Framework        | Next.js 14+ (App Router) — full-stack: frontend + backend in one        |
| Language         | TypeScript                                                              |
| ORM              | Drizzle ORM                                                             |
| Database         | PostgreSQL                                                              |
| Auth             | NextAuth.js + bcrypt (password hashing)                                 |
| File/Image storage | Cloudinary (binary files; PostgreSQL stores metadata only)            |
| AI Guardian      | Claude API (Anthropic)                                                  |
| Hosting (target) | TBD — see [`docs/architechture.md`](docs/architechture.md)              |

## Project structure

```
kiddieops/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── (auth)/login/
│   ├── admin/
│   ├── caregiver/
│   └── parent/
├── components/             # Shared UI components
├── lib/
│   ├── db.ts               # Drizzle client
│   ├── schema/             # Drizzle schema definitions
│   ├── services/           # Domain service modules
│   └── validations/        # Zod schemas
├── middleware.ts            # Auth + RBAC protection
├── docs/
│   ├── KiddieOps_SRS.docx  # Software Requirements Specification
│   ├── architechture.md    # System architecture (v2.0 — Week 2)
│   ├── database-schema.md  # PostgreSQL schema documentation
│   ├── er-diagram.md       # Entity-Relationship diagram (Mermaid)
│   ├── flowcharts.md       # System flowcharts (Mermaid)
│   ├── ui-wireframes.md    # UI Wireframes documentation & specifications
│   ├── wireframes-canvas.html # Interactive visual UI wireframe canvas board
│   ├── api-contract.md     # API contract (planned)
│   └── tasks.md            # Sprint backlog / task list
├── CONTRIBUTING.md
└── README.md
```

> Note: The `app/`, `components/`, and `lib/` directories will be scaffolded in Week 3 when implementation begins. The `docs/` folder contains all Week 2 design and planning artifacts.

## Getting started

> Setup instructions below are the target flow once the codebase is scaffolded (Week 3–4). Update this section as soon as the Next.js project is initialized.

```bash
# Install dependencies
npm install

# Run development server
npm run dev          # starts Next.js dev server on localhost:3000

# Database migrations (once schema is implemented in Week 3)
npx drizzle-kit generate
npx drizzle-kit migrate
```

Environment variables (`.env.local`, not committed):

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

## User roles

| Role                | Can do |
| -------------------- | ------ |
| **Administrator**    | Manage users, children, caregivers, classrooms/groups; review, investigate & resolve parent complaints; publish notices; oversee medical records |
| **Caregiver**        | Take attendance, log daily activities, capture & upload photos/videos of children, record medical notes (if authorized), view assigned classroom/children |
| **Parent/Guardian**  | View their own child's profile, attendance, activity logs, private photo/video gallery, submit complaints with proof against caregivers, view medical records (read-only), notices, and use the AI Guardian Assistant |

## Team

| Member                 |
| ---------------------- |
| Md. Habibur Rahman     |
| Radhika Chowdhury      |

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch naming, commit conventions, and PR review rules.

## Roadmap

- [x] **Week 1 — Initiation & SRS**: scope/objectives/roles, SRS v2.0 with prioritized requirement IDs, repo + contribution guidelines, README + initial task list
- [x] **Week 2 — Design & Planning**: UI wireframes (Login, Parent Dashboard, Caregiver Dashboard, Admin Dashboard, Complaints with Proof, Media Gallery, AI Guardian Chat), interactive HTML canvas board, architecture documentation v2.0 (Next.js + Drizzle ORM + PostgreSQL + Cloudinary), ER diagram, database schema documentation (15 tables/enums), system flowcharts (11 flows)
- [ ] **Week 3–4 — Development Sprint 1**: Next.js project scaffold, Drizzle ORM setup, auth (NextAuth.js), core CRUD modules (users, children, caregivers, classrooms)
- [ ] **Week 5–6 — Development Sprint 2**: attendance, daily activity logging, child photo/video sharing (Cloudinary), parent complaints with proof & admin resolution, medical records, notices, dashboards
- [ ] **Week 7–8 — Development Sprint 3**: AI Guardian Assistant integration (Claude API), Bangla/English support
- [ ] **Week 9+ — Hardening & Demo Prep**: security review, responsive polish, final testing, presentation

## License

TBD (course project — a license needed before any public/production use).

