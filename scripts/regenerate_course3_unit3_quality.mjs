import { writeFile } from "node:fs/promises";

const outputDir = "public/content/math/course3/test-sets";

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function reduce(n, d = 1) {
  if (d === 0) {
    throw new Error("Zero denominator");
  }
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(n, d);
  return { n: (sign * n) / divisor, d: Math.abs(d) / divisor };
}

function frac(n, d = 1) {
  const value = reduce(n, d);
  if (value.d === 1) {
    return String(value.n);
  }
  return `${value.n}/${value.d}`;
}

function eq(m) {
  const reduced = reduce(m.n, m.d);
  if (reduced.n === 0) return "y = 0";
  if (reduced.n === reduced.d) return "y = x";
  if (reduced.n === -reduced.d) return "y = -x";
  return `y = ${frac(reduced.n, reduced.d)}x`;
}

function rateText(rate, yUnit, xUnit) {
  return `${frac(rate.n, rate.d)} ${yUnit} per ${xUnit}`;
}

function valueAt(m, x) {
  return reduce(m.n * x, m.d);
}

function addFractions(a, b) {
  return reduce(a.n * b.d + b.n * a.d, a.d * b.d);
}

function multiplyFraction(a, factor) {
  return reduce(a.n * factor, a.d);
}

function compareFractions(a, b) {
  return a.n * b.d - b.n * a.d;
}

function pointText(x, y) {
  return `(${x}, ${frac(y.n, y.d)})`;
}

function linePoints(m, x1, x2, b = { n: 0, d: 1 }) {
  return [
    { x: x1, y: addFractions(valueAt(m, x1), b) },
    { x: x2, y: addFractions(valueAt(m, x2), b) },
  ];
}

