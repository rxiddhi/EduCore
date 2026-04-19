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
    email: 'teacher2@educore.demo',
    password: 'Demo@1234',
    full_name: 'Prof. Arjun Mehta',
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
  },
  {
    email: 'student4@educore.demo',
    password: 'Demo@1234',
    full_name: 'Karan Gupta',
    role: 'STUDENT'
  },
  {
    email: 'student5@educore.demo',
    password: 'Demo@1234',
    full_name: 'Ananya Iyer',
    role: 'STUDENT'
  },
  {
    email: 'student6@educore.demo',
    password: 'Demo@1234',
    full_name: 'Rohan Desai',
    role: 'STUDENT'
  },
  {
    email: 'student7@educore.demo',
    password: 'Demo@1234',
    full_name: 'Priya Nair',
    role: 'STUDENT'
  }
];

const COURSE_SEEDS: CourseSeed[] = [
  { code: 'DEMO-CS101', title: 'Introduction to Programming', credits: 3 },
  { code: 'DEMO-MTH210', title: 'Applied Statistics', credits: 4 },
  { code: 'DEMO-WEB330', title: 'Full Stack Development', credits: 3 },
  { code: 'DEMO-AI420', title: 'Artificial Intelligence', credits: 4 },
  { code: 'DEMO-DB250', title: 'Database Systems', credits: 3 },
  { code: 'DEMO-SE310', title: 'Software Engineering', credits: 3 }
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
  recordedBy: string,
  presentCount: number,
  dayOffsets: number[]
): Array<{
  student_id: string;
  course_id: string;
  class_date: string;
  session_date: string;
  status: 'PRESENT' | 'ABSENT';
  recorded_by: string;
}> {
  return dayOffsets.map((offset, idx) => ({
    student_id: studentId,
    course_id: courseId,
    class_date: isoDateDaysAgo(offset),
    session_date: isoDateDaysAgo(offset),
    status: idx < presentCount ? 'PRESENT' : 'ABSENT',
    recorded_by: recordedBy
  }));
}

