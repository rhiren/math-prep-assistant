import { writeFile } from "node:fs/promises";

const contentRoot = "public/content/math/course3";
const testSetDir = `${contentRoot}/test-sets`;
const tutorialDir = `${contentRoot}/tutorials`;

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function reduce(n, d = 1) {
  if (d === 0) throw new Error("Zero denominator");
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(n, d);
  return { n: (sign * n) / divisor, d: Math.abs(d) / divisor };
}

function frac(n, d = 1) {
  const value = reduce(n, d);
  return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
}

function add(a, b) {
  return reduce(a.n * b.d + b.n * a.d, a.d * b.d);
}

function subtract(a, b) {
  return reduce(a.n * b.d - b.n * a.d, a.d * b.d);
}

function multiply(a, value) {
  return reduce(a.n * value, a.d);
}

function valueAt(m, b, x) {
  return add(multiply(m, x), { n: b, d: 1 });
}

function point(x, y) {
  return `(${x}, ${frac(y.n, y.d)})`;
}

function slopeText(m) {
  const value = reduce(m.n, m.d);
  if (value.n === 0) return "0x";
  if (value.n === 1 && value.d === 1) return "x";
  if (value.n === -1 && value.d === 1) return "-x";
  return `${frac(value.n, value.d)}x`;
}

function equation(m, b) {
  const mx = slopeText(m);
  if (m.n === 0) return `y = ${b}`;
  if (b === 0) return `y = ${mx}`;
  return b > 0 ? `y = ${mx} + ${b}` : `y = ${mx} - ${Math.abs(b)}`;
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
  if (longestCycle(sequence) > 3) return false;
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
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const sequence = shuffle(values, rng(hashSeed(`${seedText}:${attempt}`)));
    if (sequencePasses(sequence)) return sequence;
  }
  throw new Error(`Could not create answer sequence for ${seedText}`);
}

function placeCorrect(question, correctIndex) {
  const distractors = question.options.filter((option) => option !== question.correctAnswer);
  const ordered = shuffle(distractors, rng(hashSeed(question.id)));
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

const slopes = [
  { n: 1, d: 1 },
  { n: 2, d: 1 },
  { n: -1, d: 1 },
  { n: 1, d: 2 },
  { n: -1, d: 2 },
  { n: 3, d: 2 },
  { n: -2, d: 3 },
  { n: 4, d: 3 },
  { n: -3, d: 4 },
  { n: 5, d: 2 },
  { n: -4, d: 1 },
  { n: 2, d: 5 },
  { n: 0, d: 1 },
  { n: -5, d: 3 },
  { n: 3, d: 5 },
  { n: 7, d: 4 },
  { n: -7, d: 5 },
  { n: 5, d: 6 },
  { n: -3, d: 2 },
  { n: 6, d: 5 },
];

const intercepts = [3, -2, 5, -4, 0, 1, -6, 7, -1, 4, -5, 2, 6, -3, 8, -7, 9, -8, 10, -9];
const xs = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];

function equationOptions(m, b) {
  return fourUniqueOptions(equation(m, b), [
    equation({ n: -m.n, d: m.d }, b),
    equation(m, -b),
    equation({ n: m.n + m.d, d: m.d }, b),
    equation({ n: m.n - m.d, d: m.d }, b),
    equation(m, b + 1),
    equation(m, b - 1),
    equation({ n: m.d, d: m.n || 1 }, b),
    equation({ n: 0, d: 1 }, b),
  ]);
}

function numericOptions(correct, candidates) {
  return fourUniqueOptions(correct, candidates.map(String));
}

function slopeBetween(x1, y1, x2, y2) {
  return reduce(y2.n * y1.d - y1.n * y2.d, (x2 - x1) * y1.d * y2.d);
}

function tableRows(m, b, startX) {
  const values = [startX, startX + m.d, startX + 2 * m.d];
  return values.map((x) => `${x} -> ${frac(valueAt(m, b, x).n, valueAt(m, b, x).d)}`).join(", ");
}

