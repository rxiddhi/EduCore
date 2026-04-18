-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('STUDENT', 'TEACHER', 'ADMIN')) default 'STUDENT',
  created_at timestamptz not null default now()
);

-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  credits int not null check (credits between 1 and 6),
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Enrollments
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- Grades
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  grade_letter text not null,
  grade_points numeric(3,2) not null check (grade_points between 0 and 4),
  credits int not null check (credits between 1 and 6),
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- Attendance
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  class_date date not null,
  status text not null check (status in ('PRESENT', 'ABSENT')),
  created_at timestamptz not null default now(),
  unique (student_id, course_id, class_date)
);

create or replace view public.attendance_summary as
select
  student_id,
  count(*) filter (where status = 'PRESENT')::int as present_count,
  count(*)::int as total_count
from public.attendance
group by student_id;

-- Audits
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
