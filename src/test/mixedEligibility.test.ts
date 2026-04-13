import { describe, expect, it } from "vitest";
import { MixedTestEligibilityEngine } from "../engines/mixedTestEligibilityEngine";
import { BasicScoringEngine } from "../engines/basicScoringEngine";
import { DeterministicConceptTestEngine } from "../engines/deterministicConceptTestEngine";
import { StableSelectionStrategy } from "../engines/questionSelectionStrategy";
import { createDefaultContentRepository } from "../services/contentRepository";
import { LocalProgressService } from "../services/progressService";
import { LocalSessionService } from "../services/sessionService";
import { MemoryStorageService } from "../storage/memoryStorageService";
import {
  AttemptRepository,
  ProgressRepository,
  SessionRepository,
} from "../storage/repositories";

describe("MixedTestEligibilityEngine", () => {
  it("unlocks after three completed concepts", async () => {
    const repository = createDefaultContentRepository();
    const store = new MemoryStorageService();
    const sessionRepository = new SessionRepository(store);
    const attemptRepository = new AttemptRepository(store);
    const progressRepository = new ProgressRepository(store);
    const progressService = new LocalProgressService(attemptRepository, progressRepository);
    const sessionService = new LocalSessionService(
      sessionRepository,
      attemptRepository,
      new BasicScoringEngine(repository),
      progressService,
    );
    const generator = new DeterministicConceptTestEngine(
      repository,
      sessionRepository,
      new StableSelectionStrategy(),
    );
    const mixedService = new MixedTestEligibilityEngine(progressService);

    for (const conceptId of [
      "concept-ratios",
      "concept-unit-rate",
      "concept-integer-operations",
    ]) {
      const session = await generator.createConceptSession(conceptId);
      const questions = await repository.getQuestionsForConcept(conceptId);
      for (const question of questions) {
        await sessionService.saveAnswer(session.id, {
          questionId: question.id,
          response: question.correctAnswer,
          answeredAt: "2026-04-12T12:00:00.000Z",
        });
      }
      await sessionService.submitSession(session.id);
    }

    const eligibility = await mixedService.getEligibility("course-2");

    expect(eligibility.unlocked).toBe(true);
    expect(eligibility.conceptIds).toHaveLength(3);
  });
});
