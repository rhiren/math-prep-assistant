# Math Concept Mastery App — Product Requirements Document (PRD)

## 1. Document Control

- **Product Name:** Math Concept Mastery App
- **Document Type:** Product Requirements Document
- **Version:** v1.0
- **Status:** Draft for architecture planning
- **Primary Goal:** Define a scalable, local-first math learning product focused on concept mastery, starting with Course 2

---

## 2. Executive Summary

The Math Concept Mastery App is a local-first, portable web application designed to help a student build durable understanding of math through structured concept-based practice, detailed feedback, and reinforcement. The system will begin with **Course 2** and must support incremental addition of future courses over time without requiring major redesign.

Instead of organizing practice solely by week, the product will organize learning around **courses, units, concepts, question banks, concept tests, mixed reinforcement tests, and mastery tracking**.

The app is intended to:
- replace repeated manual creation of weekly tests,
- support repeatable and structured concept practice,
- give the student a clean test-taking experience,
- provide feedback and remediation on mistakes,
- and help the parent/admin manage content and monitor progress.

This PRD is intended to finalize product scope before moving into technical architecture.

---

## 3. Product Vision

Build a **local-first concept mastery math prep application** that:
1. lets a student practice one concept deeply,
2. gives clear end-of-test scoring and mistake review,
3. reinforces learning with mixed review after multiple concepts,
4. stores progress locally,
5. and scales to additional courses over time.

---

## 4. Problem Statement

The current workflow relies on manually generating practice tests week by week. While effective, that process is not efficient or scalable over time.

Current pain points:
- practice content is manually assembled each time,
- progress is not tracked systematically inside a reusable system,
- reinforcement across concepts must be manually orchestrated,
- content reuse across courses is limited,
- and the student experience depends on external files rather than a dedicated learning environment.

There is a need for a reusable product that systematizes:
- concept practice,
- answer entry,
- scoring,
- mistake review,
- reinforcement,
- and progress tracking.

---

## 5. Goals

## 5.1 Primary Goals

- Build a **portable math prep web app** that can be transferred from one computer to another.
- Start with **Course 2** and support adding future courses over time.
- Organize practice around **concept mastery**, not just weekly schedules.
- Deliver **50–75 question concept tests** following a consistent learning pattern.
- Let the student answer questions directly in the app.
- Save answers during the test until submission.
- Score the full test after completion.
- Show which questions were incorrect.
- Provide learning support for incorrect answers.
- Unlock mixed reinforcement tests after three concept tests are completed.

## 5.2 Secondary Goals

- Track concept-level progress over time.
- Support parent/admin visibility into weak areas.
- Make content reusable and maintainable.
- Prepare the product for future enhancements such as adaptive review and richer remediation.

---

## 6. Non-Goals (MVP)

The following are explicitly out of scope for the first version unless later promoted into scope:

- Real-time AI-generated questions during the student session
- Cloud-first architecture or required hosted backend
- Multi-student account system
- Gamification features such as badges, streaks, or leaderboards
- Advanced analytics dashboards beyond practical progress tracking
- Rich media authoring such as graph drawing tools or embedded video lessons
- Full teacher/classroom workflow
- Runtime chatbot assistant as the core interaction model

---

## 7. Users

## 7.1 Primary User: Student

The student will:
- select a course and concept,
- take concept tests,
- enter answers,
- review results after submission,
- review mistakes,
- and take mixed reinforcement tests.

## 7.2 Secondary User: Parent/Admin

The parent/admin will:
- add and manage course content,
- add and organize concepts,
- review performance,
- decide what the student should work on next,
- and use the app as the system of record for learning progress.

---

## 8. Product Principles

1. **Local-first**
   - Core functionality must work locally without requiring cloud services.

2. **Portable**
   - The app must be easy to package and move between computers.

3. **Content-driven**
   - Questions should be stored in structured, reusable formats.

4. **Deterministic**
   - Tests, scoring, and explanations should be stable and repeatable.

5. **Concept-first**
   - Learning should be organized around well-defined concepts.

6. **Student-friendly**
   - The test-taking experience must be simple, clear, and resilient.

7. **Parent-manageable**
   - A parent/admin must be able to extend the system over time.

