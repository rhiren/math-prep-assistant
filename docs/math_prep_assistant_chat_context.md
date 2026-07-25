# Math-Prep-Assistant Chat Context

Last updated: 2026-07-24

## Purpose

This file captures the main Codex chat context for the project originally developed as `Math-Prep-Assistant` and later renamed to `school-prep-assistant`.

Current constitutional guidance for future changes is preserved separately in [AGENTS.md](/Users/hiren/Documents/github/school-prep-assistant/AGENTS.md). This document should be treated as historical and operational context, while `AGENTS.md` is the authoritative guardrail for future changes.

For significant future work, read `AGENTS.md` first and then use this document for historical rationale, prior decisions, migration context, and current-state handoff notes.

Primary session source:
- `~/.codex/sessions/2026/04/12/rollout-2026-04-12T11-03-38-019d82dd-0eff-7ac1-a26d-ca94ebc3e7a3.jsonl`

Related capture session:
- `~/.codex/sessions/2026/04/18/rollout-2026-04-18T10-06-40-019da18f-107c-70b2-b839-dfc9cafa94e4.jsonl`

## Project Identity

- Original repo/folder name: `Math-Prep-Assistant`
- Current repo/folder name: `school-prep-assistant`
- Current local path: `/Users/hiren/Documents/github/school-prep-assistant`
- Current remote: `https://github.com/rhiren/school-prep-assistant`

## Core Product Intent

The app was built as a local-first concept-based learning system, initially for Course 2 math, with these repeated goals across the chat:

- Keep the app deterministic, content-driven, and easy to extend.
- Avoid SaaS-style architecture for v1.
- Preserve business logic when making changes.
- Keep UI student-friendly and low-friction.
- Support future expansion beyond math without breaking the current math flow.
- Favor minimal, safe, incremental changes over broad rewrites.

## Persistent Constraints Repeated By The User

- Do not add authentication.
- Do not rewrite the app architecture.
- Do not break existing math functionality while expanding scope.
- Keep IndexedDB/local-first behavior intact even when cloud sync is added.
- Preserve existing progress where possible during migrations and renames.
- Keep test generation deterministic, but leave extension hooks for future difficulty logic.
- Make the experience good for a real student, not a developer demo.

## What Was Built Over Time

### 1. Initial Scaffold

The first major task was to create the app scaffold in React + Vite + TypeScript with routing, domain models, content loading, storage abstractions, and a minimal working UI shell.

Important early design decisions:
- `QuestionSelectionStrategy` was added as a future hook for difficulty-aware selection.
- Answer normalization was designed as a separate utility, not embedded in scoring.
- Question IDs were required to be globally unique.
- `TestSession` explicitly stores answers, current question index, and session status.
- Attempt history is append-only, with progress derived from attempts instead of overwriting prior work.

### 2. Student Test-Taking UX

The test flow was gradually improved to feel usable by a student:

- question progress header
- jump-to-question nav grid
- answered/unanswered visibility
- sticky next/previous/submit controls
- confirmation before submitting with unanswered questions
- flagged vs unanswered visual distinction
- better spacing/readability
- mobile-friendlier layout
- last-question behavior swaps `Next` for `Submit test`

### 3. Results And Dashboard UX

The results page and home/dashboard were reshaped from scaffold/developer language into student-facing UX:

- score summary with correct/incorrect/unanswered
- incorrect-answer review with selected answer, correct answer, and explanation
- expandable explanations
- retry concept test action
- student-focused home page with `Math Practice Dashboard`
- continue practice, next-step recommendation, and progress summary
- logic to recommend the first concept, next concept, or resume in-progress work
- encouraging language and simplified guidance

### 4. Storage Evolution

Storage started as `localStorage` and was upgraded to IndexedDB using `idb`.

Important storage expectations captured in the chat:
- keep higher-level storage/service contracts stable
- migrate old localStorage data into IndexedDB
- maintain separate storage for sessions, attempts, and progress
- keep multiple attempts per concept
- do not change business logic while changing persistence technology

### 5. Answer Normalization

Normalization expanded beyond trivial text cleanup:

- trim whitespace
- lowercase text
- numeric equivalence such as `2` and `2.0`
- ratio normalization
- fraction normalization
- decimal normalization
- cross-type equivalence where appropriate
- simplified-form equivalence for fractions and ratios
- optional feedback tips when the answer is correct but not in the expected form

### 6. Content And Curriculum Work

The Course 2 content was expanded and improved:

- content manifests and tutorials were added
- concept test banks were reviewed and strengthened
- question rigor was recalibrated against weekly benchmark practice/test files
- answer keys and explanations were rechecked
- the biggest quality upgrades were made in unit rates, equivalent ratios, percent relationships, and proportions

### 7. Packaging, Distribution, And Deployment

The project evolved from a web scaffold into multiple delivery modes:

- local launcher script
- Electron desktop support
- packaged local launcher flow and user guide
- support for local file packaging
- GitHub Pages deployment using `gh-pages`