function makeQuestion({ id, questionText, options, correctAnswer, difficulty, skillTags, explanation }) {
  const uniqueOptions = new Set(options);
  if (uniqueOptions.size !== 4) {
    throw new Error(`${id} has non-unique options: ${options.join(" | ")}`);
  }
  if (!uniqueOptions.has(correctAnswer)) {
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
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function longestSequentialCycle(seq) {
  let longest = 0;
  for (let start = 0; start < seq.length; start += 1) {
    let length = 1;
    for (let index = start + 1; index < seq.length; index += 1) {
      if (seq[index] !== ((seq[index - 1] + 1) % 4)) break;
      length += 1;
    }
    longest = Math.max(longest, length);
  }
  return longest;
}

function longestSameRun(seq) {
  let longest = 0;
  let run = 0;
  let previous = -1;
  for (const value of seq) {
    run = value === previous ? run + 1 : 1;
    previous = value;
    longest = Math.max(longest, run);
  }
  return longest;
}

function passesSequence(seq) {
  if (longestSequentialCycle(seq) > 2) return false;
  if (longestSameRun(seq) > 2) return false;
  for (let start = 0; start <= seq.length - 8; start += 1) {
    const counts = [0, 0, 0, 0];
    for (const value of seq.slice(start, start + 8)) counts[value] += 1;
    if (Math.max(...counts) > 4) return false;
  }
  return true;
}

function targetCounts(length) {
  if (length === 20) return [5, 5, 5, 5];
  if (length === 50) return [13, 13, 12, 12];
  const base = Math.floor(length / 4);
  return [0, 1, 2, 3].map((index) => base + (index < length % 4 ? 1 : 0));
}

function answerSequence(length, seedText) {
  const values = targetCounts(length).flatMap((count, index) => Array(count).fill(index));
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    const sequence = shuffle(values, rng(hashSeed(`${seedText}:${attempt}`)));
    if (passesSequence(sequence)) return sequence;
  }
  throw new Error(`Could not create answer sequence for ${seedText}`);
}

function placeCorrectOptions(question, targetIndex) {
  const distractors = question.options.filter((option) => option !== question.correctAnswer);
  const orderedDistractors = shuffle(distractors, rng(hashSeed(question.id)));
  orderedDistractors.splice(targetIndex, 0, question.correctAnswer);
  return { ...question, options: orderedDistractors };
}

function finalizeQuestions(slug, kind, builders) {
  const questions = builders.map((build, index) =>
    build(`course3-${slug}-${kind}-${String(index + 1).padStart(3, "0")}`),
  );
  const sequence = answerSequence(questions.length, `${slug}-${kind}`);
  return questions.map((question, index) => placeCorrectOptions(question, sequence[index]));
}

function difficultyFor(index, kind) {
  if (kind === "core") {
    if (index < 10) return "scaffold";
    if (index < 35) return "standard";
    return "challenge";
  }
  return index < 8 ? "scaffold" : "standard";
}

const slopes = [
  { n: 2, d: 1 },
  { n: 3, d: 1 },
  { n: 1, d: 2 },
  { n: 2, d: 3 },
  { n: 3, d: 4 },
  { n: 5, d: 2 },
  { n: -2, d: 1 },
  { n: -3, d: 2 },
  { n: 4, d: 5 },
  { n: 5, d: 3 },
  { n: -1, d: 2 },
  { n: 7, d: 4 },
  { n: 0, d: 1 },
  { n: -5, d: 4 },
  { n: 6, d: 5 },
  { n: -4, d: 3 },
  { n: 1, d: 1 },
  { n: -1, d: 1 },
  { n: 8, d: 3 },
  { n: -5, d: 2 },
  { n: 3, d: 5 },
  { n: -2, d: 5 },
  { n: 9, d: 4 },
  { n: -7, d: 3 },
  { n: 4, d: 1 },
  { n: -3, d: 1 },
  { n: 5, d: 6 },
  { n: -6, d: 5 },
  { n: 7, d: 2 },
  { n: -8, d: 3 },
  { n: 2, d: 5 },
  { n: -4, d: 5 },
  { n: 11, d: 6 },
  { n: -9, d: 2 },
  { n: 6, d: 7 },
  { n: -7, d: 4 },
  { n: 10, d: 3 },
  { n: -1, d: 3 },
  { n: 3, d: 2 },
  { n: -5, d: 3 },
  { n: 7, d: 5 },
  { n: -9, d: 4 },
  { n: 12, d: 5 },
  { n: -11, d: 3 },
  { n: 1, d: 4 },
  { n: -3, d: 5 },
  { n: 5, d: 4 },
  { n: -2, d: 3 },
  { n: 9, d: 5 },
  { n: -7, d: 6 },
];

const contexts = [
  ["miles", "hour", "trail distance"],
  ["dollars", "ticket", "ticket cost"],
  ["pages", "minute", "reading pace"],
  ["cups", "batch", "recipe"],
  ["gallons", "minute", "water flow"],
  ["points", "game", "scoring average"],
];

function slopeOptions(m) {
  const correct = frac(m.n, m.d);
  const candidates = [
    frac(m.d, m.n || 1),
    frac(-m.n, m.d),
    frac(m.n + m.d, m.d),
    frac(m.n - m.d, m.d),
    frac(m.n, m.d + 1),
    frac(m.n + 1, m.d),
    "0",
    "1",
    "-1",
    "2",
    "-2",
    "1/2",
    "-1/2",
    "3/2",
    "-3/2",
  ];
  return fourUniqueOptions(correct, candidates);
}

function equationOptions(m) {
  const correct = eq(m);
  const candidates = [
    eq({ n: m.d, d: m.n || 1 }),
    eq({ n: -m.n, d: m.d }),
    eq({ n: m.n + m.d, d: m.d }),
    eq({ n: m.n, d: m.d + 1 }),
    `y = ${frac(m.n, m.d)}x + 1`,
    "y = x",
    "y = -x",
    "y = 0",
    "y = 2x",
    "y = -2x",
    "y = 1/2x",
    "y = -1/2x",
  ];
  return fourUniqueOptions(correct, candidates);
}

function fourUniqueOptions(correct, candidates) {
  const options = [correct];
  for (const candidate of candidates) {
    if (candidate !== correct && !options.includes(candidate)) {
      options.push(candidate);
    }
    if (options.length === 4) {
      return options;
    }
  }
  throw new Error(`Could not build four unique options for ${correct}`);
}

function writeBank({ slug, conceptId, type, title, description, questions }) {
  return writeFile(
    `${outputDir}/course3-${slug}-${type}.json`,
    `${JSON.stringify(
      {
        testId: `course3-${slug}-${type}`,
        conceptId,
        type: type === "core" ? "concept" : "review",
        title,
        description,
        questions,
      },
      null,
      2,
    )}\n`,
  );
}

function proportionalRelationships(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const m = slopes[index % slopes.length];
    const x = [2, 3, 4, 5, 6, 8, 10][index % 7];
    const y = valueAt(m, x);
    const template = index % 8;
    const correctAnswer = eq(m);
    const options = equationOptions(m);
    const questionText = [
      `A proportional relationship includes the origin and ${pointText(x, y)}. Which equation represents the graph?`,
      `A line through the origin also passes through ${pointText(x, y)}. Which equation matches this proportional relationship?`,
      `The graph of a proportional relationship contains ${pointText(x, y)}. What is its equation?`,
      `A table for a proportional relationship includes x = ${x} and y = ${frac(y.n, y.d)}. Which equation is true for all rows?`,
      `A recipe scales proportionally: ${x} batches use ${frac(y.n, y.d)} cups. Which equation gives y cups for x batches?`,
      `Which equation has a graph through both (0, 0) and ${pointText(x, y)}?`,
      `A proportional graph rises by ${frac(y.n, y.d)} when x increases from 0 to ${x}. Which equation represents it?`,
      `A student says the constant of proportionality is y divided by x. For ${pointText(x, y)}, which equation follows?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["conceptual", "graph", "reasoning"],
      explanation: "A proportional relationship goes through the origin and has equation y = mx, where m = y/x.",
    });
  });
}

function understandSlopeRate(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const [yUnit, xUnit, context] = contexts[index % contexts.length];
    const m = slopes[(index * 2 + 3) % slopes.length];
    const dx = [2, 3, 4, 5, 6][index % 5] * m.d;
    const dy = (m.n * dx) / m.d;
    const template = index % 9;
    const correctAnswer = rateText(m, yUnit, xUnit);
    const options = fourUniqueOptions(correctAnswer, [
      rateText({ n: dx, d: dy || 1 }, yUnit, xUnit),
      rateText({ n: -m.n, d: m.d }, yUnit, xUnit),
      rateText({ n: m.n + m.d, d: m.d }, yUnit, xUnit),
      rateText({ n: m.n - m.d, d: m.d }, yUnit, xUnit),
      rateText({ n: m.n + 1, d: m.d }, yUnit, xUnit),
      rateText({ n: m.n, d: m.d + 1 }, yUnit, xUnit),
      rateText({ n: 0, d: 1 }, yUnit, xUnit),
      rateText({ n: 1, d: 1 }, yUnit, xUnit),
      rateText({ n: -1, d: 1 }, yUnit, xUnit),
    ]);
    const questionText = [
      `In a ${context} situation, y changes by ${dy} ${yUnit} while x changes by ${dx} ${xUnit}s. What is the rate of change?`,
      `A linear relationship changes from x = 0 to x = ${dx}, while y changes from 0 to ${dy}. What is the slope?`,
      `A constant-rate table has change in y = ${dy} and change in x = ${dx}. Which rate describes it?`,
      `For every ${dx} ${xUnit}s, the amount changes by ${dy} ${yUnit}. What is the unit rate?`,
      `A graph has rise ${dy} and run ${dx}. What is its rate of change?`,
      `A student computes slope as change in y divided by change in x. For change ${dy}/${dx}, what rate should they get?`,
      `The ${context} graph has a constant slope. If moving right ${dx} changes y by ${dy}, what is the slope?`,
      `Which rate matches a line whose y-value changes by ${dy} when x increases by ${dx}?`,
      `A situation loses or gains ${Math.abs(dy)} ${yUnit} over ${dx} ${xUnit}s. Using the sign, what is the rate of change?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["conceptual", "application", "computation"],
      explanation: "Slope and rate of change both mean change in y divided by change in x.",
    });
  });
}

