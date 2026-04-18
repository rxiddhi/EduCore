import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { UserService } from '../services/UserService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const userRouter = Router();
const userService = new UserService(new UserRepository());

userRouter.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    return res.json({
      id: req.currentUser?.id,
      fullName: req.currentUser?.fullName,
      email: req.currentUser?.email,
      role: req.currentUser?.role
    });
  })
);

userRouter.get(
  '/',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const users = await userService.listUsers();
    return res.json(users);
  })
);