Content was moved under `public/content` and the loader was adapted so the app could serve static content correctly in built deployments.

### 8. Firebase Sync

Firestore was added as a best-effort sync and backup layer on top of local storage.

Intent:
- local-first remains primary
- Firebase is optional and non-blocking
- newest `lastModified` wins during conflict resolution
- the app must keep working if Firebase is unavailable

Placeholder Firebase config was intentionally left in place pending real project credentials.

### 9. Multi-Subject Refactor

The repo was lightly generalized from math-only into subject-ready structure without adding science features:

- project identity changed to `school-prep-assistant`
- content moved to `public/content/math/course2/...`
- manifest fields expanded with `subjectId`, `subjectTitle`, `courseId`, and `courseTitle`
- content loading became subject/course aware
- the current math-first UX was preserved

### 10. Multi-Student Support

The app was later expanded to support multiple student profiles:

- local student profile model
- active student selection
- student-scoped sessions, attempts, and progress
- student-scoped Firebase sync path: `students/{studentId}/progress/current`
- migration path to preserve prior single-user data under `student-1`
- export/import updated to operate per active student

## Git History Milestones

Recent meaningful commits in current `master` history:

- `d1684fa` Build release-ready math practice scaffold
- `a8aa4fa` Add Course 2 content packs and tutorials
- `e4cefe3` Support local file packaging
- `88d28f8` Add distribution bundle and user guide
- `ed5f5ff` Expand and refine Course 2 manifest
- `9f3c728` Refresh packaged local distribution bundle
- `fc7fa17` Add repo launcher script
- `8e097e0` Add Electron desktop app support
- `381491f` Add fullscreen launch and focus mode
- `38f8acb` Configure GitHub Pages deployment
- `019dd2a` Strengthen Course 2 concept test banks
- `7fb6af1` Add Firebase progress sync layer
- `3ae269f` Refactor for multi-subject readiness
- `9142441` Configure Firebase project defaults
- `dcc006f` Add multi-student profile support

## Current Independent-Session Handoff — 2026-07-24

This section is the current operational handoff. It supersedes any older
`Current Codebase State`, uncommitted-change, placeholder-config, or next-step
notes later in the historical record.

### Repository state

- Branch: `master`
- Remote: `https://github.com/rhiren/school-prep-assistant`
- Latest pushed commit:
  `bb6114c Refresh independent session handoff`
- Latest pushed Course 3 implementation commit:
  `e5b5308 Add real number comparison practice`
- The Integer Exponents pack described below is complete in the local working
  tree but has not yet been committed or pushed.
- `origin/master` currently matches local `master` at `bb6114c`.
- The Vite base path is already `/school-prep-assistant/`; the older rename
  follow-up is complete.
- The GitHub Pages publication status of the two commits above was not verified
  in the final Course 3 session. Pushing `master` is not the same as running
  `npm run deploy`, which publishes `dist` through `gh-pages`.

### Active product and content

The app now actively supports:

- Mathematics Course 2
- Mathematics Course 3
- Grade 6 Science

The platform remains:

- React + Vite + TypeScript
- manifest-driven with content under `public/content`
- local-first with IndexedDB as the resilience layer
- optionally synchronized through Firebase/Firestore
- multi-student and student-scoped
- subject-aware and GitHub Pages compatible through `HashRouter`

Firebase now has a real default project configuration for
`school-prep-assistant` with optional Vite environment overrides. It remains a
best-effort sync layer; local storage is still foundational and the app must
continue working when remote sync is unavailable.

### Course 3 current state

Course 3 is for an accelerated Grade 7 learner working at Grade 8
instructional level. Do not collapse `homeGrade` and `instructionalGrade`.

The seven learner-ready Unit 1 concepts are:

1. Rational and Irrational Numbers
2. Repeating Decimals as Fractions
3. Square Roots and Perfect Squares
4. Cube Roots and Perfect Cubes
5. Approximate Irrational Numbers
6. Compare and Order Real Numbers
7. Integer Exponents

Course 3 currently contains:

- 7 active concepts
- 14 assessment files
- 490 assessment questions
- 50 core questions per concept
- 20 review questions per concept

Core difficulty distribution is:

- 10 scaffold
- 25 standard
- 15 challenge

Review difficulty distribution is:

- 8 scaffold
- 12 standard

The current active manifest is:

`public/content/math/course3/manifest/course3_manifest.json`

The complete course sequence and release order are in:

`docs/course3_concept_rollout_plan.md`

### Recent learner-facing UI work

Course navigation groups courses beneath their subject and currently presents
the seven Course 3 concepts in a clean three-column grid at the desktop
viewport used for verification. The first two rows contain three cards each,
and Integer Exponents begins a third row without disrupting navigation or card
readability.

The tutorial renderer in `src/routes/ConceptTutorialPage.tsx` now safely
supports the Markdown structures used by the new lessons:

- headings
- paragraphs
- bold text
- inline code / math notation
- blockquotes
- bulleted and numbered lists with wrapped lines
- tables