function findSlopeFromGraphs(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const m = slopes[(index * 3 + 1) % slopes.length];
    const startX = [-6, -4, -3, -2, -1, 0, 1][index % 7];
    const run = [2, 3, 4, 5, 6][index % 5] * m.d;
    const [p1, p2] = linePoints(m, startX, startX + run, { n: index % 4 - 2, d: 1 });
    const template = index % 8;
    const correctAnswer = `slope = ${frac(m.n, m.d)}`;
    const options = slopeOptions(m).map((value) => `slope = ${value}`);
    const questionText = [
      `On a coordinate graph, a line passes through ${pointText(p1.x, p1.y)} and ${pointText(p2.x, p2.y)}. What is the slope?`,
      `A graphed line contains the points ${pointText(p1.x, p1.y)} and ${pointText(p2.x, p2.y)}. What is rise over run?`,
      `From ${pointText(p1.x, p1.y)} to ${pointText(p2.x, p2.y)}, what is the slope of the line?`,
      `A student marks two points on a line: ${pointText(p1.x, p1.y)} and ${pointText(p2.x, p2.y)}. Which slope is correct?`,
      `The run between two graph points is ${p2.x - p1.x}; the rise is ${frac(p2.y.n * p1.y.d - p1.y.n * p2.y.d, p2.y.d * p1.y.d)}. What is the slope?`,
      `A line falls or rises from ${pointText(p1.x, p1.y)} to ${pointText(p2.x, p2.y)}. Which value is change in y over change in x?`,
      `Which slope matches a line passing through ${pointText(p1.x, p1.y)} and ${pointText(p2.x, p2.y)} on the graph?`,
      `Find the constant steepness of the graphed line through ${pointText(p1.x, p1.y)} and ${pointText(p2.x, p2.y)}.`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["graph", "computation", "visual"],
      explanation: "Use slope = change in y divided by change in x between the two graph points.",
    });
  });
}

