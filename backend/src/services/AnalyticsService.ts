import { WeightedGpaStrategy } from '../domain/strategies/GpaStrategy.js';
import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { GradeRepository } from '../repositories/GradeRepository.js';
import { AcademicRiskAnalyzer } from './AcademicRiskAnalyzer.js';
import { GpaCalculator } from './GpaCalculator.js';

export class AnalyticsService {
  private readonly gpaCalculator = new GpaCalculator(new WeightedGpaStrategy());
  private readonly riskAnalyzer = new AcademicRiskAnalyzer({ minAttendancePct: 75, minGpa: 2.0 });

  constructor(
    private readonly gradeRepository: GradeRepository,
    private readonly attendanceRepository: AttendanceRepository
  ) {}

  async getStudentRiskStatus(studentId: string) {
    const grades = await this.gradeRepository.listByStudent(studentId);
    const attendance = await this.attendanceRepository.getStudentSummary(studentId);

    const gpa = this.gpaCalculator.computeGpa(
      grades.map((grade) => ({ points: grade.grade_points, credits: grade.credits }))
    );

    const attendancePct = attendance
      ? Number(((attendance.present_count / Math.max(attendance.total_count, 1)) * 100).toFixed(2))
      : 0;

    const risk = this.riskAnalyzer.analyze({ studentId, gpa, attendancePct });

    return {
      studentId,
      gpa,
      attendancePct,
      ...risk
    };
  }
}
