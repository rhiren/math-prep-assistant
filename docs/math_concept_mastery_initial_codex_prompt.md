# Initial Codex Prompt — Math Concept Mastery App

Use this prompt as the first instruction to Codex after sharing the PRD.

---

## Purpose

You are helping build a **local-first Math Concept Mastery App** based on the attached PRD.

The goal is to implement the initial architecture and project scaffold for a portable web app that starts with **Course 2** and supports adding more courses over time.

---

## What to Build First

Create the **initial technical foundation** for the app, not the full product.

Focus on:
1. project scaffold,
2. folder structure,
3. core domain models,
4. content-loading strategy,
5. test engine interfaces,
6. progress persistence interfaces,
7. and a minimal working UI shell.

---

## Product Intent

The app is a **concept-based math mastery system**, not a generic chatbot.

Core user flow:
- select course,
- select concept,
- start concept test,
- answer questions,
- save progress,
- submit,
- review wrong answers,
- unlock mixed reinforcement tests after 3 completed concepts.

The system must be:
- local-first,
- portable,
- deterministic,
- extensible,
- and content-driven.

Do **not** design this as a cloud SaaS platform for v1.

---

## Required Technical Direction

Use the following architectural direction unless a strong reason is documented otherwise:

- **Frontend:** React + Vite + TypeScript
- **Styling:** simple CSS or Tailwind, but keep styling secondary to clean structure
- **Backend:** none for v1 unless absolutely necessary
- **Persistence:** browser local storage or IndexedDB abstraction
- **Content source:** structured local JSON files
- **Routing:** client-side routing
- **State design:** modular and simple
- **Testing:** add basic unit-test-ready structure for core engines

---

## First Deliverables

Generate the following:

### 1. Repository structure
Create a clean repo structure for:
- app shell
- routes/pages
- reusable components
- domain models
- services
- storage
- test engine
- scoring engine
- progress tracking
- local content files

### 2. Domain model definitions
Define TypeScript models/interfaces for:
- Course
- Unit
- Concept
- Question
- TestSession
- TestAttempt
- AnswerRecord
- ProgressRecord
- MasteryStatus

### 3. Content loading strategy
Create a simple loader for course/unit/concept/question JSON files.

### 4. Initial routing shell
Create pages/routes for:
- `/`
- `/courses`
- `/course/:courseId`
- `/concept/:conceptId`
- `/test/:sessionId`
- `/results/:attemptId`
- `/progress`

### 5. Core services interfaces
Create initial service modules or interfaces for:
- content loading
- test generation
- scoring
- progress storage
- session persistence
- mixed test generation

### 6. Minimal working UI
Build a minimal but functioning UI shell that lets a developer:
- load sample course data,
- click into a concept,
- start a sample test session,
- and see placeholder navigation.

---

## Important Constraints

- Keep code modular and easy to extend.
- Prefer deterministic logic over clever abstractions.
- Do not overengineer.
- Do not add authentication.
- Do not add cloud APIs.
- Do not add runtime AI features.
- Do not hardcode the app only for one concept.
- Structure everything so additional courses and concepts can be added later through content files.

---

## Content Assumptions

For now, assume:
- content is pre-authored,
- question banks are stored locally,
- explanations are included in question data,
- and concept tests will be generated from those stored banks.

Do not build authoring tools yet unless needed for clean architecture.

---

## Deliverable Format

Return:
1. a proposed repository structure,
2. implementation notes,
3. and the actual starter code for the scaffold.

Favor practical code over long prose.

---

## Coding Standards

- Use TypeScript everywhere possible.
- Keep files focused and small.
- Add comments only where they help understanding.
- Use clean naming.
- Prefer composition over large monolithic files.
- Make it easy for a follow-up Codex prompt to extend the scaffold into a full implementation.

---

## After the Scaffold

After completing the scaffold, the next likely tasks will be:
- implement content schema,
- build concept test engine,
- build scoring logic,
- build test-taking UI,
- build results + remediation views,
- implement progress tracking,
- and add mixed-test unlocking logic.

Design the scaffold so these can be added incrementally without restructuring the repo.
