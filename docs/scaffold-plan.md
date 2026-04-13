# Math Concept Mastery Scaffold Plan

## Summary
Build a new local-first React + Vite + TypeScript scaffold in the empty repo, using `npm`, Tailwind, `react-router-dom`, and Vitest. The initial deliverable is a working app shell with sample Course 2 content, deterministic content loading, local persistence via a swappable storage adapter backed by `localStorage`, and thin route pages that exercise the core flow: browse course, open concept, start test, save answers, submit, review results, and view progress.

Top-level structure:

```text
/
├─ docs/
├─ public/
├─ src/
│  ├─ app/
│  ├─ routes/
│  ├─ components/
│  ├─ domain/
│  ├─ content/
│  │  ├─ manifest/
│  │  └─ question-banks/
│  ├─ services/
│  ├─ engines/
│  ├─ storage/
│  ├─ state/
│  ├─ utils/
│  └─ test/
├─ package.json
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.node.json
├─ tailwind.config.ts
└─ postcss.config.js
```

## Key Changes

### App shell and routing
- Create a single app layout with header, nav, route outlet, and lightweight scaffold messaging.
- Implement these routes with functioning placeholder shells:
  - `/`
  - `/courses`
  - `/course/:courseId`
  - `/concept/:conceptId`
  - `/test/:sessionId`
  - `/results/:attemptId`
  - `/progress`
- Keep route components thin and move logic into services/hooks.

### Domain model and content schema
- Define core models in TypeScript:
  - `Course`, `Unit`, `Concept`, `Question`
  - `TestSession`, `TestAttempt`, `AnswerRecord`, `ProgressRecord`
  - `MasteryStatus`, plus small supporting enums/types such as `QuestionType`, `DifficultyLevel`, `SessionMode`
- `TestSession` must include:
  - `answers: Record<string, AnswerRecord>`
  - `currentQuestionIndex: number`
  - `status: 'in_progress' | 'submitted'`
- Require globally unique `question.id` values across all content files.
- Organize content as:
  - course/unit/concept manifest JSON
  - one question-bank JSON per concept
- Ship sample Course 2 content with at least 1 course, 2 units, 3 concepts, and enough questions to demonstrate the full flow.

### Content loading and lookup strategy
- Add a content repository that loads manifest and question-bank JSON from local files.
- Build normalized in-memory indexes during load:
  - `coursesById`
  - `conceptsById`
  - `questionsById`
  - concept-to-question ID lists
- Validate duplicate question IDs at startup and fail fast if any are found.
- Expose O(1) question lookup for scoring, session rendering, and results review via `questionsById`.

### Services, engines, and future extension hooks
- Add service contracts for:
  - content loading
  - concept test generation
  - scoring
  - session persistence
  - progress persistence
  - mixed-test eligibility/generation
- Implement deterministic baseline engines:
  - `DeterministicConceptTestEngine`
  - `BasicScoringEngine`
  - `MixedTestEligibilityEngine`
- Add a future hook for difficulty-based question selection now:
  - the test engine must depend on a `QuestionSelectionStrategy`-style interface instead of hardcoding selection logic
  - ship a default `StableSelectionStrategy` that preserves source order and target count
  - strategy input must already include question difficulty and generation context so balancing can be added later without changing engine/service signatures
- Keep mixed-test generation minimal in the scaffold: only expose eligibility and placeholder generation contracts, with unlock after 3 completed concept attempts.

### Persistence and progress
- Add a small storage abstraction:
  - `KeyValueStore`
  - `LocalStorageKeyValueStore`
- Persist separately:
  - sessions
  - attempts
  - progress summaries
- `TestAttempt` storage must be append-only:
  - multiple attempts per concept are stored and retrievable
  - no overwrite of prior attempts
  - retrieval by `attemptId` and listing by `conceptId`
- `ProgressRecord` should be derived from attempt history and store summary fields such as:
  - attempt count
  - latest score
  - best score
  - mastery status
  - last attempted timestamp
- Submission flow:
  - reads the session
  - scores it
  - appends a new `TestAttempt`
  - updates progress summary
  - marks session `status` as `submitted`

