import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { EnrollmentRepository } from '../repositories/EnrollmentRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const enrollmentRouter = Router();
const enrollmentRepo = new EnrollmentRepository();

enrollmentRouter.get(
  '/me',
  authMiddleware,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const data = await enrollmentRepo.listByStudent(req.currentUser!.id);
    return res.json(data);
  })
);

enrollmentRouter.post(
  '/self-enroll',
  authMiddleware,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const payload = z.object({ course_id: z.string().uuid() }).parse(req.body);
    const created = await enrollmentRepo.create(req.currentUser!.id, payload.course_id);

    if (!created) return res.status(400).json({ message: 'Unable to enroll' });

    return res.status(201).json(created);
  })
);
