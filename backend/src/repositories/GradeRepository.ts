import { supabaseAdmin } from '../config/supabase.js';

export interface GradeRecord {
  id: string;
  student_id: string;
  course_id: string;
  grade_letter: string;
  grade_points: number;
  credits: number;
  score: number;
  weighted_score: number;
  assessment_type: string;
  submitted_by: string;
}

export class GradeRepository {
  async listByStudent(studentId: string): Promise<GradeRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('grades')
      .select('*')
      .eq('student_id', studentId);

    if (error || !data) return [];
    return data;
  }

  async upsertGrade(payload: Omit<GradeRecord, 'id'>): Promise<GradeRecord | null> {
    const { data, error } = await supabaseAdmin
      .from('grades')
      .upsert(payload, { onConflict: 'student_id,course_id' })
      .select('*')
      .single();

    if (error || !data) return null;
    return data;
  }

  async listByCourse(courseId: string): Promise<GradeRecord[]> {
    const { data, error } = await supabaseAdmin.from('grades').select('*').eq('course_id', courseId);
    if (error || !data) return [];
    return data;
  }

  async averageByCourse(courseId: string): Promise<number | null> {
    const data = await this.listByCourse(courseId);
    if (!data.length) return null;
    const total = data.reduce((sum, row) => sum + Number(row.grade_points), 0);
    return Number((total / data.length).toFixed(2));
  }
}
