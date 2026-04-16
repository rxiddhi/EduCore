import { AuditRepository } from '../repositories/AuditRepository.js';

export class AuditLogger {
  constructor(private readonly repo: AuditRepository) {}

  async info(actorId: string, action: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.repo.log({ actor_id: actorId, action, metadata });
  }
}