### Answer normalization and scoring
- Add a standalone normalization utility used by scoring and review helpers.
- Baseline normalization behavior:
  - trim whitespace
  - lowercase text
  - normalize numeric strings so equivalent values compare equal, including `"2"` and `"2.0"`
- Keep the utility simple but extensible so later rules like fraction equivalence, tolerance ranges, or math-expression normalization can be added without refactoring the scoring engine.
- Scoring remains submit-only for v1 scaffold, not per-question immediate grading.

### UI flow
- `/courses`: list courses from content.
- `/course/:courseId`: show units and concepts.
- `/concept/:conceptId`: show concept metadata, progress summary, attempt history preview, and start test action.
- `/test/:sessionId`: show question prompt, basic nav, answer entry, autosave, and resume support using `answers`, `currentQuestionIndex`, and session `status`.
- `/results/:attemptId`: show score summary plus incorrect-answer review using `questionsById` lookup.
- `/progress`: show concept statuses, recent/best scores, attempt counts, and mixed-test unlock state.

## Public Interfaces / Contracts
- `ContentRepository`
  - `listCourses(): Promise<Course[]>`
  - `getCourse(courseId: string): Promise<Course | null>`
  - `getConcept(conceptId: string): Promise<Concept | null>`
  - `getQuestionsForConcept(conceptId: string): Promise<Question[]>`
  - `getQuestionById(questionId: string): Promise<Question | null>` or equivalent synchronous lookup from loaded index
- `QuestionSelectionStrategy`
  - accepts candidate questions plus generation context including concept ID, target count, and difficulty metadata
  - returns selected question IDs or `Question[]`
- `TestGenerationService`
  - `createConceptSession(conceptId: string): Promise<TestSession>`
- `SessionService`
  - `getSession(sessionId: string): Promise<TestSession | null>`
  - `saveAnswer(sessionId: string, answer: AnswerRecord): Promise<void>`
  - `setCurrentQuestionIndex(sessionId: string, index: number): Promise<void>`
  - `submitSession(sessionId: string): Promise<TestAttempt>`
- `ScoringService`
  - `scoreSession(session: TestSession): TestAttempt`
- `ProgressService`
  - `getProgress(): Promise<ProgressRecord[]>`
  - `getConceptAttempts(conceptId: string): Promise<TestAttempt[]>`
  - `getAttempt(attemptId: string): Promise<TestAttempt | null>`
  - `updateFromAttempt(attempt: TestAttempt): Promise<void>`
- `MixedTestService`
  - `getEligibility(courseId: string): Promise<{ unlocked: boolean; conceptIds: string[] }>`

## Test Plan
- Vitest unit tests for:
  - content loading and graph assembly from sample JSON
  - duplicate global question ID detection
  - `questionsById` lookup behavior
  - deterministic concept session generation using the default selection strategy
  - strategy hook wiring, proving the engine delegates selection through the strategy interface
  - answer normalization for trimmed text, lowercased text, and numeric equivalence such as `2 == 2.0`
  - scoring counts for correct, incorrect, and unanswered answers
  - mastery mapping with `>= 85%` as mastered and below that as needs review
  - append-only attempt storage for multiple attempts on the same concept
  - progress summary derivation from attempt history
  - mixed-test unlock after 3 completed concept attempts
- One lightweight app smoke test if practical:
  - render app, navigate to a concept, start a session successfully
- Manual acceptance checks:
  - sample Course 2 content loads
  - starting a concept test creates a persisted session
  - answer edits survive refresh
  - current question position survives refresh
  - submit creates a new attempt and does not overwrite prior attempts
  - results page loads by `attemptId` and resolves question details through the lookup map
  - progress page reflects latest/best score and mixed eligibility

## Assumptions and Defaults
- `npm` is the package manager.
- Tailwind is used, but styling remains intentionally minimal.
- `localStorage` is the default persistence backend behind a storage interface.
- Sample content is scaffold-sized, not a full production question bank.
- Question ordering is deterministic; no randomization in the scaffold.
- Admin tooling remains file-based and out of scope for this pass.
- Mixed-test generation beyond unlock plumbing is deferred; only interface and minimal eligibility behavior are scaffolded now.