---

## 9. Core Terminology

| Term | Definition |
|------|------------|
| Course | A full curriculum such as Course 2 |
| Unit | A grouping of related concepts within a course |
| Concept | A focused, teachable math skill area that supports its own practice test |
| Question Bank | A structured collection of questions for a concept |
| Concept Test | A 50–75 question assessment for a single concept |
| Mixed Test | A reinforcement test composed of questions from multiple concepts |
| Mastery Status | The system’s current assessment of student progress for a concept |
| Attempt | One completed or in-progress test session |
| Remediation | The review experience that helps the student understand incorrect answers |

---

## 10. Product Scope

## 10.1 In Scope for MVP

- Course-based organization
- Unit and concept organization
- Concept question banks
- Concept test generation from stored question banks
- 50–75 question concept tests
- Multiple choice and typed answer entry
- Saved in-progress answers
- End-of-test submission and scoring
- Results summary
- Incorrect question review with explanations
- Mixed reinforcement tests after three completed concepts
- Local progress tracking
- Parent/admin content management workflow
- Portable install or package for use on another computer

## 10.2 Out of Scope for MVP

- Live AI generation of practice questions
- Live AI tutoring chat as the main interface
- Cloud sync across devices
- Multi-user account management
- Full standards mapping engine
- Video/audio lesson system
- Highly adaptive algorithmic sequencing
- Teacher portal

---

## 11. Information Architecture

The system should be organized as follows:

- **Course**
  - **Units**
    - **Concepts**
      - Question bank
      - Concept tests
      - Explanations
      - Mastery status
      - Attempt history

This structure must support adding additional courses over time without architectural changes.

---

## 12. Concept Definition Requirements

A concept is the smallest learning unit in the product for which the system will provide:
- a question bank,
- a dedicated concept test,
- progress tracking,
- and remediation support.

### 12.1 Concept Granularity Rule

Each concept should:
- represent a focused skill area,
- be narrow enough for targeted practice,
- and be broad enough to support 50–75 questions.

### 12.2 Concept Metadata

Each concept should include:
- concept ID
- concept name
- description
- course association
- unit association
- tags or subskills
- mastery status
- ordering within the course

---

## 13. Content Strategy

## 13.1 Content Source Strategy

For MVP, questions should be:
- pre-authored,
- AI-assisted during authoring if useful,
- stored in structured files,
- and reviewed for quality before use in the app.

### Rationale
This avoids the risk of inconsistent runtime generation and ensures:
- predictable answer keys,
- stable explanations,
- repeatability,
- and instructional quality.

## 13.2 Content Reuse

Questions must be stored in a way that supports:
- concept test generation,
- mixed test generation,
- retests,
- and future imports/edits.

---

## 14. Question Model Requirements

Each question should support the following fields at minimum:

- question ID
- course ID
- unit ID
- concept ID
- subskill or tag(s)
- difficulty
- question type
- question text
- answer choices if applicable
- correct answer
- explanation
- optional hint
- eligibility for mixed tests

### 14.1 Supported Question Types (MVP)

- Multiple choice
- Numeric typed answer
- Short text typed answer

### 14.2 Future Question Types

Potential future support:
- diagram/image-based question
- coordinate graph question
- drag-and-drop
- multi-part question

These are not required for MVP.

---

## 15. Test Design Requirements

## 15.1 Concept Test Size

Each concept test should include **50 to 75 questions**.

The final number may vary by concept depending on content volume, but the system should be designed to support that full range.

## 15.2 Difficulty Distribution

Each concept test should follow a standard difficulty progression. Initial target distribution:

- Easy / foundational: 20%
- Medium / core skill: 40%
- Hard / multi-step: 25%
- Challenge / tricky application: 15%

This distribution can be adjusted later, but the system must support difficulty-based assembly.

## 15.3 Test Assembly Rules

The system should:
- select questions from the relevant concept bank,
- apply the target count,
- maintain approximate difficulty distribution,
- avoid duplicates within a single test,
- and produce a stable, student-friendly test order.

---

## 16. Test-Taking Experience Requirements

## 16.1 Core Test Flow

