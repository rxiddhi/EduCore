export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export abstract class BaseUser {
  protected readonly profile: UserProfile;

  constructor(profile: UserProfile) {
    this.profile = profile;
  }

  get id(): string {
    return this.profile.id;
  }

  get email(): string {
    return this.profile.email;
  }

  get fullName(): string {
    return this.profile.fullName;
  }

  get role(): UserRole {
    return this.profile.role;
  }

  abstract canAccess(resource: string): boolean;
}

export class StudentUser extends BaseUser {
  canAccess(resource: string): boolean {
    return ['self', 'courses', 'grades', 'attendance', 'risk'].includes(resource);
  }
}

export class TeacherUser extends BaseUser {
  canAccess(resource: string): boolean {
    return ['self', 'courses', 'grades', 'attendance'].includes(resource);
  }
}

export class AdminUser extends BaseUser {
  canAccess(): boolean {
    return true;
  }
}
