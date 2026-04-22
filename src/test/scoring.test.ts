import { describe, expect, it } from "vitest";
import { BasicScoringEngine } from "../engines/basicScoringEngine";
import type { TestSession } from "../domain/models";
import { createDefaultContentRepository } from "../services/contentRepository";
import { DEFAULT_STUDENT_ID } from "../services/studentProfileService";

describe("BasicScoringEngine", () => {
  it("scores correct, incorrect, and unanswered responses with normalization", async () => {
    const repository = await createDefaultContentRepository();
    const engine = new BasicScoringEngine(repository);
    const session: TestSession = {
      id: "session-1",
      studentId: DEFAULT_STUDENT_ID,
      mode: "concept",
      courseId: "course-2",
      conceptId: "concept-unit-rates",
      conceptIds: ["concept-unit-rates"],
      questionIds: [
        "concept-unit-rates-core-001",
        "concept-unit-rates-core-002",
        "concept-unit-rates-core-003",
      ],
      answers: {
        "concept-unit-rates-core-001": {
          questionId: "concept-unit-rates-core-001",
          response: "8.0",
          answeredAt: "2026-04-12T12:00:00.000Z",
        },
        "concept-unit-rates-core-002": {
          questionId: "concept-unit-rates-core-002",
          response: "6",
          answeredAt: "2026-04-12T12:00:00.000Z",
        },
        "concept-unit-rates-core-003": {
          questionId: "concept-unit-rates-core-003",
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

  it("marks equivalent numeric formatting as correct", async () => {
    const repository = await createDefaultContentRepository();
    const engine = new BasicScoringEngine(repository);
    const session: TestSession = {
      id: "session-2",
      studentId: DEFAULT_STUDENT_ID,
      mode: "concept",
      courseId: "course-2",
      conceptId: "concept-unit-rates",
      conceptIds: ["concept-unit-rates"],
      questionIds: ["concept-unit-rates-core-017"],
      answers: {
        "concept-unit-rates-core-017": {
          questionId: "concept-unit-rates-core-017",
          response: "6.50",
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
    expect(attempt.results[0]?.feedbackTip).toBeNull();
  });

  it("scores text-valued multiple-choice answers correctly even when authored with numeric answer types", async () => {
    const repository = await createDefaultContentRepository();
    const engine = new BasicScoringEngine(repository);
    const session: TestSession = {
      id: "session-3",
      studentId: DEFAULT_STUDENT_ID,
      mode: "concept",
      courseId: "course-2",
      conceptId: "concept-unit-rates",
      conceptIds: ["concept-unit-rates"],
      questionIds: [
        "concept-unit-rates-core-010",
        "concept-unit-rates-core-021",
        "concept-unit-rates-core-028",
        "concept-unit-rates-core-044",
        "concept-unit-rates-core-045",
        "concept-unit-rates-core-050",
      ],
      answers: {
        "concept-unit-rates-core-010": {
          questionId: "concept-unit-rates-core-010",
          response: "Divide 14 by 7",
          answeredAt: "2026-04-21T04:00:00.000Z",
        },
        "concept-unit-rates-core-021": {
          questionId: "concept-unit-rates-core-021",
          response: "Store B",
          answeredAt: "2026-04-21T04:00:00.000Z",
        },
        "concept-unit-rates-core-028": {
          questionId: "concept-unit-rates-core-028",
          response: "5 pounds in 2 days",
          answeredAt: "2026-04-21T04:00:00.000Z",
        },
        "concept-unit-rates-core-044": {
          questionId: "concept-unit-rates-core-044",
          response: "Divided 16 by 2",
          answeredAt: "2026-04-21T04:00:00.000Z",
        },
        "concept-unit-rates-core-045": {
          questionId: "concept-unit-rates-core-045",
          response: "Store B",
          answeredAt: "2026-04-21T04:00:00.000Z",
        },
        "concept-unit-rates-core-050": {
          questionId: "concept-unit-rates-core-050",
          response: "The scooter is faster",
          answeredAt: "2026-04-21T04:00:00.000Z",
        },
      },
      currentQuestionIndex: 0,
      status: "in_progress",
      createdAt: "2026-04-21T04:00:00.000Z",
      updatedAt: "2026-04-21T04:00:00.000Z",
    };

    const attempt = await engine.scoreSession(session);

    expect(attempt.summary.correctCount).toBe(6);
    expect(attempt.summary.incorrectCount).toBe(0);
    expect(attempt.summary.percentage).toBe(100);
    expect(attempt.results.every((result) => result.isCorrect)).toBe(true);
  });
});
