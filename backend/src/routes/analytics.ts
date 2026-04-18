import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { GradeRepository } from '../repositories/GradeRepository.js';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analyticsRouter = Router();
const analyticsService = new AnalyticsService(new GradeRepository(), new AttendanceRepository());

analyticsRouter.get(
  '/risk-status',
  authMiddleware,
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const status = await analyticsService.getStudentRiskStatus(req.currentUser!.id);
    return res.json(status);
  })
);
