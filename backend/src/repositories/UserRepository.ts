import { supabaseAdmin } from '../config/supabase.js';
import type { UserProfile, UserRole } from '../domain/User.js';

export class UserRepository {
  async getById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id,email,full_name,role')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role as UserRole
    };
  }

  async listAll(): Promise<UserProfile[]> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id,email,full_name,role')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((entry) => ({
      id: entry.id,
      email: entry.email,
      fullName: entry.full_name,
      role: entry.role as UserRole
    }));
  }

  async listByIds(ids: string[]): Promise<UserProfile[]> {
    if (!ids.length) return [];
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id,email,full_name,role')
      .in('id', ids);

    if (error || !data) return [];

    return data.map((entry) => ({
      id: entry.id,
      email: entry.email,
      fullName: entry.full_name,
      role: entry.role as UserRole
    }));
  }
}
