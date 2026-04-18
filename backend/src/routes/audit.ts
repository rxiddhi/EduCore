import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const auditRouter = Router();
const repo = new AuditRepository();

auditRouter.get(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const logs = await repo.list(200);
    return res.json(logs);
  })
);
