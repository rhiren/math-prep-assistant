# Math Concept Mastery App

Local-first math practice scaffold built with React, Vite, and TypeScript.

The current scaffold includes:
- Course, unit, concept, question, session, attempt, and progress models
- External manifest-driven content loading for Course 2 sample content
- Deterministic concept test generation with a future hook for difficulty-based selection
- Submit-only scoring with answer normalization
- IndexedDB persistence for sessions, attempts, and progress
- Minimal student-facing UI for course browsing, test-taking, results, and progress

## Requirements

- Node.js 18+ recommended
- npm

## Fresh Setup

Install dependencies:

```bash
npm install
```

## Start the Web App

Run the local development server:

```bash
npm run dev
```

Vite will print a local URL, typically:

```text
http://localhost:5173
```

Open that URL in your browser.

## Other Useful Commands

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```text
src/
├─ app/                  App router and global styles
├─ components/           Reusable UI pieces
├─ domain/               Core TypeScript models
├─ engines/              Test generation, scoring, and mixed eligibility logic
├─ routes/               Page-level route components
├─ services/             Higher-level app services and contracts
├─ state/                App service bootstrapping/provider
├─ storage/              IndexedDB storage service and repositories
├─ test/                 Vitest test suite
└─ utils/                Shared helpers

content/
├─ manifest/             Course manifests
├─ test-sets/            One or more test JSON files per concept
└─ tutorials/            Tutorial markdown files by concept
```

## Content

Sample content is stored locally in:

- `content/manifest/course2_manifest.json`
- `content/test-sets/`
- `content/tutorials/`

Questions must use globally unique IDs across all test sets. Concepts automatically
show `Coming Soon` until a matching test-set JSON file is present.

## Persistence

The app stores runtime data in IndexedDB:

- `sessions`
- `attempts`
- `progress`

If older `localStorage` data exists from the previous scaffold version, it is migrated to IndexedDB on first load.

## Current Scope

This is an architecture scaffold, not the full product. The main implemented flow is:

1. Browse Course 2
2. Open a concept
3. Start a concept test
4. Save answers locally
5. Submit the test
6. Review results and incorrect answers
7. View concept progress and mixed-test eligibility

## Next Likely Extensions

- Expand the content schema and question banks
- Add richer test generation rules by difficulty
- Improve typed-answer equivalence rules
- Implement full mixed reinforcement test generation
- Extend remediation and progress analytics
