import { describe, expect, it } from "vitest";
import { BasicScoringEngine } from "../engines/basicScoringEngine";
import type { TestSession } from "../domain/models";
import { createDefaultContentRepository } from "../services/contentRepository";

describe("BasicScoringEngine", () => {
  it("scores correct, incorrect, and unanswered responses with normalization", async () => {
    const repository = createDefaultContentRepository();
    const engine = new BasicScoringEngine(repository);
    const session: TestSession = {
      id: "session-1",
      mode: "concept",
      courseId: "course-2",
      conceptId: "concept-unit-rate",
      conceptIds: ["concept-unit-rate"],
      questionIds: [
        "course-2-unit-rate-001",
        "course-2-unit-rate-002",
        "course-2-unit-rate-003",
      ],
      answers: {
        "course-2-unit-rate-001": {
          questionId: "course-2-unit-rate-001",
          response: "60.0",
          answeredAt: "2026-04-12T12:00:00.000Z",
        },
        "course-2-unit-rate-002": {
          questionId: "course-2-unit-rate-002",
          response: "2",
          answeredAt: "2026-04-12T12:00:00.000Z",
        },
        "course-2-unit-rate-003": {
          questionId: "course-2-unit-rate-003",
          response: "   ",
          answeredAt: "2026-04-12T12:00:00.000Z",
        },
      },
      currentQuestionIndex: 0,
      status: "in_progress",
      createdAt: "2026-04-12T12:00:00.000Z",
      updatedAt: "2026-04-12T12:00:00.000Z",
    };

    const attempt = await engine.scoreSession(session);

    expect(attempt.summary.correctCount).toBe(1);
    expect(attempt.summary.incorrectCount).toBe(1);
    expect(attempt.summary.unansweredCount).toBe(1);
    expect(attempt.summary.percentage).toBe(33);
  });

  it("marks ratio-equivalent notation as correct and adds a feedback tip", async () => {
    const repository = createDefaultContentRepository();
    const engine = new BasicScoringEngine(repository);
    const session: TestSession = {
      id: "session-2",
      mode: "concept",
      courseId: "course-2",
      conceptId: "concept-ratios",
      conceptIds: ["concept-ratios"],
      questionIds: ["course-2-ratios-002"],
      answers: {
        "course-2-ratios-002": {
          questionId: "course-2-ratios-002",
          response: "2/3",
          answeredAt: "2026-04-12T12:00:00.000Z",
        },
      },
      currentQuestionIndex: 0,
      status: "in_progress",
      createdAt: "2026-04-12T12:00:00.000Z",
      updatedAt: "2026-04-12T12:00:00.000Z",
    };

    const attempt = await engine.scoreSession(session);

    expect(attempt.summary.correctCount).toBe(1);
    expect(attempt.results[0]?.feedbackTip).toContain('":"');
  });
});
