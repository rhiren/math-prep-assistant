import { writeFile } from "node:fs/promises";

const contentRoot = "public/content/math/course3";
const testSetDir = `${contentRoot}/test-sets`;
const tutorialDir = `${contentRoot}/tutorials`;

function term(coefficient) {
  if (coefficient === 1) return "x";
  if (coefficient === -1) return "-x";
  return `${coefficient}x`;
}

function slopeEquation(m, b) {
  if (b === 0) return `y = ${term(m)}`;
  return b > 0 ? `y = ${term(m)} + ${b}` : `y = ${term(m)} - ${Math.abs(b)}`;
}

function signedTerm(coefficient, variable, isFirst = false) {
  const abs = Math.abs(coefficient);
  const body = abs === 1 ? variable : `${abs}${variable}`;
  if (isFirst) return coefficient < 0 ? `-${body}` : body;
  return coefficient < 0 ? ` - ${body}` : ` + ${body}`;
}

function standardEquation(a, b, c) {
  return `${signedTerm(a, "x", true)}${signedTerm(b, "y")} = ${c}`;
}

function fourUniqueOptions(correct, candidates) {
  const options = [correct];
  for (const candidate of candidates) {
    if (candidate !== correct && !options.includes(candidate)) {
      options.push(candidate);
    }
    if (options.length === 4) return options;
  }
  throw new Error(`Could not build options for ${correct}`);
}

