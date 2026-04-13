import type { MixedTestService, ProgressService } from "../services/contracts";

export class MixedTestEligibilityEngine implements MixedTestService {
  constructor(private readonly progressService: ProgressService) {}

  async getEligibility(
    courseId: string,
  ): Promise<{ unlocked: boolean; conceptIds: string[] }> {
    const progress = await this.progressService.getProgress();
    const completedConcepts = progress
      .filter((record) => record.courseId === courseId && record.attemptCount > 0)
      .sort((left, right) => {
        const leftValue = left.lastAttemptedAt ?? "";
        const rightValue = right.lastAttemptedAt ?? "";
        return rightValue.localeCompare(leftValue);
      })
      .map((record) => record.conceptId);

    return {
      unlocked: completedConcepts.length >= 3,
      conceptIds: completedConcepts.slice(0, 3),
    };
  }
}
