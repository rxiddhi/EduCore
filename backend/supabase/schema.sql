-- ═══════════════════════════════════════════════════════════════
-- EduCore — Full Database Schema
-- Run this in Supabase SQL Editor before using seed:demo
-- ═══════════════════════════════════════════════════════════════

-- ── Enum Types ──

do $$ begin
  create type assessment_type as enum ('QUIZ', 'ASSIGNMENT', 'MIDTERM', 'FINAL', 'PROJECT');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type audit_action as enum ('CREATE', 'UPDATE', 'DELETE');
exception when duplicate_object then null;
end $$;

-- ── Profiles (synced from Supabase Auth) ──

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('STUDENT', 'TEACHER', 'ADMIN')) default 'STUDENT',
  created_at timestamptz not null default now()
);

-- ── Users (application-level mirror of auth.users) ──

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  password_hash text not null default 'supabase_managed_auth',
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('STUDENT', 'TEACHER', 'ADMIN')) default 'STUDENT',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Teachers ──

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  employee_code text not null unique,
  department text not null,
  specialization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Students ──

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  student_code text not null unique,
  programme text not null,
  year_of_study int not null check (year_of_study between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Courses ──

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_code text,
  name text not null,
  title text not null,
  description text,
  credits int not null check (credits between 1 and 6),
  credit_hours int,
  semester text,
  is_active boolean not null default true,
  teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Enrollments ──

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- ── Grades ──

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  grade_letter text not null,
  grade_points numeric(3,2) not null check (grade_points between 0 and 4),
  credits int not null check (credits between 1 and 6),
  score numeric(5,2) not null,
  weighted_score numeric(5,2) not null,
  assessment_type assessment_type not null default 'FINAL',
  submitted_by uuid not null references public.teachers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- ── Attendance ──

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  class_date date not null,
  session_date date not null,
  status text not null check (status in ('PRESENT', 'ABSENT')),
  recorded_by uuid not null references public.teachers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, course_id, class_date)
);

-- ── Attendance Summary View ──

create or replace view public.attendance_summary as
select
  student_id,
  count(*) filter (where status = 'PRESENT')::int as present_count,
  count(*)::int as total_count
from public.attendance
group by student_id;

-- ── Audit Logs ──

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action audit_action not null,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now()
);
