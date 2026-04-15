import { AdminUser, BaseUser, StudentUser, TeacherUser, type UserProfile, type UserRole } from '../domain/User.js';

export class UserFactory {
  static createFromProfile(profile: UserProfile): BaseUser {
    switch (profile.role) {
      case 'STUDENT':
        return new StudentUser(profile);
      case 'TEACHER':
        return new TeacherUser(profile);
      case 'ADMIN':
        return new AdminUser(profile);
      default:
        throw new Error(`Unsupported role: ${(profile as UserProfile).role}`);
    }
  }

  static normalizeRole(role?: string): UserRole {
    const normalized = (role ?? 'STUDENT').toUpperCase();
    if (normalized === 'STUDENT' || normalized === 'TEACHER' || normalized === 'ADMIN') {
      return normalized;
    }
    return 'STUDENT';
  }
}
