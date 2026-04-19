import { supabaseAdmin } from '../config/supabase.js';

export interface AttendanceSummary {
  student_id: string;
  present_count: number;
  total_count: number;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  class_date: string;
  session_date: string;
  status: 'PRESENT' | 'ABSENT';
  recorded_by: string;
}

export class AttendanceRepository {
  async getStudentSummary(studentId: string): Promise<AttendanceSummary | null> {
    const { data, error } = await supabaseAdmin
      .from('attendance_summary')
      .select('student_id,present_count,total_count')
      .eq('student_id', studentId)
      .single();

    if (error || !data) return null;
    return data;
  }

  async listByStudent(studentId: string, limit = 30): Promise<AttendanceRecord[]> {
    const { data, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('class_date', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as AttendanceRecord[];
  }

  async upsertBatch(
    rows: Array<{
      student_id: string;
      course_id: string;
      class_date: string;
      session_date: string;
      status: 'PRESENT' | 'ABSENT';
      recorded_by: string;
    }>
  ): Promise<number> {
    if (!rows.length) return 0;

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,course_id,class_date' })
      .select('id');

    if (error || !data) return 0;
    return data.length;
  }
}
