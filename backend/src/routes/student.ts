import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { CourseRepository } from '../repositories/CourseRepository.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { GradeRepository } from '../repositories/GradeRepository.js';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const studentRouter = Router();

const enrollRepo = new EnrollmentRepository();
const courseRepo = new CourseRepository();
const gradeRepo = new GradeRepository();
const attendanceRepo = new AttendanceRepository();
const analyticsService = new AnalyticsService(gradeRepo, attendanceRepo);

studentRouter.use(authMiddleware, requireRole('STUDENT'));

studentRouter.get(
  '/courses',
  asyncHandler(async (req, res) => {
    const enrollments = await enrollRepo.listByStudent(req.currentUser!.id);
    const courseIds = [...new Set(enrollments.map((row) => row.course_id))];
    const courses = await courseRepo.listByIds(courseIds);

    return res.json(courses);
  })
);

studentRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const studentId = req.currentUser!.id;

    const [grades, attendanceSummary, risk, enrollments] = await Promise.all([
      gradeRepo.listByStudent(studentId),
      attendanceRepo.getStudentSummary(studentId),
      analyticsService.getStudentRiskStatus(studentId),
      enrollRepo.listByStudent(studentId)
    ]);

    const present = attendanceSummary?.present_count ?? 0;
    const total = attendanceSummary?.total_count ?? 0;

    return res.json({
      student: {
        id: req.currentUser!.id,
        fullName: req.currentUser!.fullName,
        email: req.currentUser!.email
      },
      stats: {
        gpa: risk.gpa,
        courseCount: enrollments.length,
        attendancePct: risk.attendancePct,
        presentCount: present,
        absentCount: Math.max(total - present, 0),
        riskStatus: risk.isAtRisk ? 'At Risk' : 'Low',
        riskReasons: risk.reasons
      },
      recentGrades: grades.slice(0, 8)
    });
  })
);

studentRouter.get(
  '/attendance/recent',
  asyncHandler(async (req, res) => {
    const rows = await attendanceRepo.listByStudent(req.currentUser!.id, 30);
    const courseIds = [...new Set(rows.map((row) => row.course_id))];
    const courses = await courseRepo.listByIds(courseIds);
    const courseById = new Map(courses.map((course) => [course.id, course]));

    return res.json(
      rows.map((row) => ({
        ...row,
        course_code: courseById.get(row.course_id)?.code ?? 'N/A',
        course_title: courseById.get(row.course_id)?.title ?? 'Unknown Course'
      }))
    );
  })
);