Student flow:
1. Select course
2. Select concept
3. Start concept test
4. Answer questions
5. Save progress automatically
6. Review unanswered questions if desired
7. Submit full test
8. View results
9. Review incorrect answers
10. Continue with next concept or reinforcement test

## 16.2 Navigation

Student must be able to:
- move between questions,
- go forward and backward,
- skip questions,
- return to unanswered questions,
- and see answered vs unanswered status.

## 16.3 Answer Entry

The app must support:
- multiple choice selection where applicable,
- typed numeric or text answers where applicable.

## 16.4 Autosave / Resume

The app must:
- save answers as they are entered,
- preserve in-progress test state,
- and allow the student to resume an incomplete test later on the same device.

## 16.5 Submission

The test should be graded **after full submission**, not question by question during the test, for MVP.

---

## 17. Scoring and Results Requirements

After submission, the system must display:

- total number of questions
- number correct
- number incorrect
- number unanswered
- percentage score

### 17.1 Results View

The results page should clearly show:
- final score,
- outcome summary,
- which questions were wrong,
- and available remediation options.

### 17.2 Question-Level Review

For each incorrect question, the system must provide:
- the question,
- the student’s answer,
- the correct answer,
- and an explanation of how to solve it.

### 17.3 Explanation Depth

For MVP, each question explanation should support:
- correct answer identification,
- short explanation,
- and step-by-step solution text where appropriate.

---

## 18. Remediation Requirements

For wrong answers, the system should offer a **learn/review experience**.

### MVP Remediation Requirements

For each incorrect question:
- show the correct answer,
- explain why it is correct,
- and show the method or steps.

### Future Remediation Enhancements

Potential future additions:
- hints before revealing full solution,
- “why your selected choice was wrong,”
- retry on a similar question,
- mini lesson summary,
- adaptive follow-up practice.

These are not required for MVP but should remain compatible with the content model.

---

## 19. Mixed Reinforcement Test Requirements

## 19.1 Trigger Rule

After the student completes **three new concept tests**, the system should unlock a new mixed reinforcement test covering those concepts.

## 19.2 Purpose

The mixed test is intended to:
- reinforce retention,
- promote mixed retrieval,
- reduce concept isolation,
- and surface lingering weak areas.

## 19.3 Mixed Test Composition

Initial mixed test requirements:
- 30–40 questions total
- questions drawn from the three relevant concepts
- representation from all three concepts
- preference for weaker areas where possible

## 19.4 Mixed Test Feedback

Mixed tests should provide:
- scoring,
- incorrect answer review,
- and progress updates similar to concept tests.

---

## 20. Mastery Tracking Requirements

The system must track a mastery status for each concept.

### 20.1 Mastery States

Initial states:
- Not Started
- In Progress
- Practiced
- Needs Review
- Mastered

### 20.2 Initial Mastery Rule

Proposed initial rule:
- **85% or above** on concept test → Mastered
- **Below 85%** → Needs Review

The product should allow this threshold to be configurable later.

### 20.3 Progress Signals

The app should track at minimum:
- attempts completed,
- latest score,
- best score,
- mastery status,
- and mixed test performance related to that concept.

---

## 21. Dashboard / Progress Requirements

The app should include a progress view that helps the student and parent see where things stand.

### MVP Dashboard Requirements

Display:
- course progress percentage
- concept list
- concept mastery status
- recent scores
- concepts needing review
- next recommended concept or mixed test

### Parent/Admin Usefulness

The progress view should allow the parent/admin to quickly identify:
- what is complete,
- what is weak,
- and what should be assigned next.

---

## 22. Retest and Review Requirements

## 22.1 Retest Logic

When a student retakes a concept:
- the system should prefer unused questions if available,
- otherwise reuse prior questions with reshuffling.

## 22.2 Future Retest Enhancements

Potential future options:
- retest only wrong questions,
- retest only challenge questions,
- generate targeted review set from mistakes.

These are not required for MVP.

---

## 23. Persistence Requirements

The system must save data locally and reliably.

### Data to Persist

- courses and concepts (content files)
- test attempts
- selected answers
- in-progress test state
- scores
- mastery status
- mixed test completion history

### Reliability Requirement

The app must not lose entered answers during normal use. Autosave behavior is required.

