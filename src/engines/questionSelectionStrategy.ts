import type { Concept, Question } from "../domain/models";

export interface QuestionSelectionContext {
  concept: Concept;
  targetCount: number;
}

export interface QuestionSelectionStrategy {
  selectQuestions(
    questions: Question[],
    context: QuestionSelectionContext,
  ): Question[];
}

export class StableSelectionStrategy implements QuestionSelectionStrategy {
  selectQuestions(questions: Question[], context: QuestionSelectionContext): Question[] {
    return questions.slice(0, context.targetCount);
  }
}
