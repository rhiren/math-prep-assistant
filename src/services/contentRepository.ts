import type {
  Concept,
  ContentIndex,
  Course,
  CourseManifestDocument,
  Question,
  QuestionBankDocument,
  TestSet,
} from "../domain/models";
import type { ContentRepository } from "./contracts";

const manifestModules = import.meta.glob("../../content/manifest/*.json", {
  eager: true,
  import: "default",
}) as Record<string, CourseManifestDocument>;

const testSetModules = import.meta.glob("../../content/test-sets/*.json", {
  eager: true,
  import: "default",
}) as Record<string, QuestionBankDocument>;

const tutorialModules = import.meta.glob("../../content/tutorials/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export function buildContentIndex(
  manifest: CourseManifestDocument,
  questionBanks: QuestionBankDocument[],
  tutorialsByConceptId: Record<string, string>,
): ContentIndex {
  const coursesById: Record<string, Course> = {};
  const conceptsById: Record<string, Concept> = {};
  const questionsById: Record<string, Question> = {};
  const conceptQuestionIds: Record<string, string[]> = {};
  const testSetsById: Record<string, TestSet> = {};
  const testSetsByConceptId: Record<string, TestSet[]> = {};
  const testSetQuestionIds: Record<string, string[]> = {};

  const courses = manifest.courses.map((course) => {
    const units = course.units.map((unit) => {
      const concepts = unit.concepts.map((concept) => {
        const conceptTestSets = questionBanks.filter((bank) => bank.conceptId === concept.id);
        const clonedConcept: Concept = {
          ...concept,
          hasTest: conceptTestSets.length > 0,
        };
        conceptsById[clonedConcept.id] = clonedConcept;
        conceptQuestionIds[clonedConcept.id] = [];
        testSetsByConceptId[clonedConcept.id] = [];
        return clonedConcept;
      });

      return {
        ...unit,
        concepts,
      };
    });

    const clonedCourse: Course = {
      ...course,
      units,
    };
    coursesById[clonedCourse.id] = clonedCourse;
    return clonedCourse;
  });

  for (const bank of questionBanks) {
    if (!conceptsById[bank.conceptId]) {
      throw new Error(`Question bank references unknown concept ${bank.conceptId}.`);
    }

    if (testSetsById[bank.id]) {
      throw new Error(`Duplicate test set id detected: ${bank.id}`);
    }

    const testSet: TestSet = {
      id: bank.id,
      conceptId: bank.conceptId,
      title: bank.title,
      description: bank.description,
      questionCount: bank.questions.length,
    };
    testSetsById[testSet.id] = testSet;
    testSetsByConceptId[bank.conceptId].push(testSet);
    testSetQuestionIds[testSet.id] = [];

    for (const question of bank.questions) {
      if (questionsById[question.id]) {
        throw new Error(`Duplicate question id detected: ${question.id}`);
      }

      questionsById[question.id] = question;
      conceptQuestionIds[bank.conceptId].push(question.id);
      testSetQuestionIds[testSet.id].push(question.id);
    }
  }

  for (const testSets of Object.values(testSetsByConceptId)) {
    testSets.sort(
      (left, right) =>
        left.title.localeCompare(right.title) || left.id.localeCompare(right.id),
    );
  }

  return {
    courses,
    coursesById,
    conceptsById,
    questionsById,
    conceptQuestionIds,
    testSetsById,
    testSetsByConceptId,
    testSetQuestionIds,
    tutorialsByConceptId,
  };
}

export class StaticContentRepository implements ContentRepository {
  private readonly index: ContentIndex;

  constructor(
    manifest: CourseManifestDocument,
    questionBanks: QuestionBankDocument[],
    tutorialsByConceptId: Record<string, string>,
  ) {
    this.index = buildContentIndex(manifest, questionBanks, tutorialsByConceptId);
  }

  async listCourses(): Promise<Course[]> {
    return this.index.courses;
  }

  async getCourse(courseId: string): Promise<Course | null> {
    return this.index.coursesById[courseId] ?? null;
  }

  async getConcept(conceptId: string): Promise<Concept | null> {
    return this.index.conceptsById[conceptId] ?? null;
  }

  async getQuestionsForConcept(conceptId: string): Promise<Question[]> {
    const testSets = await this.getTestSetsForConcept(conceptId);
    const firstTestSet = testSets[0];
    if (!firstTestSet) {
      return [];
    }

    return this.getQuestionsForTestSet(firstTestSet.id);
  }

  async getQuestionById(questionId: string): Promise<Question | null> {
    return this.getQuestionByIdSync(questionId);
  }

  getQuestionByIdSync(questionId: string): Question | null {
    return this.index.questionsById[questionId] ?? null;
  }

  async getCourseConcepts(courseId: string): Promise<Concept[]> {
    const course = await this.getCourse(courseId);
    if (!course) {
      return [];
    }

    return course.units.flatMap((unit) => unit.concepts);
  }

  async getTutorialContent(conceptId: string): Promise<string | null> {
    return this.index.tutorialsByConceptId[conceptId] ?? null;
  }

  async getTestSetsForConcept(conceptId: string): Promise<TestSet[]> {
    return this.index.testSetsByConceptId[conceptId] ?? [];
  }

  async getTestSet(testSetId: string): Promise<TestSet | null> {
    return this.index.testSetsById[testSetId] ?? null;
  }

  async getQuestionsForTestSet(testSetId: string): Promise<Question[]> {
    return (this.index.testSetQuestionIds[testSetId] ?? []).map(
      (questionId) => this.index.questionsById[questionId],
    );
  }
}

export function createDefaultContentRepository(): StaticContentRepository {
  const manifests = Object.entries(manifestModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([, manifest]) => manifest);

  if (manifests.length === 0) {
    throw new Error("No course manifest found in /content/manifest.");
  }

  const tutorialsByConceptId = Object.fromEntries(
    Object.entries(tutorialModules)
      .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
      .map(([path, content]) => {
      const conceptId = path.split("/").pop()?.replace(".md", "");
      if (!conceptId) {
        throw new Error(`Cannot derive tutorial concept id from path ${path}`);
      }

      return [conceptId, content];
      }),
  );

  const manifest: CourseManifestDocument = {
    courses: manifests.flatMap((entry) => entry.courses),
  };

  const orderedTestSets = Object.entries(testSetModules)
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([, document]) => document);

  return new StaticContentRepository(
    manifest,
    orderedTestSets,
    tutorialsByConceptId,
  );
}