async function seed() {
  console.log('🌱 Seeding EduCore demo data...');

  // ═══════════════════════════════════════════
  // 1. Auth users
  // ═══════════════════════════════════════════
  const userIdByEmail: Record<string, string> = {};

  for (const demoUser of DEMO_USERS) {
    const userId = await ensureAuthUser(demoUser);
    userIdByEmail[demoUser.email] = userId;
  }

  // ═══════════════════════════════════════════
  // 2. Profiles table (standard schema.sql)
  // ═══════════════════════════════════════════
  const profilesPayload = DEMO_USERS.map((user) => ({
    id: userIdByEmail[user.email],
    email: user.email,
    full_name: user.full_name,
    role: user.role
  }));

  const { error: profilesError } = await supabaseAdmin.from('profiles').upsert(profilesPayload);
  if (profilesError) throw new Error(`Unable to upsert profiles: ${profilesError.message}`);

  // ═══════════════════════════════════════════
  // 3. Users table (live DB extra — teachers/students FK here)
  // Columns: id, email, password_hash, first_name, last_name, role, is_active
  // ═══════════════════════════════════════════
  const usersPayload = DEMO_USERS.map((user) => {
    const nameParts = user.full_name.split(' ');
    return {
      id: userIdByEmail[user.email],
      email: user.email,
      password_hash: 'supabase_managed_auth',
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' ') || 'User',
      role: user.role,
      is_active: true
    };
  });

  const { error: usersError } = await supabaseAdmin.from('users').upsert(usersPayload);
  if (usersError) throw new Error(`Unable to upsert users: ${usersError.message}`);
  console.log('  ✓ Users & profiles synced');

  // ═══════════════════════════════════════════
  // 4. Teachers table (live DB — courses.teacher_id FK → teachers.id)
  // Columns: id, user_id, employee_code, department, specialization
  // ═══════════════════════════════════════════
  const teacher1Id = userIdByEmail['teacher@educore.demo'];
  const teacher2Id = userIdByEmail['teacher2@educore.demo'];

  const { error: teachersError } = await supabaseAdmin.from('teachers').upsert([
    {
      id: teacher1Id,
      user_id: teacher1Id,
      employee_code: 'DEMO-T-001',
      department: 'Computer Science',
      specialization: 'Software Engineering'
    },
    {
      id: teacher2Id,
      user_id: teacher2Id,
      employee_code: 'DEMO-T-002',
      department: 'Information Technology',
      specialization: 'Database Administration'
    }
  ]);
  if (teachersError) throw new Error(`Unable to upsert teachers: ${teachersError.message}`);
  console.log('  ✓ Teachers table updated');

  // ═══════════════════════════════════════════
  // 5. Students table (live DB — enrollments/grades/attendance.student_id FK → students.id)
  // Columns: id, user_id, student_code, programme, year_of_study
  // ═══════════════════════════════════════════
  const studentUsers = DEMO_USERS.filter((u) => u.role === 'STUDENT');
  const studentsPayload = studentUsers.map((user, idx) => ({
    id: userIdByEmail[user.email],
    user_id: userIdByEmail[user.email],
    student_code: `DEMO-S-${String(idx + 1).padStart(3, '0')}`,
    programme: 'B.Tech Computer Science',
    year_of_study: (idx % 4) + 1
  }));

  const { error: studentsError } = await supabaseAdmin.from('students').upsert(studentsPayload);
  if (studentsError) throw new Error(`Unable to upsert students: ${studentsError.message}`);
  console.log('  ✓ Students table updated');

  // ═══════════════════════════════════════════
  // 6. Courses
  // Live DB columns: code, course_code, name, title, credits, credit_hours,
  //                  semester, description, is_active, teacher_id
  // ═══════════════════════════════════════════
  const courseTeacherMap: Record<string, string> = {
    'DEMO-CS101': teacher1Id,
    'DEMO-MTH210': teacher1Id,
    'DEMO-WEB330': teacher1Id,
    'DEMO-AI420': teacher1Id,
    'DEMO-DB250': teacher2Id,
    'DEMO-SE310': teacher2Id
  };

  const { data: courses, error: coursesError } = await supabaseAdmin
    .from('courses')
    .upsert(
      COURSE_SEEDS.map((course) => ({
        code: course.code,
        course_code: course.code,
        name: course.title,
        title: course.title,
        credits: course.credits,
        credit_hours: course.credits,
        semester: 'Spring 2026',
        description: `${course.title} — a comprehensive academic module.`,
        is_active: true,
        teacher_id: courseTeacherMap[course.code]
      })),
      { onConflict: 'code' }
    )
    .select('id,code,title,credits,teacher_id');

  if (coursesError || !courses?.length) {
    throw new Error(`Unable to upsert courses: ${coursesError?.message ?? 'No courses returned'}`);
  }

  const courseIdByCode = new Map(courses.map((course) => [course.code, course.id]));
  const courseIds = [...courseIdByCode.values()];
  console.log(`  ✓ ${courses.length} courses upserted`);

  // ═══════════════════════════════════════════
  // 7. Clean previous demo data
  // ═══════════════════════════════════════════
  const { error: deleteAttendanceError } = await supabaseAdmin.from('attendance').delete().in('course_id', courseIds);
  if (deleteAttendanceError) throw new Error(`Unable to reset attendance: ${deleteAttendanceError.message}`);

  const { error: deleteGradesError } = await supabaseAdmin.from('grades').delete().in('course_id', courseIds);
  if (deleteGradesError) throw new Error(`Unable to reset grades: ${deleteGradesError.message}`);

  const { error: deleteEnrollmentsError } = await supabaseAdmin.from('enrollments').delete().in('course_id', courseIds);
  if (deleteEnrollmentsError) throw new Error(`Unable to reset enrollments: ${deleteEnrollmentsError.message}`);
  console.log('  ✓ Previous demo data cleaned');

  // ═══════════════════════════════════════════
  // 8. Enrollments
  // ═══════════════════════════════════════════
  const s1 = userIdByEmail['student1@educore.demo'];
  const s2 = userIdByEmail['student2@educore.demo'];
  const s3 = userIdByEmail['student3@educore.demo'];
  const s4 = userIdByEmail['student4@educore.demo'];
  const s5 = userIdByEmail['student5@educore.demo'];
  const s6 = userIdByEmail['student6@educore.demo'];
  const s7 = userIdByEmail['student7@educore.demo'];

  const cs101 = courseIdByCode.get('DEMO-CS101')!;
  const mth210 = courseIdByCode.get('DEMO-MTH210')!;
  const web330 = courseIdByCode.get('DEMO-WEB330')!;
  const ai420 = courseIdByCode.get('DEMO-AI420')!;
  const db250 = courseIdByCode.get('DEMO-DB250')!;
  const se310 = courseIdByCode.get('DEMO-SE310')!;

  const enrollments = [
    // CS101 — 6 students
    { student_id: s1, course_id: cs101 },
    { student_id: s2, course_id: cs101 },
    { student_id: s3, course_id: cs101 },
    { student_id: s4, course_id: cs101 },
    { student_id: s5, course_id: cs101 },
    { student_id: s6, course_id: cs101 },
    // MTH210 — 5 students
    { student_id: s1, course_id: mth210 },
    { student_id: s2, course_id: mth210 },
    { student_id: s3, course_id: mth210 },
    { student_id: s5, course_id: mth210 },
    { student_id: s7, course_id: mth210 },
    // WEB330 — 5 students
    { student_id: s1, course_id: web330 },
    { student_id: s3, course_id: web330 },
    { student_id: s4, course_id: web330 },
    { student_id: s6, course_id: web330 },
    { student_id: s7, course_id: web330 },
    // AI420 — 4 students
    { student_id: s2, course_id: ai420 },
    { student_id: s4, course_id: ai420 },
    { student_id: s5, course_id: ai420 },
    { student_id: s7, course_id: ai420 },
    // DB250 — 5 students
    { student_id: s1, course_id: db250 },
    { student_id: s2, course_id: db250 },
    { student_id: s3, course_id: db250 },
    { student_id: s6, course_id: db250 },
    { student_id: s7, course_id: db250 },
    // SE310 — 4 students
    { student_id: s1, course_id: se310 },
    { student_id: s4, course_id: se310 },
    { student_id: s5, course_id: se310 },
    { student_id: s6, course_id: se310 }
  ];

  const { error: enrollmentsError } = await supabaseAdmin.from('enrollments').insert(enrollments);
  if (enrollmentsError) throw new Error(`Unable to insert enrollments: ${enrollmentsError.message}`);
  console.log(`  ✓ ${enrollments.length} enrollments created`);

  // ═══════════════════════════════════════════
  // 9. Grades
  // Live DB extra columns: score, weighted_score, assessment_type (enum), submitted_by
  // assessment_type enum: QUIZ, ASSIGNMENT, MIDTERM, FINAL, PROJECT
  // ═══════════════════════════════════════════
  type GradeRow = {
    student_id: string;
    course_id: string;
    grade_letter: string;
    grade_points: number;
    credits: number;
    score: number;
    weighted_score: number;
    assessment_type: string;
    submitted_by: string;
  };

  function gradeRow(
    studentId: string,
    courseId: string,
    letter: string,
    points: number,
    credits: number,
    score: number,
    teacherId: string,
    assessmentType: string = 'FINAL'
  ): GradeRow {
    return {
      student_id: studentId,
      course_id: courseId,
      grade_letter: letter,
      grade_points: points,
      credits,
      score,
      weighted_score: score,
      assessment_type: assessmentType,
      submitted_by: teacherId
    };
  }

  const grades: GradeRow[] = [
    // CS101 (teacher1) — s6 not graded yet
    gradeRow(s1, cs101, 'A',  4.0, 3, 95, teacher1Id),
    gradeRow(s2, cs101, 'B+', 3.3, 3, 85, teacher1Id),
    gradeRow(s3, cs101, 'A-', 3.7, 3, 90, teacher1Id),
    gradeRow(s4, cs101, 'B',  3.0, 3, 80, teacher1Id),
    gradeRow(s5, cs101, 'A',  4.0, 3, 96, teacher1Id),
    // MTH210 (teacher1)
    gradeRow(s1, mth210, 'B',  3.0, 4, 82, teacher1Id, 'MIDTERM'),
    gradeRow(s2, mth210, 'C+', 2.3, 4, 72, teacher1Id, 'MIDTERM'),
    gradeRow(s3, mth210, 'A-', 3.7, 4, 91, teacher1Id, 'MIDTERM'),
    gradeRow(s5, mth210, 'B-', 2.7, 4, 77, teacher1Id, 'MIDTERM'),
    gradeRow(s7, mth210, 'C',  2.0, 4, 65, teacher1Id, 'MIDTERM'),
    // WEB330 (teacher1) — s7 not graded yet
    gradeRow(s1, web330, 'A-', 3.7, 3, 89, teacher1Id, 'PROJECT'),
    gradeRow(s3, web330, 'A',  4.0, 3, 97, teacher1Id, 'PROJECT'),
    gradeRow(s4, web330, 'B+', 3.3, 3, 86, teacher1Id, 'PROJECT'),
    gradeRow(s6, web330, 'B',  3.0, 3, 81, teacher1Id, 'PROJECT'),
    // AI420 (teacher1) — s7 not graded yet
    gradeRow(s2, ai420, 'A',  4.0, 4, 94, teacher1Id),
    gradeRow(s4, ai420, 'B-', 2.7, 4, 76, teacher1Id),
    gradeRow(s5, ai420, 'A-', 3.7, 4, 92, teacher1Id),
    // DB250 (teacher2)
    gradeRow(s1, db250, 'A',  4.0, 3, 98, teacher2Id, 'ASSIGNMENT'),
    gradeRow(s2, db250, 'B+', 3.3, 3, 87, teacher2Id, 'ASSIGNMENT'),
    gradeRow(s3, db250, 'B',  3.0, 3, 83, teacher2Id, 'ASSIGNMENT'),
    gradeRow(s6, db250, 'C+', 2.3, 3, 71, teacher2Id, 'ASSIGNMENT'),
    gradeRow(s7, db250, 'A-', 3.7, 3, 88, teacher2Id, 'ASSIGNMENT'),
    // SE310 (teacher2) — s6 not graded yet
    gradeRow(s1, se310, 'B+', 3.3, 3, 84, teacher2Id, 'QUIZ'),
    gradeRow(s4, se310, 'A',  4.0, 3, 93, teacher2Id, 'QUIZ'),
    gradeRow(s5, se310, 'B',  3.0, 3, 79, teacher2Id, 'QUIZ')
  ];

  const { error: gradesError } = await supabaseAdmin.from('grades').insert(grades);
  if (gradesError) throw new Error(`Unable to insert grades: ${gradesError.message}`);
  console.log(`  ✓ ${grades.length} grades created`);

  // ═══════════════════════════════════════════
  // 10. Attendance
  // Live DB extra columns: session_date, recorded_by
  // ═══════════════════════════════════════════
  const dayOffsets = [2, 5, 9, 12, 16, 19, 23, 26, 30, 33];

  const attendanceRows = [
    // CS101 (teacher1)
    ...buildAttendanceSeries(s1, cs101, teacher1Id, 9, dayOffsets),
    ...buildAttendanceSeries(s2, cs101, teacher1Id, 7, dayOffsets),
    ...buildAttendanceSeries(s3, cs101, teacher1Id, 8, dayOffsets),
    ...buildAttendanceSeries(s4, cs101, teacher1Id, 6, dayOffsets),
    ...buildAttendanceSeries(s5, cs101, teacher1Id, 10, dayOffsets),
    ...buildAttendanceSeries(s6, cs101, teacher1Id, 5, dayOffsets),
    // MTH210 (teacher1)
    ...buildAttendanceSeries(s1, mth210, teacher1Id, 8, dayOffsets),
    ...buildAttendanceSeries(s2, mth210, teacher1Id, 6, dayOffsets),
    ...buildAttendanceSeries(s3, mth210, teacher1Id, 9, dayOffsets),
    ...buildAttendanceSeries(s5, mth210, teacher1Id, 7, dayOffsets),
    ...buildAttendanceSeries(s7, mth210, teacher1Id, 5, dayOffsets),
    // WEB330 (teacher1)
    ...buildAttendanceSeries(s1, web330, teacher1Id, 9, dayOffsets),
    ...buildAttendanceSeries(s3, web330, teacher1Id, 10, dayOffsets),
    ...buildAttendanceSeries(s4, web330, teacher1Id, 7, dayOffsets),
    ...buildAttendanceSeries(s6, web330, teacher1Id, 8, dayOffsets),
    ...buildAttendanceSeries(s7, web330, teacher1Id, 6, dayOffsets),
    // AI420 (teacher1)
    ...buildAttendanceSeries(s2, ai420, teacher1Id, 8, dayOffsets),
    ...buildAttendanceSeries(s4, ai420, teacher1Id, 9, dayOffsets),
    ...buildAttendanceSeries(s5, ai420, teacher1Id, 7, dayOffsets),
    ...buildAttendanceSeries(s7, ai420, teacher1Id, 6, dayOffsets),
    // DB250 (teacher2)
    ...buildAttendanceSeries(s1, db250, teacher2Id, 10, dayOffsets),
    ...buildAttendanceSeries(s2, db250, teacher2Id, 8, dayOffsets),
    ...buildAttendanceSeries(s3, db250, teacher2Id, 7, dayOffsets),
    ...buildAttendanceSeries(s6, db250, teacher2Id, 9, dayOffsets),
    ...buildAttendanceSeries(s7, db250, teacher2Id, 6, dayOffsets),
    // SE310 (teacher2)
    ...buildAttendanceSeries(s1, se310, teacher2Id, 8, dayOffsets),
    ...buildAttendanceSeries(s4, se310, teacher2Id, 9, dayOffsets),
    ...buildAttendanceSeries(s5, se310, teacher2Id, 7, dayOffsets),
    ...buildAttendanceSeries(s6, se310, teacher2Id, 10, dayOffsets)
  ];

  const { error: attendanceError } = await supabaseAdmin.from('attendance').insert(attendanceRows);
  if (attendanceError) throw new Error(`Unable to insert attendance: ${attendanceError.message}`);
  console.log(`  ✓ ${attendanceRows.length} attendance records created`);

  // ═══════════════════════════════════════════
  // 11. Audit Logs
  // Live DB: action is an enum (CREATE, UPDATE, DELETE), requires entity_type, no metadata
  // ═══════════════════════════════════════════
  const actorIds = Object.values(userIdByEmail);
  const { error: deleteAuditError } = await supabaseAdmin.from('audit_logs').delete().in('actor_id', actorIds);
  if (deleteAuditError) console.log(`  ⚠ Could not clean audit logs: ${deleteAuditError.message}`);

  const { error: auditError } = await supabaseAdmin.from('audit_logs').insert([
    {
      actor_id: userIdByEmail['admin@educore.demo'],
      action: 'CREATE',
      entity_type: 'system',
      entity_id: userIdByEmail['admin@educore.demo']
    },
    {
      actor_id: teacher1Id,
      action: 'CREATE',
      entity_type: 'course',
      entity_id: cs101
    },
    {
      actor_id: teacher2Id,
      action: 'CREATE',
      entity_type: 'course',
      entity_id: db250
    },
    {
      actor_id: teacher1Id,
      action: 'UPDATE',
      entity_type: 'grade',
      entity_id: cs101
    }
  ]);

  if (auditError) {
    // Non-fatal — audit logs may have extra constraints
    console.log(`  ⚠ Audit logs skipped: ${auditError.message}`);
  } else {
    console.log('  ✓ Audit logs created');
  }

  console.log('\n✅ Demo data seeded successfully.');
  console.log('Demo credentials (all passwords: Demo@1234):');
  for (const user of DEMO_USERS) {
    console.log(`  ${user.role.padEnd(8)} ${user.email}`);
  }
}

seed().catch((error) => {
  console.error('❌ Demo seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
