import { supabaseAdmin } from '../config/supabase.js';

type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

type DemoUser = {
  email: string;
  password: string;
  full_name: string;
  role: Role;
};

type CourseSeed = {
  code: string;
  title: string;
  credits: number;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@educore.demo',
    password: 'Demo@1234',
    full_name: 'Admin Operator',
    role: 'ADMIN'
  },
  {
    email: 'teacher@educore.demo',
    password: 'Demo@1234',
    full_name: 'Dr. Elena Thorne',
    role: 'TEACHER'
  },
  {
    email: 'student1@educore.demo',
    password: 'Demo@1234',
    full_name: 'Aarav Sharma',
    role: 'STUDENT'
  },
  {
    email: 'student2@educore.demo',
    password: 'Demo@1234',
    full_name: 'Maya Patel',
    role: 'STUDENT'
  },
  {
    email: 'student3@educore.demo',
    password: 'Demo@1234',
    full_name: 'Riya Mehta',
    role: 'STUDENT'
  }
];

const COURSE_SEEDS: CourseSeed[] = [
  {
    code: 'DEMO-CS101',
    title: 'Introduction to Programming',
    credits: 3
  },
  {
    code: 'DEMO-MTH210',
    title: 'Applied Statistics',
    credits: 4
  },
  {
    code: 'DEMO-WEB330',
    title: 'Full Stack Development',
    credits: 3
  }
];