function findSlopeTablesPoints(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const m = slopes[(index * 5 + 2) % slopes.length];
    const startX = [0, 1, 2, -2, -1][index % 5];
    const step = [1, 2, 3, 4][index % 4] * m.d;
    const b = { n: index % 5 - 2, d: 1 };
    const p1 = { x: startX, y: addFractions(valueAt(m, startX), b) };
    const p2 = { x: startX + step, y: addFractions(valueAt(m, startX + step), b) };
    const p3 = { x: startX + 2 * step, y: addFractions(valueAt(m, startX + 2 * step), b) };
    const template = index % 8;
    const correctAnswer = `slope = ${frac(m.n, m.d)}`;
    const options = slopeOptions(m).map((value) => `slope = ${value}`);
    const questionText = [
      `The table shows points ${pointText(p1.x, p1.y)}, ${pointText(p2.x, p2.y)}, and ${pointText(p3.x, p3.y)}. What is the slope?`,
      `A table lists x-values ${p1.x}, ${p2.x}, ${p3.x} and y-values ${frac(p1.y.n, p1.y.d)}, ${frac(p2.y.n, p2.y.d)}, ${frac(p3.y.n, p3.y.d)}. What is the rate of change?`,
      `Use the points ${pointText(p1.x, p1.y)} and ${pointText(p2.x, p2.y)} from a table. Which slope is correct?`,
      `A linear table increases x by ${step} each row. From the first to second row, what is change in y over change in x?`,
      `Which slope matches the ordered pairs ${pointText(p1.x, p1.y)} and ${pointText(p3.x, p3.y)}?`,
      `A table represents a line. Comparing ${pointText(p2.x, p2.y)} to ${pointText(p3.x, p3.y)}, what is the slope?`,
      `A student says to divide change in y by change in x. For this table, what slope should they find? ${pointText(p1.x, p1.y)}, ${pointText(p2.x, p2.y)}, ${pointText(p3.x, p3.y)}`,
      `The points ${pointText(p1.x, p1.y)}, ${pointText(p2.x, p2.y)}, and ${pointText(p3.x, p3.y)} lie on one line. What is its constant slope?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["computation", "reasoning"],
      explanation: "In a linear table, the slope is the same for every pair of rows: change in y divided by change in x.",
    });
  });
}

function compareRates(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const a = slopes[(index * 2 + 4) % slopes.length];
    let b = slopes[(index * 3 + 7) % slopes.length];
    if (compareFractions(a, b) === 0) b = { n: b.n + 1, d: b.d };
    const ax = [2, 3, 4, 5][index % 4] * a.d;
    const bx = [2, 3, 4, 5][(index + 1) % 4] * b.d;
    const ay = (a.n * ax) / a.d;
    const by = (b.n * bx) / b.d;
    const comparison = compareFractions(a, b);
    const winner = comparison > 0 ? "Plan A" : "Plan B";
    const template = index % 8;
    const correctAnswer = `${winner} has the greater rate of change`;
    const misconception = [
      "Only the run should be compared",
      "Only the total change in y should be compared",
      "The plan with the larger input value must have the greater rate",
      "The plan with the larger output change must have the greater rate",
    ][index % 4];
    const options = [
      correctAnswer,
      `${winner === "Plan A" ? "Plan B" : "Plan A"} has the greater rate of change`,
      "The two rates are equal",
      misconception,
    ];
    const questionText = [
      `Plan A changes by ${ay} units for every ${ax} steps. Plan B changes by ${by} units for every ${bx} steps. Which statement is true?`,
      `Compare two slopes: A has rise ${ay} and run ${ax}; B has rise ${by} and run ${bx}. Which is greater?`,
      `A table for Plan A has rate ${frac(a.n, a.d)}. Plan B changes ${by} units over ${bx} steps. Which rate is larger?`,
      `Plan A is represented by ${eq(a)}. Plan B has rate ${frac(b.n, b.d)}. Which plan changes faster?`,
      `A graph for Plan A rises ${ay} over a run of ${ax}. A graph for Plan B rises ${by} over a run of ${bx}. Which slope is greater?`,
      `Two proportional relationships are being compared. A: ${ax} input gives ${ay} output. B: ${bx} input gives ${by} output. Which has the greater constant of proportionality?`,
      `Which plan is steeper: Plan A with slope ${frac(a.n, a.d)}, or Plan B with slope ${frac(b.n, b.d)}?`,
      `A student compares ${ay}/${ax} with ${by}/${bx}. Which conclusion about the rates is correct?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["application", "reasoning", "computation"],
      explanation: "Compare rates by writing both as change in y divided by change in x, then compare the simplified values.",
    });
  });
}