function makeQuestion({ id, questionText, options, correctAnswer, difficulty, skillTags, explanation }) {
  if (new Set(options).size !== 4) {
    throw new Error(`${id} has duplicate options: ${options.join(" | ")}`);
  }
  if (!options.includes(correctAnswer)) {
    throw new Error(`${id} is missing correct answer: ${correctAnswer}`);
  }
  return {
    id,
    type: "multiple_choice",
    questionText,
    options,
    correctAnswer,
    difficulty,
    answerType: "number",
    skillTags,
    explanation,
  };
}

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let state = seed || 1;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function shuffle(values, random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function longestCycle(sequence) {
  let longest = 0;
  for (let start = 0; start < sequence.length; start += 1) {
    let length = 1;
    for (let index = start + 1; index < sequence.length; index += 1) {
      if (sequence[index] !== ((sequence[index - 1] + 1) % 4)) break;
      length += 1;
    }
    longest = Math.max(longest, length);
  }
  return longest;
}

function longestRun(sequence) {
  let longest = 0;
  let current = 0;
  let previous = -1;
  for (const value of sequence) {
    current = value === previous ? current + 1 : 1;
    previous = value;
    longest = Math.max(longest, current);
  }
  return longest;
}

function sequencePasses(sequence) {
  if (longestCycle(sequence) > 2) return false;
  if (longestRun(sequence) > 2) return false;
  for (let start = 0; start <= sequence.length - 8; start += 1) {
    const counts = [0, 0, 0, 0];
    for (const value of sequence.slice(start, start + 8)) counts[value] += 1;
    if (Math.max(...counts) > 4) return false;
  }
  return true;
}

function targetCounts(length) {
  if (length === 50) return [13, 13, 12, 12];
  if (length === 20) return [5, 5, 5, 5];
  const base = Math.floor(length / 4);
  return [0, 1, 2, 3].map((index) => base + (index < length % 4 ? 1 : 0));
}

function answerSequence(length, seedText) {
  const values = targetCounts(length).flatMap((count, index) => Array(count).fill(index));
  for (let attempt = 0; attempt < 100000; attempt += 1) {
    const sequence = shuffle(values, rng(hashSeed(`${seedText}:strict:${attempt}`)));
    if (sequencePasses(sequence)) return sequence;
  }
  throw new Error(`Could not create answer sequence for ${seedText}`);
}

function placeCorrect(question, correctIndex) {
  const distractors = question.options.filter((option) => option !== question.correctAnswer);
  const ordered = shuffle(distractors, rng(hashSeed(`${question.id}:strict-distractors`)));
  ordered.splice(correctIndex, 0, question.correctAnswer);
  return { ...question, options: ordered };
}

function difficulty(index, kind) {
  if (kind === "review") return index < 8 ? "scaffold" : "standard";
  if (index < 10) return "scaffold";
  if (index < 35) return "standard";
  return "challenge";
}

function finalize(slug, kind, builders) {
  const questions = builders.map((builder, index) =>
    builder(`course3-${slug}-${kind}-${String(index + 1).padStart(3, "0")}`),
  );
  const sequence = answerSequence(questions.length, `${slug}-${kind}`);
  return questions.map((question, index) => placeCorrect(question, sequence[index]));
}

const slopes = [-4, -3, -2, -1, 1, 2, 3, 4, 5];
const interceptPairs = [
  [-6, 2],
  [-5, 1],
  [-4, 4],
  [-3, 5],
  [-2, 3],
  [0, 6],
  [1, -5],
  [2, -4],
  [3, -1],
  [4, -6],
];

function parallelSystem(index) {
  const m = slopes[index % slopes.length];
  const [b1, b2] = interceptPairs[index % interceptPairs.length];
  return {
    m,
    b1,
    b2,
    eq1: slopeEquation(m, b1),
    eq2: slopeEquation(m, b2),
  };
}

function inconsistentStandard(index) {
  const a = [1, 2, 3, 4, -2, -3, 5, -4][index % 8];
  const b = [2, -3, 4, 1, 5, -1, -2, 3][index % 8];
  const c = [5, -7, 9, 4, 12, -6, 8, -10][index % 8];
  const factor = [2, -2, 3, -3, 4][index % 5];
  const offset = factor > 0 ? index % 2 + 1 : -(index % 2 + 1);
  return {
    a,
    b,
    c,
    factor,
    eq1: standardEquation(a, b, c),
    eq2: standardEquation(a * factor, b * factor, c * factor + offset),
    contradiction: `0 = ${offset}`,
    scaledFirst: standardEquation(a * factor, b * factor, c * factor),
  };
}

function oneSolutionSystem(index) {
  const m1 = slopes[index % slopes.length];
  const m2 = slopes[(index + 3) % slopes.length];
  const b1 = interceptPairs[index % interceptPairs.length][0];
  const b2 = interceptPairs[(index + 2) % interceptPairs.length][1];
  return `${slopeEquation(m1, b1)} and ${slopeEquation(m2 === m1 ? m2 + 1 : m2, b2)}`;
}

function infiniteSystem(index) {
  const a = [1, 2, -3, 4, -5][index % 5];
  const b = [2, -1, 4, 3, -2][index % 5];
  const c = [6, -8, 10, 12, -15][index % 5];
  const factor = [2, -2, 3, -3, 4][index % 5];
  return `${standardEquation(a, b, c)} and ${standardEquation(a * factor, b * factor, c * factor)}`;
}

function noSolutionOptions() {
  return fourUniqueOptions("no solution", [
    "one solution",
    "infinitely many solutions",
    "two solutions",
    "the solution is (0, 0)",
  ]);
}

function builders(kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const d = difficulty(index, kind);
    const template = index % 10;
    const parallel = parallelSystem(index * 5 + 1);
    const inconsistent = inconsistentStandard(index * 7 + 2);

    if (template === 0) {
      return makeQuestion({
        id,
        questionText: `How many solutions does the system ${parallel.eq1} and ${parallel.eq2} have?`,
        options: noSolutionOptions(),
        correctAnswer: "no solution",
        difficulty: d,
        skillTags: ["systems", "no-solution", "parallel-lines"],
        explanation: "The lines have the same slope but different y-intercepts, so they are parallel and never intersect.",
      });
    }

    if (template === 1) {
      const correctAnswer = "same slope and different y-intercepts";
      return makeQuestion({
        id,
        questionText: `Why does ${parallel.eq1} and ${parallel.eq2} have no solution?`,
        options: fourUniqueOptions(correctAnswer, [
          "same slope and same y-intercept",
          "different slopes and different y-intercepts",
          "different slopes and the same y-intercept",
          "both lines pass through the origin",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "slope-intercept"],
        explanation: "Parallel lines have equal slopes. Different y-intercepts mean they are distinct lines, so they do not meet.",
      });
    }

    if (template === 2) {
      return makeQuestion({
        id,
        questionText: `Elimination gives ${inconsistent.contradiction} for the system ${inconsistent.eq1} and ${inconsistent.eq2}. What does that mean?`,
        options: noSolutionOptions(),
        correctAnswer: "no solution",
        difficulty: d,
        skillTags: ["systems", "no-solution", "contradiction"],
        explanation: "A false statement like 0 = 1 means no ordered pair can satisfy both equations.",
      });
    }

    if (template === 3) {
      const correctAnswer = inconsistent.contradiction;
      return makeQuestion({
        id,
        questionText: `Scale the first equation in ${inconsistent.eq1} and ${inconsistent.eq2} by ${inconsistent.factor}, then subtract. Which result shows the system is inconsistent?`,
        options: fourUniqueOptions(correctAnswer, [
          "0 = 0",
          "x = 0",
          "y = 0",
          `${inconsistent.a}x = ${inconsistent.c}`,
          `${inconsistent.b}y = ${inconsistent.c}`,
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "elimination"],
        explanation: "After equivalent scaling, the variable terms match but the constants do not. Subtracting leaves a false statement.",
      });
    }

    if (template === 4) {
      const correctAnswer = `${parallel.eq1} and ${parallel.eq2}`;
      return makeQuestion({
        id,
        questionText: "Which system has no solution?",
        options: fourUniqueOptions(correctAnswer, [
          oneSolutionSystem(index),
          infiniteSystem(index),
          `${slopeEquation(parallel.m + 1, parallel.b1)} and ${slopeEquation(parallel.m, parallel.b2)}`,
          `${slopeEquation(parallel.m, parallel.b1)} and ${slopeEquation(parallel.m, parallel.b1)}`,
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "classification"],
        explanation: "The no-solution system is the one with parallel lines: same slope, different intercepts.",
      });
    }

    if (template === 5) {
      const correctAnswer = "parallel lines that never intersect";
      return makeQuestion({
        id,
        questionText: `On a graph, what would the solution picture look like for ${parallel.eq1} and ${parallel.eq2}?`,
        options: fourUniqueOptions(correctAnswer, [
          "one crossing point",
          "the same line drawn twice",
          "a vertical line crossing a horizontal line",
          "two lines crossing at the y-axis",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "graph"],
        explanation: "A system has no solution when its two lines are parallel and distinct, so there is no intersection point.",
      });
    }

    if (template === 6) {
      const correctAnswer = "no; parallel lines do not share any ordered pair";
      return makeQuestion({
        id,
        questionText: `A student says ${parallel.eq1} and ${parallel.eq2} must share at least one point because both are lines. Is the student correct?`,
        options: fourUniqueOptions(correctAnswer, [
          "yes; any two lines have exactly one solution",
          "yes; the y-intercepts are both solutions",
          "no; different slopes are required for no solution",
          "no; the system has infinitely many solutions",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "misconception"],
        explanation: "Distinct parallel lines never intersect, so they do not share an ordered-pair solution.",
      });
    }

    if (template === 7) {
      const correctAnswer = "the coefficients are proportional, but the constants are not";
      return makeQuestion({
        id,
        questionText: `In ${inconsistent.eq1} and ${inconsistent.eq2}, what algebraic sign points to no solution?`,
        options: fourUniqueOptions(correctAnswer, [
          "the coefficients and constants are all proportional",
          "only the constants are proportional",
          "the x-coefficients are both positive",
          "the equations use two variables",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "structure"],
        explanation: "Proportional variable coefficients with nonproportional constants describe parallel distinct lines.",
      });
    }

    if (template === 8) {
      const correctAnswer = "infinitely many solutions";
      return makeQuestion({
        id,
        questionText: `How is a system that simplifies to 0 = 0 different from ${parallel.eq1} and ${parallel.eq2}?`,
        options: fourUniqueOptions(correctAnswer, [
          "no solution",
          "exactly one solution",
          "two solutions",
          "a solution only when x = 0",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "no-solution", "compare-solution-types"],
        explanation: "The statement 0 = 0 means the equations represent the same line. A no-solution system simplifies to a false statement.",
      });
    }

    const correctAnswer = "the same rate but different starting values";
    return makeQuestion({
      id,
      questionText: `Two plans are modeled by ${parallel.eq1} and ${parallel.eq2}. What context clue would match no solution?`,
      options: fourUniqueOptions(correctAnswer, [
        "different rates that eventually meet",
        "the exact same rate and starting value",
        "one plan starts at zero and the other starts later",
        "the two plans meet at every time value",
      ]),
      correctAnswer,
      difficulty: d,
      skillTags: ["systems", "no-solution", "context"],
      explanation: "Same rate and different starting values means the two quantities stay the same distance apart forever.",
    });
  });
}

async function writeBank({ slug, conceptId, kind, title, description, questions }) {
  await writeFile(
    `${testSetDir}/course3-${slug}-${kind}.json`,
    `${JSON.stringify(
      {
        testId: `course3-${slug}-${kind}`,
        conceptId,
        type: kind === "core" ? "concept" : "review",
        title: `${title} ${kind === "core" ? "Core Test" : "Review Test"}`,
        description,
        questions,
      },
      null,
      2,
    )}\n`,
  );
}

async function writeTutorial(slug, body) {
  await writeFile(`${tutorialDir}/concept-${slug}.md`, body);
}

const pack = {
  slug: "systems-no-solution",
  conceptId: "concept-systems-no-solution",
  title: "Systems with No Solution",
  description: "Recognize systems whose lines are parallel and therefore have no ordered-pair solution.",
  tutorial: `# Systems with No Solution

## Big Idea

A system has no solution when there is no ordered pair that makes both equations true. For two linear equations, this happens when the graphs are parallel lines.

## What To Notice

- Parallel lines have the same slope.
- Distinct parallel lines have different y-intercepts.
- Because they never intersect, they have no shared ordered pair.
- In elimination, a no-solution system simplifies to a false statement such as \`0 = 5\`.
- Do not confuse no solution with infinitely many solutions. Infinitely many solutions happen when both equations are the same line.

## Worked Example

Consider:

\`y = 2x + 1\`

\`y = 2x - 4\`

Both lines have slope \`2\`, so they rise at the same rate.

Their y-intercepts are different: \`1\` and \`-4\`.

The lines are parallel and never meet, so the system has no solution.

## Algebra Check

The same idea can appear during elimination:

\`2x + 3y = 7\`

\`4x + 6y = 20\`

Double the first equation:

\`4x + 6y = 14\`

Compare that with \`4x + 6y = 20\`. The left sides match, but the constants disagree. Subtracting gives \`0 = 6\`, which is false.

That false statement means no ordered pair can satisfy both equations.

## Common Mistake

Do not answer \`0\` when elimination gives \`0 = 6\`. The result is not a value of x or y; it is evidence that the system has no solution.

## Quick Self-Check

Same slope and different intercepts means no solution. Same slope and same intercept means infinitely many solutions.
`,
};

await writeTutorial(pack.slug, pack.tutorial);
for (const kind of ["core", "review"]) {
  await writeBank({
    slug: pack.slug,
    conceptId: pack.conceptId,
    kind,
    title: pack.title,
    description: pack.description,
    questions: finalize(pack.slug, kind, builders(kind)),
  });
}

console.log(`Generated ${pack.title} tutorial and 2 assessment banks.`);