---

## 24. Parent/Admin Requirements

The parent/admin must be able to manage learning content over time.

### MVP Admin Capabilities

- add a new course
- add/edit units
- add/edit concepts
- import or add question banks
- review student progress
- reset or clear attempts if needed

### Authoring Assumption

For MVP, admin tooling may be partly file-based rather than fully in-app, as long as the content model is structured and maintainable.

---

## 25. Portability Requirements

This is a major product requirement.

The system must be:
- installable or runnable on the parent’s computer,
- transferable to the daughter’s computer,
- and usable with minimal setup complexity.

### Portability Success Criteria

A reasonable non-technical user should be able to move the app and run it on another computer without setting up complex infrastructure.

---

## 26. Offline / Local-First Requirements

The product should work without requiring internet for core usage.

### Core offline functions that must work:
- browsing courses/concepts
- taking tests
- saving answers
- submitting tests
- reviewing results
- viewing progress

If online capability is added later, offline-first behavior should remain intact.

---

## 27. Non-Functional Requirements

## 27.1 Performance
- Core screens should load quickly.
- Navigation between questions should feel responsive.
- Autosave should not noticeably interrupt the student experience.

## 27.2 Reliability
- In-progress answers should not be lost.
- Scoring should be consistent and deterministic.

## 27.3 Maintainability
- New courses and concepts should be addable over time.
- Content files should be structured and human-manageable.
- Code should be modular and easy to extend.

## 27.4 Usability
- Student experience should be simple and uncluttered.
- Navigation and submission should be obvious.
- Results and remediation should be easy to understand.

## 27.5 Extensibility
- The architecture should support future additions such as:
  - adaptive review,
  - richer question types,
  - and more advanced admin tools.

---

## 28. User Stories

## Student Stories
- As a student, I want to select a concept and take a full test on it.
- As a student, I want my answers saved as I go so I do not lose work.
- As a student, I want to move between questions before submitting.
- As a student, I want to see my score after finishing the test.
- As a student, I want to know which questions I got wrong.
- As a student, I want to learn how to solve questions I missed.
- As a student, I want mixed practice after several concepts so I remember older material.

## Parent/Admin Stories
- As a parent, I want to add more courses over time without redesigning the app.
- As a parent, I want to organize content by course, unit, and concept.
- As a parent, I want to review scores and weak areas.
- As a parent, I want a reusable system rather than manually producing every test.
- As a parent, I want the app to be portable between computers.

---

## 29. MVP Definition

The MVP is complete when the following are working end to end:

1. Course 2 exists in the app
2. At least a few concepts are loaded from structured content
3. Student can start a concept test
4. Student can enter answers and resume progress
5. Student can submit test and see score summary
6. Student can review wrong answers with explanations
7. Progress is stored locally
8. After three completed concept tests, a mixed reinforcement test is available
9. Parent/admin can extend content in a structured way

---

## 30. Future Enhancements

These are explicitly reserved for later phases:

- adaptive question selection
- mistake-bank driven review
- learn mode vs test mode
- richer explanations and hints
- AI-assisted explanation generation
- multi-student support
- cloud sync
- richer charts and analytics
- image/diagram/math rendering enhancements
- standards mapping
- assignment scheduling

---

## 31. Risks and Open Considerations

### Risks
- Poor concept granularity may make content hard to manage.
- Large question banks require disciplined authoring standards.
- Typed-answer validation can be tricky for equivalent answers.
- Mixed test logic may need refinement after real usage.

### Open considerations to resolve during architecture
- exact local storage approach,
- content file schema,
- packaging model,
- typed answer normalization rules,
- and admin editing workflow.

---

## 32. Success Metrics

The product will be considered successful if it enables:

- completion of concept tests across Course 2,
- visible score improvement over time,
- reduced repetition of past mistakes,
- easier addition of new concepts and courses,
- and consistent student use inside a stable app experience.

---

## 33. Next Step

The next step is to convert this PRD into a technical architecture specification covering:

- application architecture,
- repository structure,
- content schema,
- local storage strategy,
- test generation engine,
- scoring engine,
- portability/packaging strategy,
- and implementation prompts for Codex.
