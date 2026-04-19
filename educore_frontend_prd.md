# EduCore Frontend Project Requirements

## Backend Integration
- **URL**: `http://localhost:3000` (Local)
- **Proxy**: Vite proxy for `/api` and `/health`
- **Auth**: JWT (Access/Refresh), Bearer token.
- **Roles**: STUDENT, TEACHER, ADMIN.

## Tech Stack
- React + TypeScript + Vite
- React Router (Role-based protection)
- State: Context/Hooks
- API: Centralized fetch + interceptors/refresh handling
- Forms: Zod + react-hook-form
- UI: Tailwind CSS

## Screens to Build
1. **Public**: Login, Register
2. **Shared**: Authenticated Shell (Top/Side nav)
3. **Student**: Dashboard, My Courses, My Grades, My Attendance, My Risk Status
4. **Teacher**: Assigned Courses, Submit/Update Grade, Record Attendance, Course Grades/Attendance
5. **Admin**: Users List, Course CRUD, Admin Enrollments, GPA Analytics, At-risk Analytics, Risk Config, Audit Logs

## API Endpoints (Working)
- **Auth**: register, login, refresh, logout
- **Users**: me, list (ADMIN)
- **Courses**: list, detail, CRUD (ADMIN), grades/attendance (TEACHER/ADMIN)
- **Enrollments**: list, self-enroll (STUDENT), admin-enroll (ADMIN), detail, update/delete (ADMIN)
- **Grades**: submit/update (TEACHER), me (STUDENT)
- **Attendance**: batch record/update (TEACHER), me (STUDENT)
- **Analytics**: GPA distribution, At-risk, Risk thresholds (ADMIN), Risk status (STUDENT)
- **Audit**: logs (ADMIN)
- **Health**: /health
