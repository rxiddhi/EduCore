import { supabaseAdmin } from '../config/supabase.js';

export interface EnrollmentRecord {
  id: string;
  student_id: string;
  course_id: string;
  created_at?: string;
}

export class EnrollmentRepository {
  async listByStudent(studentId: string): Promise<EnrollmentRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId);

    if (error || !data) return [];
    return data;
  }

  async create(studentId: string, courseId: string): Promise<EnrollmentRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .insert({ student_id: studentId, course_id: courseId })
      .select('*')
      .single();

    if (error || !data) return null;
    return data;
  }

  async listByCourse(courseId: string): Promise<EnrollmentRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data;
  }

  async countByCourse(courseId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (error) return 0;
    return count ?? 0;
  }
}
