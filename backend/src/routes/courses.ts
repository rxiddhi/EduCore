import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { CourseRepository } from '../repositories/CourseRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { AuditLogger } from '../services/AuditLogger.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const courseRouter = Router();
const courseRepo = new CourseRepository();
const auditLogger = new AuditLogger(new AuditRepository());

courseRouter.get(
  '/',
  authMiddleware,
  asyncHandler(async (_req, res) => {
    const courses = await courseRepo.list();
    return res.json(courses);
  })
);

courseRouter.post(
  '/',
  authMiddleware,
  requireRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = z
      .object({
        code: z.string().min(2),
        title: z.string().min(2),
        credits: z.number().int().min(1).max(6),
        teacher_id: z.string().uuid().nullable().optional()
      })
      .parse(req.body);

    const teacherId =
      req.currentUser!.role === 'TEACHER' ? req.currentUser!.id : payload.teacher_id ?? null;

    const course = await courseRepo.create({
      code: payload.code,
      title: payload.title,
      credits: payload.credits,
      teacher_id: teacherId
    });

    if (!course) return res.status(400).json({ message: 'Unable to create course' });

    await auditLogger.info(req.currentUser!.id, 'COURSE_CREATED', { courseId: course.id });

    return res.status(201).json(course);
  })
);
