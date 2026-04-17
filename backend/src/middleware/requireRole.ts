import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../domain/User.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}