function similarTriangles(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const m = slopes[(index * 4 + 5) % slopes.length];
    const scale = [2, 3, 4, 5][index % 4];
    const run = Math.abs(m.d) * [1, 2, 3][index % 3];
    const rise = (m.n * run) / m.d;
    const bigRun = run * scale;
    const bigRise = rise * scale;
    const template = index % 8;
    const correctAnswer = `Both triangles show slope ${frac(m.n, m.d)}`;
    const options = [
      correctAnswer,
      `The larger triangle has slope ${frac(bigRun, bigRise || 1)}`,
      `The slope changes from ${frac(rise, run)} to ${frac(bigRise + 1, bigRun)}`,
      "Similar slope triangles cannot be used to find slope",
    ];
    const questionText = [
      `A line has one slope triangle with rise ${rise} and run ${run}, and a larger slope triangle with rise ${bigRise} and run ${bigRun}. What does this show?`,
      `Two slope triangles on the same line are similar. The small triangle is rise ${rise}, run ${run}; the large triangle is rise ${bigRise}, run ${bigRun}. What slope do both give?`,
      `A student draws two right triangles under a line. Their rise/run ratios are ${rise}/${run} and ${bigRise}/${bigRun}. What conclusion is valid?`,
      `Why do the triangles with legs (${run}, ${rise}) and (${bigRun}, ${bigRise}) give the same steepness?`,
      `A graph uses a small slope triangle and a scaled copy. Which statement matches rise ${rise}, run ${run}, rise ${bigRise}, run ${bigRun}?`,
      `The larger slope triangle is ${scale} times the smaller one. What happens to the slope?`,
      `For a line, one triangle has vertical change ${rise} and horizontal change ${run}. A similar triangle has ${bigRise} and ${bigRun}. Which slope is represented?`,
      `A student worries the larger triangle should have a larger slope. Which answer explains the correct slope?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["conceptual", "graph", "reasoning"],
      explanation: "Similar slope triangles have proportional rise and run, so the ratio rise/run stays the same.",
    });
  });
}

function equationsYEqualsMx(slug, kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const difficulty = difficultyFor(index, kind);
    const m = slopes[(index * 6 + 1) % slopes.length];
    const x = [2, 3, 4, 5, 6, 8][index % 6] * m.d;
    const y = valueAt(m, x);
    const template = index % 9;
    const correctAnswer = eq(m);
    const options = equationOptions(m);
    const questionText = [
      `A line goes through the origin and the point ${pointText(x, y)}. Which equation has the form y = mx for this line?`,
      `For a line through (0, 0), the point ${pointText(x, y)} is on the graph. What is m in y = mx?`,
      `Which y = mx equation contains ${pointText(x, y)}?`,
      `A proportional relationship has output ${frac(y.n, y.d)} when input is ${x}. Which equation models it?`,
      `A graph through the origin has slope ${frac(m.n, m.d)}. Which equation matches?`,
      `A table for y = mx includes the row x = ${x}, y = ${frac(y.n, y.d)}. Which equation is correct?`,
      `The constant multiplier from x to y is ${frac(m.n, m.d)}. Which equation should be written?`,
      `A student divides ${frac(y.n, y.d)} by ${x} to find m. Which equation follows?`,
      `Which equation represents a line through the origin with rate of change ${frac(m.n, m.d)}?`,
    ][template];
    return makeQuestion({
      id,
      questionText,
      options,
      correctAnswer,
      difficulty,
      skillTags: ["computation", "conceptual"],
      explanation: "In y = mx, m is the slope or constant of proportionality. Use m = y/x for a point on the line.",
    });
  });
}

const packs = [
  {
    slug: "proportional-relationships-as-lines",
    conceptId: "concept-proportional-relationships-as-lines",
    description: "Connect proportional relationships to lines through the origin and equations of the form y = mx.",
    title: "Proportional Relationships as Lines",
    builder: proportionalRelationships,
  },
  {
    slug: "understand-slope-rate-change",
    conceptId: "concept-understand-slope-rate-change",
    description: "Interpret slope as a constant rate of change in tables, graphs, equations, and contexts.",
    title: "Understand Slope as Rate of Change",
    builder: understandSlopeRate,
  },
  {
    slug: "find-slope-from-graphs",
    conceptId: "concept-find-slope-from-graphs",
    description: "Find slope on coordinate graphs by using rise over run between two points on a line.",
    title: "Find Slope from Graphs",
    builder: findSlopeFromGraphs,
  },
  {
    slug: "find-slope-tables-points",
    conceptId: "concept-find-slope-tables-points",
    description: "Calculate slope from tables and coordinate pairs using change in y over change in x.",
    title: "Find Slope from Tables and Points",
    builder: findSlopeTablesPoints,
  },
  {
    slug: "compare-rates-of-change",
    conceptId: "concept-compare-rates-of-change",
    description: "Compare slopes and rates of change across graphs, tables, equations, and contexts.",
    title: "Compare Rates of Change",
    builder: compareRates,
  },
  {
    slug: "similar-triangles-constant-slope",
    conceptId: "concept-similar-triangles-constant-slope",
    description: "Use similar triangles to explain why slope is constant along a nonvertical line.",
    title: "Similar Triangles and Constant Slope",
    builder: similarTriangles,
  },
  {
    slug: "equations-y-equals-mx",
    conceptId: "concept-equations-y-equals-mx",
    description: "Write and interpret equations of proportional lines in the form y = mx.",
    title: "Equations in the Form y = mx",
    builder: equationsYEqualsMx,
  },
];

for (const pack of packs) {
  for (const kind of ["core", "review"]) {
    const questions = finalizeQuestions(pack.slug, kind, pack.builder(pack.slug, kind));
    await writeBank({
      slug: pack.slug,
      conceptId: pack.conceptId,
      type: kind,
      title: `${pack.title} ${kind === "core" ? "Core Test" : "Review Test"}`,
      description: pack.description,
      questions,
    });
  }
}

console.log(`Regenerated ${packs.length * 2} Course 3 Unit 3 assessment banks.`);
