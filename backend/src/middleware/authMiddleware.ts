import type { NextFunction, Request, Response } from 'express';
import { supabaseAnon } from '../config/supabase.js';
import { UserFactory } from '../factories/UserFactory.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { UserService } from '../services/UserService.js';

const userService = new UserService(new UserRepository());

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Missing bearer token' });
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ message: error?.message || 'Invalid or expired session' });
  }

  const domainUser = await userService.getDomainUser(data.user.id);
  if (!domainUser) {
    return res.status(403).json({ message: 'User profile not found' });
  }

  req.currentUser = domainUser;
  req.rawAuthUser = {
    id: data.user.id,
    email: data.user.email,
    role: UserFactory.normalizeRole(data.user.user_metadata?.role)
  };

  return next();
}
