export interface RiskThresholds {
  minAttendancePct: number;
  minGpa: number;
}

export interface StudentSnapshot {
  studentId: string;
  gpa: number;
  attendancePct: number;
}

export class AcademicRiskAnalyzer {
  constructor(private readonly thresholds: RiskThresholds) {}

  analyze(snapshot: StudentSnapshot): { isAtRisk: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (snapshot.gpa < this.thresholds.minGpa) {
      reasons.push(`GPA below ${this.thresholds.minGpa}`);
    }

    if (snapshot.attendancePct < this.thresholds.minAttendancePct) {
      reasons.push(`Attendance below ${this.thresholds.minAttendancePct}%`);
    }

    return {
      isAtRisk: reasons.length > 0,
      reasons
    };
  }
}
