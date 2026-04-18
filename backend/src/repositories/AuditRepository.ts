import { supabaseAdmin } from '../config/supabase.js';

export interface AuditEvent {
  actor_id: string;
  action: string;
  metadata: Record<string, unknown>;
}

export class AuditRepository {
  async log(event: AuditEvent): Promise<void> {
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: event.actor_id,
      action: event.action,
      metadata: event.metadata
    });
  }

  async list(limit = 100) {
    const { data } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}
