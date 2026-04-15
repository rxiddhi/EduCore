export interface GradeEntry {
  points: number;
  credits: number;
}

export interface GpaStrategy {
  calculate(entries: GradeEntry[]): number;
}

export class WeightedGpaStrategy implements GpaStrategy {
  calculate(entries: GradeEntry[]): number {
    const totalCredits = entries.reduce((sum, item) => sum + item.credits, 0);
    if (!totalCredits) return 0;

    const weighted = entries.reduce((sum, item) => sum + item.points * item.credits, 0);
    return Number((weighted / totalCredits).toFixed(2));
  }
}
