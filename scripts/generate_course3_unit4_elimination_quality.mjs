import { writeFile } from "node:fs/promises";

const contentRoot = "public/content/math/course3";
const testSetDir = `${contentRoot}/test-sets`;
const tutorialDir = `${contentRoot}/tutorials`;

function point(x, y) {
  return `(${x}, ${y})`;
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

function multiplyEquation(equation, factor) {
  return {
    a: equation.a * factor,
    b: equation.b * factor,
    c: equation.c * factor,
  };
}

function equationText(equation) {
  return standardEquation(equation.a, equation.b, equation.c);
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

const solutions = [
  [-4, 3],
  [-3, -2],
  [-2, 5],
  [-1, 1],
  [0, -4],
  [1, 3],
  [2, -1],
  [3, 4],
  [4, -3],
  [5, 2],
  [-5, -1],
  [6, 1],
  [2, 5],
  [-6, 2],
];

const coefficientPairs = [
  [2, 3, -2, 5],
  [3, -4, 5, -4],
  [4, 1, 2, -3],
  [5, 2, -3, 2],
  [2, -5, 6, 1],
  [3, 2, 1, -4],
  [4, -3, -2, -3],
  [5, -1, 2, 3],
  [2, 7, -6, 5],
  [6, -2, 3, 4],
];

function systemFrom(index) {
  const [x, y] = solutions[index % solutions.length];
  const [a1, b1, a2, b2] = coefficientPairs[index % coefficientPairs.length];
  const eq1 = { a: a1, b: b1, c: a1 * x + b1 * y };
  const eq2 = { a: a2, b: b2, c: a2 * x + b2 * y };
  return { x, y, eq1, eq2 };
}

function pointOptions(x, y) {
  return fourUniqueOptions(point(x, y), [
    point(y, x),
    point(x + 1, y),
    point(x, y + 1),
    point(-x, y),
    point(x, -y),
    point(x - 1, y + 2),
    point(x + 2, y - 1),
  ]);
}

function numberOptions(correct, candidates) {
  return fourUniqueOptions(String(correct), candidates.map(String));
}

function directXSystem(index) {
  const [x, y] = solutions[index % solutions.length];
  const a = [2, 3, 4, 5, 6][index % 5];
  const b1 = [1, -2, 3, -4, 5][index % 5];
  const b2 = [-3, 4, 2, 5, -1][index % 5];
  const eq1 = { a, b: b1, c: a * x + b1 * y };
  const eq2 = { a: -a, b: b2, c: -a * x + b2 * y };
  return { x, y, eq1, eq2, eliminated: "x", operation: "add the equations" };
}

function directYSystem(index) {
  const [x, y] = solutions[(index + 4) % solutions.length];
  const b = [2, 3, 4, 5, 6][index % 5];
  const a1 = [1, -2, 3, 5, -4][index % 5];
  const a2 = [4, 5, -1, -3, 2][index % 5];
  const eq1 = { a: a1, b, c: a1 * x + b * y };
  const eq2 = { a: a2, b, c: a2 * x + b * y };
  return { x, y, eq1, eq2, eliminated: "y", operation: "subtract the equations" };
}

function scalingSystem(index) {
  const [x, y] = solutions[(index + 8) % solutions.length];
  const baseA = [2, 3, 4, 5, 6][index % 5];
  const factor = [2, -2, 3, -3, 4][index % 5];
  const b1 = [1, -3, 5, 2, -4][index % 5];
  const b2 = [4, 1, -2, 5, 3][index % 5];
  const eq1 = { a: baseA, b: b1, c: baseA * x + b1 * y };
  const eq2 = { a: -baseA * factor, b: b2, c: -baseA * factor * x + b2 * y };
  return {
    x,
    y,
    eq1,
    eq2,
    factor,
    scaledEq1: multiplyEquation(eq1, factor),
  };
}

function eliminationBuilders(kind) {
  const count = kind === "core" ? 50 : 20;
  return Array.from({ length: count }, (_, index) => (id) => {
    const d = difficulty(index, kind);
    const template = index % 10;
    const general = systemFrom(index * 7 + 1);
    const directX = directXSystem(index * 5 + 2);
    const directY = directYSystem(index * 5 + 3);
    const scaled = scalingSystem(index * 3 + 4);

    if (template === 0) {
      return makeQuestion({
        id,
        questionText: `Solve by elimination: ${equationText(directX.eq1)} and ${equationText(directX.eq2)}. What is the solution?`,
        options: pointOptions(directX.x, directX.y),
        correctAnswer: point(directX.x, directX.y),
        difficulty: d,
        skillTags: ["systems", "elimination", "add-equations"],
        explanation: "The x-terms are opposites, so adding the equations eliminates x. Solve for y, then substitute to find x.",
      });
    }

    if (template === 1) {
      const correctAnswer = `${directY.eliminated} is eliminated`;
      return makeQuestion({
        id,
        questionText: `For ${equationText(directY.eq1)} and ${equationText(directY.eq2)}, what happens if you subtract the second equation from the first?`,
        options: fourUniqueOptions(correctAnswer, [
          "x is eliminated",
          "both variables are eliminated",
          "no variable is eliminated",
          "the constants become equal",
          "the slopes become the same",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "elimination", "structure"],
        explanation: "The y-coefficients match. Subtracting equations with matching y-terms makes the y-term become zero.",
      });
    }

    if (template === 2) {
      return makeQuestion({
        id,
        questionText: `Use elimination on ${equationText(directY.eq1)} and ${equationText(directY.eq2)}. What x-value do you get after eliminating y?`,
        options: numberOptions(directY.x, [
          directY.y,
          -directY.x,
          directY.x + 1,
          directY.x - 1,
          directY.x + directY.y,
          directY.y - directY.x,
        ]),
        correctAnswer: String(directY.x),
        difficulty: d,
        skillTags: ["systems", "elimination", "solve-x"],
        explanation: "Subtract the equations to eliminate y, then divide by the remaining x-coefficient.",
      });
    }

    if (template === 3) {
      const correctAnswer = equationText(scaled.scaledEq1);
      return makeQuestion({
        id,
        questionText: `Before eliminating x in ${equationText(scaled.eq1)} and ${equationText(scaled.eq2)}, multiply the first equation by ${scaled.factor}. Which equivalent equation results?`,
        options: fourUniqueOptions(correctAnswer, [
          equationText(multiplyEquation(scaled.eq1, -scaled.factor)),
          equationText({ a: scaled.eq1.a * scaled.factor, b: scaled.eq1.b, c: scaled.eq1.c * scaled.factor }),
          equationText({ a: scaled.eq1.a, b: scaled.eq1.b * scaled.factor, c: scaled.eq1.c * scaled.factor }),
          equationText({ a: scaled.eq1.a * scaled.factor, b: scaled.eq1.b * scaled.factor, c: scaled.eq1.c }),
          equationText(multiplyEquation(scaled.eq2, scaled.factor)),
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "elimination", "scale-equation"],
        explanation: "Multiplying an equation by a factor means multiplying every term on both sides by that factor.",
      });
    }

    if (template === 4) {
      return makeQuestion({
        id,
        questionText: `After scaling one equation, solve by elimination: ${equationText(scaled.eq1)} and ${equationText(scaled.eq2)}. What is the solution?`,
        options: pointOptions(scaled.x, scaled.y),
        correctAnswer: point(scaled.x, scaled.y),
        difficulty: d,
        skillTags: ["systems", "elimination", "scale-then-solve"],
        explanation: "Scale one equation so a pair of variable terms are opposites, add to eliminate that variable, then substitute back.",
      });
    }

    if (template === 5) {
      const correctAnswer = directX.operation;
      return makeQuestion({
        id,
        questionText: `Which first move is most efficient for ${equationText(directX.eq1)} and ${equationText(directX.eq2)}?`,
        options: fourUniqueOptions(correctAnswer, [
          "subtract the equations",
          "multiply only the constants by -1",
          "divide both equations by the y-coefficients",
          "graph only the first equation",
          "set the constants equal",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "elimination", "strategy"],
        explanation: "The x-coefficients are already opposites, so adding the equations is the efficient elimination step.",
      });
    }

    if (template === 6) {
      const correctAnswer = String(directX.y);
      return makeQuestion({
        id,
        questionText: `Add ${equationText(directX.eq1)} and ${equationText(directX.eq2)} to eliminate x. What y-value is in the solution?`,
        options: numberOptions(directX.y, [
          directX.x,
          -directX.y,
          directX.y + 1,
          directX.y - 1,
          directX.x + directX.y,
          directX.x - directX.y,
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "elimination", "solve-y"],
        explanation: "Adding removes the x-terms. Solve the remaining one-variable equation for y.",
      });
    }

    if (template === 7) {
      const correctAnswer = "multiply every term in one equation by the same factor";
      return makeQuestion({
        id,
        questionText: `A system is ${equationText(general.eq1)} and ${equationText(general.eq2)}. Why is multiplying an entire equation allowed before elimination?`,
        options: fourUniqueOptions(correctAnswer, [
          "it changes the solution so the numbers are easier",
          "it makes any chosen ordered pair correct",
          "it removes the need to check the second equation",
          "it changes only the graph's intercept, not the slope",
        ]),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "elimination", "equivalent-equations"],
        explanation: "Multiplying both sides of an equation by the same nonzero factor creates an equivalent equation with the same solutions.",
      });
    }

    if (template === 8) {
      const correctAnswer = point(general.x, general.y);
      return makeQuestion({
        id,
        questionText: `A student used elimination and found x = ${general.x}. Which ordered pair solves ${equationText(general.eq1)} and ${equationText(general.eq2)}?`,
        options: pointOptions(general.x, general.y),
        correctAnswer,
        difficulty: d,
        skillTags: ["systems", "elimination", "substitute-back"],
        explanation: "After finding one variable, substitute it into either original equation to find the other variable.",
      });
    }

    const correctAnswer = "check the ordered pair in both original equations";
    return makeQuestion({
      id,
      questionText: `After solving ${equationText(general.eq1)} and ${equationText(general.eq2)} by elimination, what is the best final check?`,
      options: fourUniqueOptions(correctAnswer, [
        "check only the equation that was multiplied",
        "make sure the two constants have the same sign",
        "verify that the eliminated variable equals 0",
        "compare the two x-coefficients only",
      ]),
      correctAnswer,
      difficulty: d,
      skillTags: ["systems", "elimination", "checking"],
      explanation: "A system solution must make every original equation true, so the final ordered pair should be checked in both equations.",
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
  slug: "solve-systems-elimination",
  conceptId: "concept-solve-systems-elimination",
  title: "Solve Systems by Elimination",
  description: "Solve systems by adding or subtracting equivalent equations to eliminate one variable.",
  tutorial: `# Solve Systems by Elimination

## Big Idea

Elimination solves a system by combining equations so one variable disappears. Then the system becomes a one-variable equation you already know how to solve.

## What To Notice

- Add equations when one pair of variable terms are opposites, such as \`3x\` and \`-3x\`.
- Subtract equations when one pair of variable terms match, such as \`4y\` and \`4y\`.
- If nothing cancels yet, multiply one or both entire equations first.
- After finding one variable, substitute back into an original equation.
- Write the answer as an ordered pair and check it in both equations.

## Worked Example

Solve:

\`2x + 3y = 18\`

\`-2x + 5y = 14\`

Add the equations because \`2x\` and \`-2x\` are opposites:

\`8y = 32\`

\`y = 4\`

Substitute \`y = 4\` into \`2x + 3y = 18\`:

\`2x + 12 = 18\`

\`2x = 6\`

\`x = 3\`

The solution is \`(3, 4)\`.

## Common Mistake

When you multiply an equation to create matching or opposite coefficients, multiply every term, including the constant.

## Quick Self-Check

If the ordered pair is correct, it will make both original equations true.
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
    questions: finalize(pack.slug, kind, eliminationBuilders(kind)),
  });
}

console.log(`Generated ${pack.title} tutorial and 2 assessment banks.`);