function writeLinearBuilders(kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const m = slopes[(index * 7 + 3) % slopes.length];
    const b = intercepts[(index * 5 + 2) % intercepts.length];
    const x1 = xs[(index * 2 + 1) % xs.length];
    const x2 = x1 + (index % 4 + 1) * m.d;
    const y1 = valueAt(m, b, x1);
    const y2 = valueAt(m, b, x2);
    const d = difficulty(index, kind);
    const template = index % 10;
    const correctAnswer = equation(m, b);
    const options = equationOptions(m, b);
    const questionText = [
      `A line has slope ${frac(m.n, m.d)} and y-intercept ${b}. Which equation represents the line?`,
      `A line has slope ${frac(m.n, m.d)} and passes through ${point(x1, y1)}. Which equation is correct?`,
      `A table for a line includes ${tableRows(m, b, x1)}. Which equation matches the table?`,
      `A line passes through ${point(x1, y1)} and ${point(x2, y2)}. Which equation represents it?`,
      `A graph crosses the y-axis at ${point(0, { n: b, d: 1 })} and contains ${point(x2, y2)}. Which equation matches?`,
      `A savings account starts at ${b} dollars and changes by ${frac(m.n, m.d)} dollars each week. Which equation gives y after x weeks?`,
      `A student found slope ${frac(m.n, m.d)} from two points, then used ${point(x1, y1)} to find b = ${b}. What equation should they write?`,
      `Which equation has rate of change ${frac(m.n, m.d)} and output ${b} when input is 0?`,
      `A line contains ${point(0, { n: b, d: 1 })}, ${point(x1, y1)}, and ${point(x2, y2)}. Which rule gives y from x?`,
      `The change in y divided by change in x is ${frac(m.n, m.d)}, and the starting value is ${b}. Which equation models the relationship?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty: d,
      skillTags: ["linear-equations", "representations", "reasoning"],
      explanation: "Find the slope m and y-intercept b, then write the relationship in the form y = mx + b.",
    });
  });
}

function mixedReviewBuilders(kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const m = slopes[(index * 5 + 4) % slopes.length];
    const b = intercepts[(index * 7 + 1) % intercepts.length];
    const x1 = xs[(index * 3 + 2) % xs.length];
    const x2 = x1 + (index % 3 + 1) * m.d;
    const y1 = valueAt(m, b, x1);
    const y2 = valueAt(m, b, x2);
    const d = difficulty(index, kind);
    const template = index % 12;
    const slope = slopeBetween(x1, y1, x2, y2);
    const graphStep = `Start at ${b}, then use slope ${frac(m.n, m.d)}`;
    const questionTypes = [
      {
        questionText: `A line passes through ${point(x1, y1)} and ${point(x2, y2)}. What is its slope?`,
        correctAnswer: frac(slope.n, slope.d),
        options: numericOptions(frac(slope.n, slope.d), [
          frac(-slope.n, slope.d),
          frac(slope.d, slope.n || 1),
          frac(slope.n + slope.d, slope.d),
          String(b),
          String(x2 - x1),
        ]),
        explanation: "Slope is change in y divided by change in x.",
        skillTags: ["slope", "computation"],
      },
      {
        questionText: `In ${equation(m, b)}, what is the y-intercept?`,
        correctAnswer: String(b),
        options: numericOptions(String(b), [String(-b), frac(m.n, m.d), String(b + 1), String(b - 1), "0"]),
        explanation: "In y = mx + b, the y-intercept is b.",
        skillTags: ["y-intercept", "conceptual"],
      },
      {
        questionText: `Which equation has slope ${frac(m.n, m.d)} and y-intercept ${b}?`,
        correctAnswer: equation(m, b),
        options: equationOptions(m, b),
        explanation: "Put the slope in the m position and the y-intercept in the b position.",
        skillTags: ["linear-equations", "computation"],
      },
      {
        questionText: `A line has equation ${equation(m, b)}. Which graphing description is correct?`,
        correctAnswer: graphStep,
        options: fourUniqueOptions(graphStep, [
          `Start at ${-b}, then use slope ${frac(m.n, m.d)}`,
          `Start at ${b}, then use slope ${frac(-m.n, m.d)}`,
          `Start at ${frac(m.n, m.d)}, then use slope ${b}`,
          `Start at ${b + 1}, then use slope ${frac(m.n, m.d)}`,
        ]),
        explanation: "Graph by starting at the y-intercept and using slope as rise over run.",
        skillTags: ["graph", "visual"],
      },
      {
        questionText: `A table includes ${tableRows(m, b, x1)}. Which equation matches it?`,
        correctAnswer: equation(m, b),
        options: equationOptions(m, b),
        explanation: "The table has constant rate m and starting value b.",
        skillTags: ["tables", "representations"],
      },
      {
        questionText: `A line contains ${point(0, { n: b, d: 1 })} and ${point(x2, y2)}. Which equation represents the line?`,
        correctAnswer: equation(m, b),
        options: equationOptions(m, b),
        explanation: "The point with x = 0 gives b, and the second point confirms the slope.",
        skillTags: ["representations", "reasoning"],
      },
      {
        questionText: `Which point is the y-intercept of ${equation(m, b)}?`,
        correctAnswer: point(0, { n: b, d: 1 }),
        options: fourUniqueOptions(point(0, { n: b, d: 1 }), [
          point(b, { n: 0, d: 1 }),
          point(0, { n: -b, d: 1 }),
          point(1, valueAt(m, b, 1)),
          point(m.d, valueAt(m, b, m.d)),
          point(-1, valueAt(m, b, -1)),
          point(0, { n: b + 1, d: 1 }),
          point(0, { n: b - 1, d: 1 }),
        ]),
        explanation: "The y-intercept is always on the y-axis, so x = 0.",
        skillTags: ["y-intercept", "graph"],
      },
      {
        questionText: `A line starts at ${b} and changes by ${frac(m.n, m.d)} each step. What is the value when x = ${x2}?`,
        correctAnswer: frac(y2.n, y2.d),
        options: numericOptions(frac(y2.n, y2.d), [
          frac(valueAt({ n: -m.n, d: m.d }, b, x2).n, valueAt({ n: -m.n, d: m.d }, b, x2).d),
          frac(valueAt(m, -b, x2).n, valueAt(m, -b, x2).d),
          frac(add(y2, { n: 1, d: 1 }).n, add(y2, { n: 1, d: 1 }).d),
          frac(subtract(y2, { n: 1, d: 1 }).n, subtract(y2, { n: 1, d: 1 }).d),
        ]),
        explanation: "Substitute x into y = mx + b.",
        skillTags: ["evaluation", "linear-equations"],
      },
      {
        questionText: `Two representations show slopes ${frac(m.n, m.d)} and ${frac(m.n + m.d, m.d)}. Which has the greater rate of change?`,
        correctAnswer: frac(m.n + m.d, m.d),
        options: numericOptions(frac(m.n + m.d, m.d), [
          frac(m.n, m.d),
          frac(-m.n, m.d),
          String(b),
          "They are equal",
        ]),
        explanation: "Compare the slope values; the greater slope is the greater rate of change.",
        skillTags: ["compare-rates", "reasoning"],
      },
      {
        questionText: `A student says ${equation(m, b)} has slope ${b}. What is the student's mistake?`,
        correctAnswer: "They confused the y-intercept with the slope",
        options: fourUniqueOptions("They confused the y-intercept with the slope", [
          "They used the reciprocal of the slope",
          "They found the x-intercept correctly",
          "They changed the sign of every y-value",
          "They divided the intercept by the run",
        ]),
        explanation: "In y = mx + b, m is the slope and b is the y-intercept.",
        skillTags: ["error-analysis", "conceptual"],
      },
      {
        questionText: `A line has slope ${frac(m.n, m.d)} and passes through ${point(x1, y1)}. What is its y-intercept?`,
        correctAnswer: String(b),
        options: numericOptions(String(b), [String(-b), frac(m.n, m.d), String(x1), frac(y1.n, y1.d), String(b + 1)]),
        explanation: "Use y = mx + b with the given point, then solve for b.",
        skillTags: ["y-intercept", "reasoning"],
      },
      {
        questionText: `Which statement best explains why slope is constant on a line?`,
        correctAnswer: "Any two slope triangles on the line have the same rise/run ratio",
        options: fourUniqueOptions("Any two slope triangles on the line have the same rise/run ratio", [
          "The y-intercept changes each time x changes",
          "Every line must pass through the origin",
          "The run is always 1 for every line",
          "Only positive slopes have constant change",
        ]),
        explanation: "Slope triangles on the same line are similar, so their rise/run ratios match.",
        skillTags: ["constant-slope", "conceptual"],
      },
    ];
    const selected = questionTypes[template];
    return makeQuestion({
      id,
      questionText: selected.questionText,
      options: selected.options,
      correctAnswer: selected.correctAnswer,
      difficulty: d,
      skillTags: selected.skillTags,
      explanation: selected.explanation,
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

const packs = [
  {
    slug: "write-linear-equations-representations",
    conceptId: "concept-write-linear-equations-representations",
    title: "Write Linear Equations from Representations",
    description: "Write y = mx + b equations from tables, points, graphs, and contexts.",
    builder: writeLinearBuilders,
    tutorial: `# Write Linear Equations from Representations

## Big Idea

A linear relationship can be shown in many ways: a graph, a table, two points, an equation, or a context. To write the equation, find the slope and the y-intercept.

## What To Notice

- Slope is the constant change in y divided by the change in x.
- The y-intercept is the value of y when x is 0.
- If you know slope and one point, substitute into \`y = mx + b\` to find \`b\`.
- If you have a table, check that the rate of change is constant before writing a linear equation.
- In a context, the starting amount is usually the y-intercept.

## Worked Example

A line has slope \`3\` and passes through \`(2, 11)\`.

Use \`y = mx + b\`: \`11 = 3(2) + b\`, so \`11 = 6 + b\`, and \`b = 5\`.

The equation is \`y = 3x + 5\`.

## Common Mistake

Do not use the first y-value you see as the y-intercept unless the matching x-value is 0.

## Quick Self-Check

After writing an equation, substitute one known point back into it. If the equation gives the correct y-value, your slope and intercept fit that representation.
`,
  },
  {
    slug: "unit-3-mixed-review",
    conceptId: "concept-unit-3-mixed-review",
    title: "Unit 3 Mixed Review",
    description: "Review slope, y-intercept, linear equations, graphing, and multiple representations of lines.",
    builder: mixedReviewBuilders,
    tutorial: `# Unit 3 Mixed Review

## Big Idea

Lines, slopes, tables, graphs, equations, and contexts all describe the same kind of relationship: constant change.

## What To Review

- Slope means change in y divided by change in x.
- A proportional relationship graphs as a line through the origin.
- In \`y = mx + b\`, \`m\` is slope and \`b\` is the y-intercept.
- The y-intercept is the point where \`x = 0\`.
- To graph a line, plot the y-intercept first, then use the slope.
- To write an equation from a representation, find both \`m\` and \`b\`.

## Worked Example

A table has points \`(0, -2)\`, \`(1, 1)\`, and \`(2, 4)\`.

The slope is \`3\` because y increases by 3 when x increases by 1. The y-intercept is \`-2\`, so the equation is \`y = 3x - 2\`.

## Common Mistake

Do not mix up slope and starting value. Slope tells how the line changes; the y-intercept tells where it starts.

## Quick Self-Check

For any linear representation, ask: "What is the constant rate?" and "What happens when x is 0?"
`,
  },
];

for (const pack of packs) {
  await writeTutorial(pack.slug, pack.tutorial);
  for (const kind of ["core", "review"]) {
    await writeBank({
      slug: pack.slug,
      conceptId: pack.conceptId,
      kind,
      title: pack.title,
      description: pack.description,
      questions: finalize(pack.slug, kind, pack.builder(kind)),
    });
  }
}

console.log(`Generated ${packs.length} tutorials and ${packs.length * 2} assessment banks.`);