async function findAuthUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const perPage = 200;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Unable to list auth users: ${error.message}`);

    const users = data.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (found) return found;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function ensureAuthUser(user: DemoUser) {
  const existingUser = await findAuthUserByEmail(user.email);

  if (existingUser) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
        role: user.role
      }
    });

    if (error || !data.user) {
      throw new Error(`Unable to update auth user ${user.email}: ${error?.message ?? 'Unknown error'}`);
    }

    return data.user.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      role: user.role
    }
  });

  if (error || !data.user) {
    throw new Error(`Unable to create auth user ${user.email}: ${error?.message ?? 'Unknown error'}`);
  }

  return data.user.id;
}

function isoDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildAttendanceSeries(
  studentId: string,
  courseId: string,
  presentCount: number,
  dayOffsets: number[]
): Array<{
  student_id: string;
  course_id: string;
  class_date: string;
  status: 'PRESENT' | 'ABSENT';
}> {
  return dayOffsets.map((offset, idx) => ({
    student_id: studentId,
    course_id: courseId,
    class_date: isoDateDaysAgo(offset),
    status: idx < presentCount ? 'PRESENT' : 'ABSENT'
  }));
}

async function seed() {
  console.log('🌱 Seeding EduCore demo data...');

  const userIdByEmail: Record<string, string> = {};

  for (const demoUser of DEMO_USERS) {
    const userId = await ensureAuthUser(demoUser);
    userIdByEmail[demoUser.email] = userId;
  }

  const profilesPayload = DEMO_USERS.map((user) => ({
    id: userIdByEmail[user.email],
    email: user.email,
    full_name: user.full_name,
    role: user.role
  }));

  const { error: profilesError } = await supabaseAdmin.from('profiles').upsert(profilesPayload);
  if (profilesError) throw new Error(`Unable to upsert profiles: ${profilesError.message}`);

  const teacherId = userIdByEmail['teacher@educore.demo'];

  const { data: courses, error: coursesError } = await supabaseAdmin
    .from('courses')
    .upsert(
      COURSE_SEEDS.map((course) => ({
        code: course.code,
        title: course.title,
        credits: course.credits,
        teacher_id: teacherId
      })),
      { onConflict: 'code' }
    )
    .select('id,code,title,credits,teacher_id');

  if (coursesError || !courses?.length) {
    throw new Error(`Unable to upsert courses: ${coursesError?.message ?? 'No courses returned'}`);
  }

  const courseIdByCode = new Map(courses.map((course) => [course.code, course.id]));
  const courseIds = [...courseIdByCode.values()];

  const { error: deleteAttendanceError } = await supabaseAdmin.from('attendance').delete().in('course_id', courseIds);
  if (deleteAttendanceError) throw new Error(`Unable to reset attendance: ${deleteAttendanceError.message}`);

  const { error: deleteGradesError } = await supabaseAdmin.from('grades').delete().in('course_id', courseIds);
  if (deleteGradesError) throw new Error(`Unable to reset grades: ${deleteGradesError.message}`);

  const { error: deleteEnrollmentsError } = await supabaseAdmin.from('enrollments').delete().in('course_id', courseIds);
  if (deleteEnrollmentsError) throw new Error(`Unable to reset enrollments: ${deleteEnrollmentsError.message}`);

  const student1Id = userIdByEmail['student1@educore.demo'];
  const student2Id = userIdByEmail['student2@educore.demo'];
  const student3Id = userIdByEmail['student3@educore.demo'];

  const enrollments = [
    { student_id: student1Id, course_id: courseIdByCode.get('DEMO-CS101')! },
    { student_id: student1Id, course_id: courseIdByCode.get('DEMO-MTH210')! },
    { student_id: student1Id, course_id: courseIdByCode.get('DEMO-WEB330')! },
    { student_id: student2Id, course_id: courseIdByCode.get('DEMO-CS101')! },
    { student_id: student2Id, course_id: courseIdByCode.get('DEMO-MTH210')! },
    { student_id: student3Id, course_id: courseIdByCode.get('DEMO-CS101')! },
    { student_id: student3Id, course_id: courseIdByCode.get('DEMO-WEB330')! }
  ];

  const { error: enrollmentsError } = await supabaseAdmin.from('enrollments').insert(enrollments);
  if (enrollmentsError) throw new Error(`Unable to insert enrollments: ${enrollmentsError.message}`);

  const grades = [
    {
      student_id: student1Id,
      course_id: courseIdByCode.get('DEMO-CS101')!,
      grade_letter: 'A',
      grade_points: 4.0,
      credits: 3
    },
    {
      student_id: student2Id,
      course_id: courseIdByCode.get('DEMO-CS101')!,
      grade_letter: 'B+',
      grade_points: 3.3,
      credits: 3
    },
    {
      student_id: student3Id,
      course_id: courseIdByCode.get('DEMO-CS101')!,
      grade_letter: 'A-',
      grade_points: 3.7,
      credits: 3
    },
    {
      student_id: student1Id,
      course_id: courseIdByCode.get('DEMO-MTH210')!,
      grade_letter: 'B',
      grade_points: 3.0,
      credits: 4
    },
    {
      student_id: student2Id,
      course_id: courseIdByCode.get('DEMO-MTH210')!,
      grade_letter: 'C',
      grade_points: 2.0,
      credits: 4
    },
    {
      student_id: student1Id,
      course_id: courseIdByCode.get('DEMO-WEB330')!,
      grade_letter: 'A-',
      grade_points: 3.7,
      credits: 3
    }
  ];

  const { error: gradesError } = await supabaseAdmin.from('grades').insert(grades);
  if (gradesError) throw new Error(`Unable to insert grades: ${gradesError.message}`);

  const dayOffsets = [2, 5, 9, 12, 16, 19, 23, 26, 30, 33];

  const attendanceRows = [
    ...buildAttendanceSeries(student1Id, courseIdByCode.get('DEMO-CS101')!, 9, dayOffsets),
    ...buildAttendanceSeries(student1Id, courseIdByCode.get('DEMO-MTH210')!, 8, dayOffsets),
    ...buildAttendanceSeries(student1Id, courseIdByCode.get('DEMO-WEB330')!, 9, dayOffsets),
    ...buildAttendanceSeries(student2Id, courseIdByCode.get('DEMO-CS101')!, 7, dayOffsets),
    ...buildAttendanceSeries(student2Id, courseIdByCode.get('DEMO-MTH210')!, 6, dayOffsets),
    ...buildAttendanceSeries(student3Id, courseIdByCode.get('DEMO-CS101')!, 8, dayOffsets),
    ...buildAttendanceSeries(student3Id, courseIdByCode.get('DEMO-WEB330')!, 7, dayOffsets)
  ];

  const { error: attendanceError } = await supabaseAdmin.from('attendance').insert(attendanceRows);
  if (attendanceError) throw new Error(`Unable to insert attendance: ${attendanceError.message}`);

  const actorIds = Object.values(userIdByEmail);
  const { error: deleteAuditError } = await supabaseAdmin.from('audit_logs').delete().in('actor_id', actorIds);
  if (deleteAuditError) throw new Error(`Unable to reset audit logs: ${deleteAuditError.message}`);

  const { error: auditError } = await supabaseAdmin.from('audit_logs').insert([
    {
      actor_id: userIdByEmail['admin@educore.demo'],
      action: 'DEMO_BOOTSTRAP',
      metadata: { scope: 'seed' }
    },
    {
      actor_id: teacherId,
      action: 'DEMO_COURSES_ASSIGNED',
      metadata: { courseCodes: COURSE_SEEDS.map((course) => course.code) }
    },
    {
      actor_id: teacherId,
      action: 'DEMO_GRADES_PUBLISHED',
      metadata: { records: grades.length }
    }
  ]);

  if (auditError) throw new Error(`Unable to insert audit logs: ${auditError.message}`);

  console.log('✅ Demo data seeded successfully.');
  console.log('Demo credentials:');
  for (const user of DEMO_USERS) {
    console.log(`- ${user.role}: ${user.email} / ${user.password}`);
  }
}

seed().catch((error) => {
  console.error('❌ Demo seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