It renders React elements rather than injecting raw HTML.

No broader UI redesign is currently required for the next concept pack.

### Current validation baseline

For the current local Integer Exponents working tree, the following passed:

- 18 Vitest files
- 100 automated tests
- `npm run build`
- Course 3 JSON parsing
- globally unique Course 3 question IDs
- exact authored multiple-choice answer identity
- unique option checks
- known-correct mathematical spot checks
- browser verification of the Course 3 grid, concept page, tutorial, and
  assessment counts

The most recent Course 3 audit found 490 questions and 490 unique IDs.

Existing non-blocking warnings include:

- Vite externalizing `node:fs/promises` for browser compatibility in the
  content repository's environment-specific loader path
- a production bundle-size warning above 500 kB
- expected development logs for Course 2 manifest concepts whose learner-ready
  assets have not yet been built

Do not treat those warnings as authorization for a broad rewrite.

### Exact next task

The next Course 3 concept is:

`Zero and Negative Exponents`

It is Unit 1 concept 8 and aligns to `8.EE.1`.

Build it as one complete concept pack:

1. Create
   `public/content/math/course3/tutorials/concept-zero-negative-exponents.md`.
2. Create
   `public/content/math/course3/test-sets/course3-zero-negative-exponents-core.json`
   with 50 questions and the established `10 / 25 / 15` difficulty split.
3. Create
   `public/content/math/course3/test-sets/course3-zero-negative-exponents-review.json`
   with 20 questions and the established `8 / 12` difficulty split.
4. Validate exact multiple-choice answer identity, four unique options,
   globally unique IDs, explanations, and known-correct paths.
5. Only after the tutorial and both banks are complete, add
   `concept-zero-negative-exponents` to the active Course 3 manifest at order
   8.
6. Update the current learner-ready lists in `AGENTS.md` and
   `docs/course3_concept_rollout_plan.md`.
7. Extend the Course 3 pack loop in `src/test/contentRepository.test.ts`.
8. Run the focused content test, full `npm test`, `npm run build`, and browser
   verification.

Content emphasis should include:

- extending quotient patterns to explain the zero-exponent rule
- interpreting negative exponents as reciprocals
- rewriting expressions with positive exponents
- numerical and algebraic expressions with zero and negative exponents
- signs, parentheses, coefficients, and multiple variables
- explaining why the rules work rather than memorizing isolated shortcuts
- misconception analysis and equivalence checks

Do not move into Powers of Ten yet; that is the following concept pack.

### Independent-session startup checklist

1. Read `AGENTS.md` completely.
2. Read this current handoff section.
3. Read `docs/course3_concept_rollout_plan.md`.
4. Run `git status --short` and confirm what, if anything, changed after this
   documentation refresh.
5. Preserve progress, routing, content loading, sync behavior, and the
   manifest-driven structure.
6. Build only the next complete pack; do not mass-enable later roadmap
   concepts.

## Known Deliberate Non-Changes

These were explicitly left alone on purpose:

- `src/storage/indexedDbStorageService.ts` still uses the old DB name for migration compatibility
- Legacy packaged `Math-App/` bundle was later removed from the repo as redundant
- Current local launcher is `Open Math Practice.command`

## Known Caveats Mentioned In Chat

- Electron verification in this environment had some headless/macOS limitations, so web validation was stronger than GUI-window validation.
- Some older content-loader warnings about missing tutorials were noted in the chat at various points; they did not block the main web build validations mentioned in those turns.

## Useful Future Follow-Ups

Current useful follow-ups:

- commit and push the completed local `Integer Exponents` concept pack when
  requested
- build `Zero and Negative Exponents` as the next complete Course 3 concept
  pack
- verify or run the GitHub Pages deployment after new `master` content commits
- keep local launcher and distribution guidance aligned with `dist/` and
  `public/content`
- continue Course 2 readiness work only through its dedicated rollout plan
- continue expanding subjects without disturbing current math, progress, or
  sync behavior

## Short Context Summary For A New Chat

If you need a compact prompt for future work, this is the essence:

`school-prep-assistant` is a local-first React/Vite/TypeScript learning platform
with IndexedDB persistence, deterministic concept tests, exact
multiple-choice scoring, student-friendly tutorials and practice, optional
Firebase sync, multi-student profiles, subject-aware course navigation, and
GitHub Pages support. Active content includes Math Course 2, Math Course 3, and
Grade 6 Science. Course 3 is an accelerated Grade 7 placement into Grade 8
instructional content and has seven learner-ready Unit 1 concepts with 490
validated questions, including the completed local `Integer Exponents` pack.
The latest pushed commit is `bb6114c`; the Integer Exponents working tree is
not yet committed.
The next pack is `Zero and Negative Exponents` (`8.EE.1`), followed separately
by `Powers of Ten`. Preserve saved-progress compatibility, local-first
behavior, the frozen domain model, and the phased manifest release discipline.
