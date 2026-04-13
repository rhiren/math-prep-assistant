import type { MasteryStatus } from "../domain/models";

export function getMasteryStatus(
  percentage: number | null,
  attemptCount: number,
): MasteryStatus {
  if (attemptCount === 0 || percentage === null) {
    return "not_started";
  }

  if (percentage >= 85) {
    return "mastered";
  }

  return "needs_review";
}
