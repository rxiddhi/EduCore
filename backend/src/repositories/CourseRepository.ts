import { supabaseAdmin } from '../config/supabase.js';

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  credits: number;
  teacher_id: string | null;
}

export class CourseRepository {
  async list(): Promise<CourseRecord[]> {
    const { data, error } = await supabaseAdmin.from('courses').select('*').order('code');
    if (error || !data) return [];
    return data;
  }

  async create(payload: Omit<CourseRecord, 'id'>): Promise<CourseRecord | null> {
    const { data, error } = await supabaseAdmin.from('courses').insert(payload).select('*').single();
    if (error || !data) return null;
    return data;
  }

  async listByTeacher(teacherId: string): Promise<CourseRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('code');
    if (error || !data) return [];
    return data;
  }

  async listByIds(ids: string[]): Promise<CourseRecord[]> {
    if (!ids.length) return [];
    const { data, error } = await supabaseAdmin.from('courses').select('*').in('id', ids).order('code');
    if (error || !data) return [];
    return data;
  }

  async getById(id: string): Promise<CourseRecord | null> {
    const { data, error } = await supabaseAdmin.from('courses').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data;
  }
}
