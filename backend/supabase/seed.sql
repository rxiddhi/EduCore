-- EduCore demo seed data for Supabase
-- 1. Ensure you have created these users in Supabase Auth (Authentication > Users):
--    admin@educore.demo, teacher@educore.demo, student1@educore.demo, student2@educore.demo, student3@educore.demo
-- 2. Run this file in the Supabase SQL Editor after running schema.sql

begin;

-- 1) Get user IDs for demo emails
with demo_users as (
  select
    (select id from auth.users where lower(email) = 'admin@educore.demo') as admin_id,
    (select id from auth.users where lower(email) = 'teacher@educore.demo') as teacher_id,
    (select id from auth.users where lower(email) = 'student1@educore.demo') as student1_id,
    (select id from auth.users where lower(email) = 'student2@educore.demo') as student2_id,
    (select id from auth.users where lower(email) = 'student3@educore.demo') as student3_id
)

-- 2) Upsert demo profiles
insert into public.profiles (id, email, full_name, role)
select admin_id, 'admin@educore.demo', 'Admin Operator', 'ADMIN' from demo_users
union all select teacher_id, 'teacher@educore.demo', 'Dr. Elena Thorne', 'TEACHER' from demo_users
union all select student1_id, 'student1@educore.demo', 'Aarav Sharma', 'STUDENT' from demo_users
union all select student2_id, 'student2@educore.demo', 'Maya Patel', 'STUDENT' from demo_users
union all select student3_id, 'student3@educore.demo', 'Riya Mehta', 'STUDENT' from demo_users
on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, role = excluded.role;

-- 3) Upsert demo courses (code, title, credits, teacher_id)
with demo_users as (
  select (select id from auth.users where lower(email) = 'teacher@educore.demo') as teacher_id
)
insert into public.courses (code, title, credits, teacher_id)
select 'DEMO-CS101', 'Introduction to Programming', 3, teacher_id from demo_users
union all select 'DEMO-MTH210', 'Applied Statistics', 4, teacher_id from demo_users
union all select 'DEMO-WEB330', 'Full Stack Development', 3, teacher_id from demo_users
on conflict (code) do update set title = excluded.title, credits = excluded.credits, teacher_id = excluded.teacher_id;

-- 4) Get course IDs for demo codes
with course_ids as (
  select code, id from public.courses where code in ('DEMO-CS101', 'DEMO-MTH210', 'DEMO-WEB330')
), demo_users as (
  select
    (select id from auth.users where lower(email) = 'student1@educore.demo') as student1_id,
    (select id from auth.users where lower(email) = 'student2@educore.demo') as student2_id,
    (select id from auth.users where lower(email) = 'student3@educore.demo') as student3_id
)
-- 5) Insert enrollments
insert into public.enrollments (student_id, course_id)
select student1_id, (select id from course_ids where code = 'DEMO-CS101') from demo_users
union all select student1_id, (select id from course_ids where code = 'DEMO-MTH210') from demo_users
union all select student1_id, (select id from course_ids where code = 'DEMO-WEB330') from demo_users
union all select student2_id, (select id from course_ids where code = 'DEMO-CS101') from demo_users
union all select student2_id, (select id from course_ids where code = 'DEMO-MTH210') from demo_users
union all select student3_id, (select id from course_ids where code = 'DEMO-CS101') from demo_users
union all select student3_id, (select id from course_ids where code = 'DEMO-WEB330') from demo_users
on conflict (student_id, course_id) do nothing;

-- 6) Insert demo grades
insert into public.grades (student_id, course_id, grade_letter, grade_points, credits)
select student1_id, (select id from course_ids where code = 'DEMO-CS101'), 'A', 4.0, 3 from demo_users
union all select student2_id, (select id from course_ids where code = 'DEMO-CS101'), 'B+', 3.3, 3 from demo_users
union all select student3_id, (select id from course_ids where code = 'DEMO-CS101'), 'A-', 3.7, 3 from demo_users
union all select student1_id, (select id from course_ids where code = 'DEMO-MTH210'), 'B', 3.0, 4 from demo_users
union all select student2_id, (select id from course_ids where code = 'DEMO-MTH210'), 'C', 2.0, 4 from demo_users
union all select student1_id, (select id from course_ids where code = 'DEMO-WEB330'), 'A-', 3.7, 3 from demo_users
on conflict (student_id, course_id) do nothing;

-- 7) Insert demo attendance (last 10 days, mostly present)
with demo_users as (
  select
    (select id from auth.users where lower(email) = 'student1@educore.demo') as student1_id,
    (select id from auth.users where lower(email) = 'student2@educore.demo') as student2_id,
    (select id from auth.users where lower(email) = 'student3@educore.demo') as student3_id
), course_ids as (
  select code, id from public.courses where code in ('DEMO-CS101', 'DEMO-MTH210', 'DEMO-WEB330')
), days as (
  select generate_series(0, 9) as day_offset
), attendance_rows as (
  select student1_id as student_id, (select id from course_ids where code = 'DEMO-CS101') as course_id, day_offset, case when day_offset < 9 then 'PRESENT' else 'ABSENT' end as status from demo_users, days
  union all select student1_id, (select id from course_ids where code = 'DEMO-MTH210'), day_offset, case when day_offset < 8 then 'PRESENT' else 'ABSENT' end from demo_users, days
  union all select student1_id, (select id from course_ids where code = 'DEMO-WEB330'), day_offset, case when day_offset < 9 then 'PRESENT' else 'ABSENT' end from demo_users, days
  union all select student2_id, (select id from course_ids where code = 'DEMO-CS101'), day_offset, case when day_offset < 7 then 'PRESENT' else 'ABSENT' end from demo_users, days
  union all select student2_id, (select id from course_ids where code = 'DEMO-MTH210'), day_offset, case when day_offset < 6 then 'PRESENT' else 'ABSENT' end from demo_users, days
  union all select student3_id, (select id from course_ids where code = 'DEMO-CS101'), day_offset, case when day_offset < 8 then 'PRESENT' else 'ABSENT' end from demo_users, days
  union all select student3_id, (select id from course_ids where code = 'DEMO-WEB330'), day_offset, case when day_offset < 7 then 'PRESENT' else 'ABSENT' end from demo_users, days
)
insert into public.attendance (student_id, course_id, class_date, status)
select student_id, course_id, (current_date - day_offset)::date, status from attendance_rows
on conflict (student_id, course_id, class_date) do nothing;

-- 8) Insert demo audit logs
with demo_users as (
  select (select id from auth.users where lower(email) = 'admin@educore.demo') as admin_id,
         (select id from auth.users where lower(email) = 'teacher@educore.demo') as teacher_id
)
insert into public.audit_logs (actor_id, action, metadata)
select admin_id, 'DEMO_BOOTSTRAP', '{"scope":"seed"}'::jsonb from demo_users
union all select teacher_id, 'DEMO_COURSES_ASSIGNED', '{"courseCodes":["DEMO-CS101","DEMO-MTH210","DEMO-WEB330"]}'::jsonb from demo_users
union all select teacher_id, 'DEMO_GRADES_PUBLISHED', '{"records":6}'::jsonb from demo_users
on conflict do nothing;

commit;

-- Quick checks
-- select email, role from public.profiles where email like '%@educore.demo' order by email;
-- select id, code, title, credits, teacher_id from public.courses where code like 'DEMO-%';
-- select * from public.enrollments where course_id in (select id from public.courses where code like 'DEMO-%');
