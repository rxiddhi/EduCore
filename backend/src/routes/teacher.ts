import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { CourseRepository } from '../repositories/CourseRepository.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { GradeRepository } from '../repositories/GradeRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const teacherRouter = Router();

const courseRepo = new CourseRepository();
const enrollRepo = new EnrollmentRepository();
const gradeRepo = new GradeRepository();
const attendanceRepo = new AttendanceRepository();
const userRepo = new UserRepository();

teacherRouter.use(authMiddleware, requireRole('TEACHER', 'ADMIN'));

teacherRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const teacherId = req.currentUser!.id;
    const courses = await courseRepo.listByTeacher(teacherId);

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await enrollRepo.countByCourse(course.id);
        const avgGrade = await gradeRepo.averageByCourse(course.id);
        const gradedCount = (await gradeRepo.listByCourse(course.id)).length;

        return {
          ...course,
          students: enrollmentCount,
          average_grade_points: avgGrade,
          average_grade_label: avgGrade == null ? 'N/A' : `${avgGrade.toFixed(2)} / 4.00`,
          pending_tasks: Math.max(enrollmentCount - gradedCount, 0)
        };
      })
    );

    const totalStudents = enriched.reduce((sum, row) => sum + row.students, 0);
    const avgAcrossCourses =
      enriched.filter((row) => row.average_grade_points != null).reduce((sum, row) => sum + Number(row.average_grade_points), 0) /
      Math.max(enriched.filter((row) => row.average_grade_points != null).length, 1);

    return res.json({
      teacher: {
        id: req.currentUser!.id,
        fullName: req.currentUser!.fullName,
        email: req.currentUser!.email
      },
      stats: {
        totalCourses: enriched.length,
        totalStudents,
        averageGradePoints: Number(avgAcrossCourses.toFixed(2))
      },
      courses: enriched
    });
  })
);

teacherRouter.get(
  '/courses/:courseId/roster',
  asyncHandler(async (req, res) => {
    const courseId = z.string().uuid().parse(req.params.courseId);
    const course = await courseRepo.getById(courseId);

    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.currentUser!.role === 'TEACHER' && course.teacher_id !== req.currentUser!.id) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    const enrollments = await enrollRepo.listByCourse(courseId);
    const studentIds = [...new Set(enrollments.map((row) => row.student_id))];
    const students = await userRepo.listByIds(studentIds);

    const grades = await gradeRepo.listByCourse(courseId);
    const gradeByStudent = new Map(grades.map((g) => [g.student_id, g]));

    const roster = students.map((student) => {
      const grade = gradeByStudent.get(student.id);
      return {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        grade_letter: grade?.grade_letter ?? null,
        grade_points: grade ? Number(grade.grade_points) : null
      };
    });

    return res.json({
      course,
      roster
    });
  })
);

teacherRouter.post(
  '/courses/:courseId/attendance',
  asyncHandler(async (req, res) => {
    const courseId = z.string().uuid().parse(req.params.courseId);
    const payload = z
      .object({
        class_date: z.string().min(10),
        records: z
          .array(
            z.object({
              student_id: z.string().uuid(),
              status: z.enum(['PRESENT', 'ABSENT'])
            })
          )
          .min(1)
      })
      .parse(req.body);

    const course = await courseRepo.getById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.currentUser!.role === 'TEACHER' && course.teacher_id !== req.currentUser!.id) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }

    const saved = await attendanceRepo.upsertBatch(
      payload.records.map((record) => ({
        student_id: record.student_id,
        course_id: courseId,
        class_date: payload.class_date,
        session_date: payload.class_date,
        status: record.status,
        recorded_by: req.currentUser!.id
      }))
    );

    return res.json({ saved });
  })
);
