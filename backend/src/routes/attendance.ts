import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const attendanceRouter = Router();
const attendanceRepo = new AttendanceRepository();

attendanceRouter.get(
  '/me',
  authMiddleware,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const summary = await attendanceRepo.getStudentSummary(req.currentUser!.id);

    if (!summary) {
      return res.json({ student_id: req.currentUser!.id, present_count: 0, total_count: 0 });
    }

    return res.json(summary);
  })
);
