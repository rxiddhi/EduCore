import type { BaseUser } from '../domain/User.js';

declare global {
  namespace Express {
    interface Request {
      currentUser?: BaseUser;
      rawAuthUser?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

export {};
