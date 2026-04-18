import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { GradeRepository } from '../repositories/GradeRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { AuditLogger } from '../services/AuditLogger.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const gradeRouter = Router();
const gradeRepo = new GradeRepository();
const auditLogger = new AuditLogger(new AuditRepository());

gradeRouter.get(
  '/me',
  authMiddleware,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const data = await gradeRepo.listByStudent(req.currentUser!.id);
    return res.json(data);
  })
);

gradeRouter.post(
  '/',
  authMiddleware,
  requireRole('TEACHER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = z
      .object({
        student_id: z.string().uuid(),
        course_id: z.string().uuid(),
        grade_letter: z.string().min(1),
        grade_points: z.number().min(0).max(4),
        credits: z.number().int().min(1).max(6)
      })
      .parse(req.body);

    const saved = await gradeRepo.upsertGrade(payload);

    if (!saved) return res.status(400).json({ message: 'Unable to save grade' });

    await auditLogger.info(req.currentUser!.id, 'GRADE_UPSERTED', {
      studentId: payload.student_id,
      courseId: payload.course_id
    });

    return res.status(201).json(saved);
  })
);
