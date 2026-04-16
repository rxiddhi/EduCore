import { UserFactory } from '../factories/UserFactory.js';
import { UserRepository } from '../repositories/UserRepository.js';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getDomainUser(userId: string) {
    const profile = await this.userRepository.getById(userId);
    if (!profile) return null;
    return UserFactory.createFromProfile(profile);
  }

  async listUsers() {
    return this.userRepository.listAll();
  }
}
