# EduCore — Full‑Stack LMS (React + Express + Supabase)

EduCore is a role‑based academic management portal for students, teachers, and admins. It combines a React frontend with a TypeScript/Express backend and Supabase (Auth + Postgres) for authentication and data.

The platform focuses on day‑to‑day academic operations:
- role-based authentication and authorization
- course and enrollment visibility
- grade entry and progress tracking
- attendance tracking
- risk analytics (GPA + attendance)
- audit logging for important actions

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Zod validation

### Backend
- Node.js + Express + TypeScript
- Supabase Auth + Supabase Postgres
- Zod request validation

### Database
- Supabase-managed Postgres tables for profiles, courses, enrollments, grades, attendance, and audit logs

## Project Structure

```text
.
├── backend/                  # Express API, domain/services/repositories, Supabase scripts
│   ├── src/
│   │   ├── routes/           # REST endpoints by module
│   │   ├── repositories/     # Data access layer
│   │   ├── services/         # Business logic (GPA, analytics, audit)
│   │   ├── domain/           # Domain models + GPA strategy
│   │   └── middleware/       # auth + role guards
│   └── supabase/
│       ├── schema.sql        # Core schema
│       └── seed.sql          # SQL demo seed
├── frontend/                 # React app (student + teacher portals)
│   └── src/
│       ├── pages/            # Role-based UI pages
│       ├── context/          # Auth context
│       ├── layouts/          # Shared portal shell
│       └── api/              # API client helper
├── documentation/            # UML and design docs
└── README.md
```

## Core Features

### Authentication and Roles
- Sign up and login using Supabase auth
- Role-aware access control for `STUDENT`, `TEACHER`, and `ADMIN`
- Protected routes in frontend and backend role guards

### Student Experience
- Dashboard with GPA, attendance %, risk status, and recent grades
- My Courses view from enrolled courses
- Grades page with cumulative credits and per-course results
- Attendance page with summary and recent attendance entries

### Teacher Experience
- Course dashboard with enrollment counts, average grade, and pending grading
- Roster view for a selected course
- Attendance recording per class date
- Grade submission for rostered students
- CSV export of course analytics from the courses page

### Admin Capabilities
- List all users
- Access audit log feed
- Create courses (also available to teachers)

### Analytics and OOP Design
Backend includes explicit object-oriented layers and patterns:
- `GpaCalculator` with `WeightedGpaStrategy`
- `AcademicRiskAnalyzer` for threshold-based risk detection
- `AnalyticsService` combining grade + attendance signals
- Repository classes for persistence concerns
- `UserFactory` and domain user abstractions

## Frontend Routes

### Public
- `/login`
- `/register`

### Student
- `/student/dashboard`
- `/student/courses`
- `/student/grades`
- `/student/attendance`

### Teacher/Admin
- `/teacher/dashboard`
- `/teacher/courses`
- `/teacher/students`
- `/teacher/grades`
- `/teacher/attendance`
- `/teacher/calendar`
- `/teacher/settings`

## Backend API Overview

### Health
- `GET /health`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Users
- `GET /api/users/me`
- `GET /api/users` (ADMIN)

### Courses and Enrollments
- `GET /api/courses`
- `POST /api/courses` (TEACHER, ADMIN)
- `GET /api/enrollments/me` (STUDENT)
- `POST /api/enrollments/self-enroll` (STUDENT)

### Grades and Attendance
- `GET /api/grades/me` (STUDENT)
- `POST /api/grades` (TEACHER, ADMIN)
- `GET /api/attendance/me` (STUDENT)

### Analytics, Student, Teacher, Audit
- `GET /api/analytics/risk-status` (STUDENT)
- `GET /api/student/courses` (STUDENT)
- `GET /api/student/overview` (STUDENT)
- `GET /api/student/attendance/recent` (STUDENT)
- `GET /api/teacher/dashboard` (TEACHER, ADMIN)
- `GET /api/teacher/courses/:courseId/roster` (TEACHER, ADMIN)
- `POST /api/teacher/courses/:courseId/attendance` (TEACHER, ADMIN)
- `GET /api/audit` (ADMIN)

## Local Setup

### 1) Install dependencies

At repository root:

```bash
npm install
```

Or install each workspace independently:

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 2) Configure environment variables

Backend (`backend/.env`):

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Frontend (`frontend/.env`):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_GATEWAY_BASE=
```

Notes:
- `VITE_API_GATEWAY_BASE` is optional.
- In production, frontend defaults to `/_/backend` so it works with Vercel `experimentalServices`.
- In local development, frontend uses Vite proxy (`/api` -> `http://localhost:3000`).

### 3) Initialize database

Run `backend/supabase/schema.sql` in the Supabase SQL Editor.

Optional demo seed (choose one):

1) Seed via script (recommended): creates demo users automatically in Supabase Auth and populates tables (requires `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`):

```bash
npm --prefix backend run seed:demo
```

2) Seed via SQL: before running `backend/supabase/seed.sql`, create these users in Supabase Dashboard → Authentication → Users:
   - `admin@educore.demo`
   - `teacher@educore.demo`
   - `student1@educore.demo`
   - `student2@educore.demo`
   - `student3@educore.demo`

### 4) Start development servers

From repository root (in separate terminals):

```bash
npm run dev:backend
npm run dev:frontend
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Vite proxies `/api` and `/health` to the backend.

## Test Credentials

```text
test03@gmail.com
123456

teacher01@gmail.com
123456
```

## Demo Accounts (Seeded)

When seeded, these demo users are available (password: `Demo@1234`):

- `admin@educore.demo`
- `teacher@educore.demo`
- `student1@educore.demo`
- `student2@educore.demo`
- `student3@educore.demo`

## Documentation

The `documentation/` folder contains supporting design artifacts, including:
- ER Diagram
- Class Diagram
- Sequence Diagram
- Use Case Diagram
- Idea/notes

## Build for Production

```bash
npm --prefix backend run build
npm --prefix frontend run build
```

Then run backend:

```bash
npm --prefix backend run start
```

## Vercel Deployment (Your Setup)

Use this exact root `vercel.json`:

```json
{
  "experimentalServices": {
    "frontend": {
      "entrypoint": "frontend",
      "routePrefix": "/",
      "framework": "vite"
    },
    "backend": {
      "entrypoint": "backend",
      "routePrefix": "/_/backend"
    }
  }
}
```

### How Routing Works

- Frontend is served at `/`
- Backend is served under `/_/backend`
- API path in production becomes:
  - `/_/backend/api/...`
  - `/_/backend/health`

### Vercel Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

- `FRONTEND_ORIGIN=https://<your-project>.vercel.app`
- `SUPABASE_URL=<your-supabase-url>`
- `SUPABASE_ANON_KEY=<your-supabase-anon-key>`
- `SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>`

Optional:
- `PORT=3000` (Vercel usually provides this automatically)
- `VITE_API_GATEWAY_BASE=/_/backend` (not required because app now defaults to this in production)

### Deploy Steps

1. Push this repository to GitHub.
2. Import the repo into Vercel as a single project (root = repository root).
3. Keep `vercel.json` at the root (as shown above).
4. Add environment variables listed above.
5. Deploy.

### Post-Deploy Checks

After deploy, verify:

1. Frontend loads: `https://<your-project>.vercel.app`
2. Backend health: `https://<your-project>.vercel.app/_/backend/health`
3. Login and dashboard APIs work from the frontend without CORS errors.
