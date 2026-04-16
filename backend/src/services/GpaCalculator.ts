import type { GradeEntry, GpaStrategy } from '../domain/strategies/GpaStrategy.js';

export class GpaCalculator {
  constructor(private readonly strategy: GpaStrategy) {}

  computeGpa(entries: GradeEntry[]): number {
    return this.strategy.calculate(entries);
  }
}
