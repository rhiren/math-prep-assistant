import { describe, expect, it } from "vitest";
import type { CourseManifestDocument, QuestionBankDocument } from "../domain/models";
import {
  buildContentIndex,
  createDefaultContentRepository,
} from "../services/contentRepository";

describe("content repository", () => {
  it("builds O(1) question lookup access for loaded content", async () => {
    const repository = createDefaultContentRepository();
    const question = await repository.getQuestionById("course-2-ratios-001");
    const testConcept = await repository.getConcept("concept-ratios");
    const tutorialConcept = await repository.getConcept("concept-compare-integers");
    const tutorialContent = await repository.getTutorialContent("concept-compare-integers");
    const testSets = await repository.getTestSetsForConcept("concept-ratios");
    const reviewQuestions = await repository.getQuestionsForTestSet("ratios-review");

    expect(question?.prompt).toContain("equivalent to 6:9");
    expect(repository.getQuestionByIdSync("course-2-ratios-001")?.conceptId).toBe(
      "concept-ratios",
    );
    expect(testConcept?.hasTest).toBe(true);
    expect(tutorialConcept?.hasTest).toBe(false);
    expect(testSets.map((testSet) => testSet.id)).toEqual(["ratios-core", "ratios-review"]);
    expect(reviewQuestions).toHaveLength(2);
    expect(tutorialContent).toContain("Practice coming soon");
  });

  it("fails fast when duplicate global question ids are present", () => {
    const manifest: CourseManifestDocument = {
      courses: [
        {
          id: "course-2",
          title: "Course 2",
          description: "desc",
          order: 1,
          units: [
            {
              id: "u1",
              courseId: "course-2",
              title: "Unit",
              description: "desc",
              order: 1,
              concepts: [
                {
                  id: "c1",
                  courseId: "course-2",
                  unitId: "u1",
                  title: "Concept 1",
                  description: "desc",
                  tags: [],
                  order: 1,
                  masteryStatus: "not_started",
                  hasTest: false,
                },
                {
                  id: "c2",
                  courseId: "course-2",
                  unitId: "u1",
                  title: "Concept 2",
                  description: "desc",
                  tags: [],
                  order: 2,
                  masteryStatus: "not_started",
                  hasTest: false,
                },
              ],
            },
          ],
        },
      ],
    };
    const bank: QuestionBankDocument = {
      id: "test-set-1",
      conceptId: "c1",
      title: "Core Practice",
      description: "desc",
      questions: [
        {
          id: "duplicate-id",
          courseId: "course-2",
          unitId: "u1",
          conceptId: "c1",
          tags: [],
          difficulty: "easy",
          questionType: "numeric",
          answerType: "number",
          prompt: "1+1",
          correctAnswer: "2",
          explanation: "desc",
          eligibleForMixed: true,
        },
      ],
    };

    expect(() =>
      buildContentIndex(
        manifest,
        [
          bank,
          {
            ...bank,
            id: "test-set-2",
            conceptId: "c2",
            questions: [{ ...bank.questions[0], conceptId: "c2" }],
          },
        ],
        {},
      ),
    ).toThrow("Duplicate question id detected");
  });
});
