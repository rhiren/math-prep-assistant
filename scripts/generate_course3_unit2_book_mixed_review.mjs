import fs from "node:fs/promises";

const outDir = "public/content/math/course3/test-sets";

function choosePositions(total) {
  const targets = total === 50 ? [13, 13, 12, 12] : [5, 5, 5, 5];
  const sequence = [];
  const counts = [0, 0, 0, 0];

  function allowed(candidate) {
    const n = sequence.length;
    if (counts[candidate] >= targets[candidate]) return false;
    if (n >= 2 && sequence[n - 1] === candidate && sequence[n - 2] === candidate) return false;
    if (
      n >= 2 &&
      sequence[n - 1] === ((sequence[n - 2] ?? -1) + 1) % 4 &&
      candidate === ((sequence[n - 1] ?? -1) + 1) % 4
    ) return false;
    if (n >= 7 && sequence.slice(n - 7).filter((value) => value === candidate).length >= 4) return false;

    const next = [...sequence, candidate];
    for (let cycleLength = 2; cycleLength <= 4; cycleLength += 1) {
      if (next.length < cycleLength * 2) continue;
      const first = next.slice(-cycleLength * 2, -cycleLength);
      const second = next.slice(-cycleLength);
      if (first.every((value, index) => value === second[index])) return false;
    }

    return true;
  }

  function fill() {
    if (sequence.length === total) return true;

    const choices = [2, 0, 3, 1]
      .filter(allowed)
      .sort((left, right) => {
        const remaining = (targets[right] - counts[right]) - (targets[left] - counts[left]);
        return remaining || left - right;
      });

    for (const choice of choices) {
      sequence.push(choice);
      counts[choice] += 1;
      if (fill()) return true;
      counts[choice] -= 1;
      sequence.pop();
    }

    return false;
  }

  if (!fill()) throw new Error(`Could not build an unpredictable answer sequence of length ${total}`);
  return sequence;
}

function uniqueChoices(correct, distractors) {
  const values = [];
  for (const option of distractors) {
    if (option !== correct && !values.includes(option)) values.push(option);
    if (values.length === 3) break;
  }
  if (values.length !== 3) throw new Error(`Need 3 distractors for ${correct}`);
  return values;
}

function q({ questionText, correctAnswer, distractors, difficulty, skillTags, explanation }) {
  return {
    questionText,
    correctAnswer,
    distractors: uniqueChoices(correctAnswer, distractors),
    difficulty,
    skillTags,
    explanation,
  };
}

function dilationPoint(k, x, y, difficulty) {
  return q({
    questionText: `A point (${x}, ${y}) is dilated from the origin by scale factor ${k}. What is the image point?`,
    correctAnswer: `(${k * x}, ${k * y})`,
    distractors: [`(${x + k}, ${y + k})`, `(${x}, ${k * y})`, `(${k * y}, ${k * x})`, `(${x - k}, ${y - k})`],
    difficulty,
    skillTags: ["dilations", "coordinate-plane", "scale-factor"],
    explanation: `A dilation from the origin multiplies both coordinates by ${k}.`,
  });
}

function scaleLength(from, to, length, difficulty) {
  const k = to / from;
  const answer = length * k;
  return q({
    questionText: `Two similar figures have corresponding sides ${from} and ${to}. A matching side on the first figure is ${length}. What is the side on the second figure?`,
    correctAnswer: `${answer} units`,
    distractors: [`${length + (to - from)} units`, `${length / k} units`, `${answer + 2} units`, `${Math.abs(answer - 3)} units`],
    difficulty,
    skillTags: ["similarity", "scale-factor", "missing-sides"],
    explanation: `The scale factor is ${to} / ${from} = ${k}. Multiply ${length} by ${k}.`,
  });
}

function similarDecision(a, b, c, d, difficulty) {
  const left = a / b;
  const right = c / d;
  const similar = Math.abs(left - right) < 0.0001;
  return q({
    questionText: `Figure A has side lengths ${a} and ${c}. Figure B has corresponding side lengths ${b} and ${d}. What can you conclude?`,
    correctAnswer: similar ? "The side ratios are consistent, so this supports similarity." : "The side ratios are not consistent, so this does not prove similarity.",
    distractors: similar
      ? ["The figures must be congruent.", "The figures cannot be similar because the sides differ.", "Only the longer sides matter."]
      : ["The side ratios are consistent, so this supports similarity.", "The figures must be similar because both have two sides.", "The figures are congruent because the differences match."],
    difficulty,
    skillTags: ["similar-figures", "proportional-sides", "reasoning"],
    explanation: `Compare matching ratios: ${a}/${b} and ${c}/${d}. Similar figures need one consistent scale relationship.`,
  });
}

function aaProof(a, b, c, d, difficulty) {
  const third1 = 180 - a - b;
  const third2 = 180 - c - d;
  const similar = [a, b, third1].sort((x, y) => x - y).join(",") === [c, d, third2].sort((x, y) => x - y).join(",");
  return q({
    questionText: `Triangle R has angles ${a} degrees and ${b} degrees. Triangle S has angles ${c} degrees and ${d} degrees. Which statement is best?`,
    correctAnswer: similar ? "The triangles are similar by AA." : "The angle information does not prove AA similarity.",
    distractors: similar
      ? ["The triangles are congruent by AA.", "The triangles are similar only if their side lengths are equal.", "The triangles are not similar because one angle is hidden."]
      : ["The triangles are similar by AA.", "The triangles are congruent by AA.", "All triangles are similar because their angles sum to 180 degrees."],
    difficulty,
    skillTags: ["angle-angle-similarity", "angle-sums", "proof"],
    explanation: `The missing angles are ${third1} degrees and ${third2} degrees. AA needs two matching angle pairs.`,
  });
}

function slopeTriangle(r1, u1, r2, u2, difficulty) {
  const same = r1 / u1 === r2 / u2;
  return q({
    questionText: `One slope triangle has rise ${r1} and run ${u1}. Another has rise ${r2} and run ${u2}. What does this show?`,
    correctAnswer: same ? "The triangles have the same rise/run ratio, so they can represent the same line slope." : "The rise/run ratios differ, so they do not show the same constant slope.",
    distractors: same
      ? ["The larger triangle is always steeper.", "The slope is found by adding rise and run.", "The triangles prove the line is horizontal."]
      : ["The triangles have the same rise/run ratio, so they can represent the same line slope.", "The triangles must be congruent.", "The larger run automatically makes the slope larger."],
    difficulty,
    skillTags: ["similar-triangles", "constant-slope", "rise-run"],
    explanation: `Compare ${r1}/${u1} and ${r2}/${u2}. Constant slope means the ratios match, not that the triangles are the same size.`,
  });
}

function rateChange(y1, y2, xChange, unit, difficulty) {
  const rate = (y2 - y1) / xChange;
  return q({
    questionText: `A quantity changes from ${y1} to ${y2} in ${xChange} ${unit}. What is the rate of change?`,
    correctAnswer: `${rate} per ${unit.slice(0, -1)}`,
    distractors: [`${(y2 / xChange).toFixed(1)} per ${unit.slice(0, -1)}`, `${Math.abs(rate)} per ${unit.slice(0, -1)}`, `${y2 - y1 + xChange} per ${unit.slice(0, -1)}`, `${y1 / xChange} per ${unit.slice(0, -1)}`],
    difficulty,
    skillTags: ["slope", "rate-of-change", "context"],
    explanation: `Rate of change is change in output divided by change in input: (${y2} - ${y1}) / ${xChange} = ${rate}.`,
  });
}

function graphSlope(x1, y1, x2, y2, difficulty) {
  const rise = y2 - y1;
  const run = x2 - x1;
  const divisor = Math.abs(gcd(rise, run));
  const num = rise / divisor;
  const den = run / divisor;
  const answer = den === 1 ? `${num}` : `${num}/${den}`;
  return q({
    questionText: `A line passes through (${x1}, ${y1}) and (${x2}, ${y2}). What is its slope?`,
    correctAnswer: answer,
    distractors: [`${run}/${rise}`, `${rise + run}`, `${-num}${den === 1 ? "" : `/${den}`}`, `${Math.abs(num)}${den === 1 ? "" : `/${den}`}`],
    difficulty,
    skillTags: ["slope", "graphs", "coordinate-plane"],
    explanation: `Slope is rise over run: (${y2} - ${y1}) / (${x2} - ${x1}) = ${rise}/${run}, which simplifies to ${answer}.`,
  });
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

const scaffold = [
  dilationPoint(2, 3, 4, "scaffold"),
  dilationPoint(3, 1, 5, "scaffold"),
  scaleLength(4, 8, 6, "scaffold"),
  similarDecision(3, 6, 5, 10, "scaffold"),
  aaProof(40, 70, 70, 70, "scaffold"),
  slopeTriangle(2, 3, 4, 6, "scaffold"),
  rateChange(10, 22, 3, "hours", "scaffold"),
  graphSlope(1, 2, 4, 8, "scaffold"),
  scaleLength(5, 15, 7, "scaffold"),
  graphSlope(0, 1, 2, 5, "scaffold"),
];

const standard = [
  dilationPoint(0.5, 8, 6, "standard"),
  similarDecision(4, 10, 6, 15, "standard"),
  similarDecision(5, 12, 8, 20, "standard"),
  scaleLength(9, 6, 12, "standard"),
  aaProof(35, 85, 35, 60, "standard"),
  aaProof(48, 72, 60, 48, "standard"),
  slopeTriangle(3, 5, 9, 15, "standard"),
  slopeTriangle(4, 7, 8, 15, "standard"),
  rateChange(50, 38, 3, "minutes", "standard"),
  rateChange(12, 30, 6, "weeks", "standard"),
  graphSlope(2, 9, 6, 3, "standard"),
  graphSlope(-1, 4, 5, 16, "standard"),
  dilationPoint(4, -2, 3, "standard"),
  scaleLength(6, 14, 9, "standard"),
  similarDecision(7, 21, 4, 12, "standard"),
  aaProof(52, 58, 52, 70, "standard"),
  slopeTriangle(5, 8, 15, 24, "standard"),
  rateChange(8, -4, 4, "seconds", "standard"),
  graphSlope(-3, -2, 1, 6, "standard"),
  dilationPoint(1.5, 4, 2, "standard"),
  scaleLength(10, 4, 15, "standard"),
  similarDecision(6, 8, 9, 12, "standard"),
  aaProof(28, 64, 88, 28, "standard"),
  slopeTriangle(6, 10, 9, 16, "standard"),
  graphSlope(3, -1, 9, 7, "standard"),
];

const challenge = [
  q({
    questionText: "A student says a dilation by 3 makes every angle three times as large. Which response is best?",
    correctAnswer: "No. Dilations multiply lengths, but angle measures stay the same.",
    distractors: ["Yes. Every measurement triples under a dilation.", "No. Dilations preserve length but change angles.", "Yes, but only for triangles."],
    difficulty: "challenge",
    skillTags: ["dilations", "misconception", "similarity"],
    explanation: "Dilations change size while preserving shape, so side lengths scale but angle measures remain equal.",
  }),
  q({
    questionText: "A small triangle inside a larger triangle has one side parallel to the larger triangle's base. Why are the triangles similar?",
    correctAnswer: "They share one angle and have a second matching angle from parallel lines, so AA applies.",
    distractors: ["They are congruent because the bases are parallel.", "They are similar because all nested triangles are similar.", "They are not similar unless all side lengths are measured."],
    difficulty: "challenge",
    skillTags: ["angle-angle-similarity", "parallel-lines", "proof"],
    explanation: "Parallel lines create corresponding angle matches. With the shared angle, two angle pairs match.",
  }),
  q({
    questionText: "Two slope triangles on a line have rise/run ratios 6/9 and 10/15. What is the strongest conclusion?",
    correctAnswer: "Both simplify to 2/3, so they support a constant slope of 2/3.",
    distractors: ["The second triangle is steeper because 10 is larger than 6.", "The slope changes because the triangles are different sizes.", "The slope is 16/24 because rises and runs should be added."],
    difficulty: "challenge",
    skillTags: ["constant-slope", "equivalent-ratios", "reasoning"],
    explanation: "Equivalent rise/run ratios describe the same steepness, even when the slope triangles are different sizes.",
  }),
  q({
    questionText: "A graph shows points (1, 9), (4, 3), and (7, -3) on one line. What is the rate of change?",
    correctAnswer: "-2",
    distractors: ["2", "-6", "3", "-1/2"],
    difficulty: "challenge",
    skillTags: ["slope", "graphs", "rate-of-change"],
    explanation: "Each time x increases by 3, y decreases by 6. The slope is -6/3 = -2.",
  }),
  q({
    questionText: "Two similar signs have perimeters 18 inches and 45 inches. A side on the smaller sign is 7 inches. What is the matching side on the larger sign?",
    correctAnswer: "17.5 inches",
    distractors: ["14 inches", "34 inches", "70 inches", "11.5 inches"],
    difficulty: "challenge",
    skillTags: ["similarity", "perimeter-scale", "missing-sides"],
    explanation: "Perimeters scale like side lengths. The scale factor is 45/18 = 2.5, so 7 * 2.5 = 17.5.",
  }),
  q({
    questionText: "A point is dilated from the origin to (12, -8). The scale factor was 4. What was the original point?",
    correctAnswer: "(3, -2)",
    distractors: ["(48, -32)", "(8, -12)", "(16, -4)", "(3, 2)"],
    difficulty: "challenge",
    skillTags: ["dilations", "working-backward", "coordinate-plane"],
    explanation: "Work backward by dividing both image coordinates by 4: (12/4, -8/4) = (3, -2).",
  }),
  q({
    questionText: "A line represents dollars earned over hours worked. Its slope is 18. What does that mean?",
    correctAnswer: "The earnings increase by $18 for each hour worked.",
    distractors: ["The worker starts with $18.", "The worker earns $18 total.", "The graph goes right 18 for every 1 up."],
    difficulty: "challenge",
    skillTags: ["slope", "rate-of-change", "interpretation"],
    explanation: "Slope is change in earnings divided by change in hours, so the unit rate is dollars per hour.",
  }),
  q({
    questionText: "Triangle A has angles 43 degrees and 72 degrees. Triangle B has angles 65 degrees and 43 degrees. What connects this to side ratios?",
    correctAnswer: "AA proves the triangles are similar, so corresponding side lengths are proportional.",
    distractors: ["AA proves the triangles are congruent, so all side lengths are equal.", "The triangles are unrelated because no side lengths are shown.", "Only the longest sides are proportional."],
    difficulty: "challenge",
    skillTags: ["angle-angle-similarity", "proportional-sides", "reasoning"],
    explanation: "Triangle A's third angle is 65 degrees. Two angle pairs match, so similarity follows and corresponding sides are proportional.",
  }),
  q({
    questionText: "A student uses points (2, 5) and (8, 17) and says the slope is 6/12. What correction is needed?",
    correctAnswer: "The student switched run and rise; the slope is 12/6 = 2.",
    distractors: ["The student should add the coordinates instead.", "The slope is correct because 6/12 simplifies to 1/2.", "The line has no slope because neither point is the origin."],
    difficulty: "challenge",
    skillTags: ["slope", "error-analysis", "graphs"],
    explanation: "Rise is 17 - 5 = 12 and run is 8 - 2 = 6. Slope is rise/run.",
  }),
  q({
    questionText: "Two figures have matching angles, and one side pair has scale factor 4. What must be checked before using that scale factor on every side?",
    correctAnswer: "The figures must be known to be similar with correct corresponding sides.",
    distractors: ["The figures must be congruent.", "The scale factor must be added to every side.", "Only the largest side pair matters."],
    difficulty: "challenge",
    skillTags: ["similarity", "correspondence", "reasoning"],
    explanation: "A scale factor applies to all corresponding side lengths only after the similarity and side correspondence are clear.",
  }),
  q({
    questionText: "A bike moves from 4 miles to 19 miles during a 1.5 hour interval. What is the rate of change?",
    correctAnswer: "10 miles per hour",
    distractors: ["15 miles per hour", "12.7 miles per hour", "23 miles per hour", "6.7 miles per hour"],
    difficulty: "challenge",
    skillTags: ["rate-of-change", "decimal", "context"],
    explanation: "The distance change is 15 miles. Divide by 1.5 hours to get 10 miles per hour.",
  }),
  q({
    questionText: "A dilation has scale factor 2.5. Which statement must be true about a figure and its image?",
    correctAnswer: "Corresponding side lengths are multiplied by 2.5, and corresponding angles stay equal.",
    distractors: ["Corresponding angles are multiplied by 2.5.", "Only horizontal lengths are multiplied by 2.5.", "The image is congruent to the original."],
    difficulty: "challenge",
    skillTags: ["dilations", "similarity", "properties"],
    explanation: "Dilations preserve angle measures and multiply all lengths by the scale factor.",
  }),
  q({
    questionText: "A line goes through (-2, 7) and (4, -5). Which slope triangle correctly represents the line from left to right?",
    correctAnswer: "rise -12 and run 6",
    distractors: ["rise 12 and run 6", "rise 6 and run -12", "rise -5 and run 7", "rise -12 and run -6"],
    difficulty: "challenge",
    skillTags: ["slope", "negative-slope", "graphs"],
    explanation: "From x = -2 to x = 4, run is 6. y changes from 7 to -5, so rise is -12.",
  }),
  q({
    questionText: "A triangle pair has angles 30, 60, 90 and 45, 45, 90. Why is one matching right angle not enough?",
    correctAnswer: "Many non-similar right triangles share a 90 degree angle; AA needs a second matching angle pair.",
    distractors: ["Right triangles can never be similar.", "One matching angle proves congruence instead.", "The triangles are similar because all right triangles are similar."],
    difficulty: "challenge",
    skillTags: ["angle-angle-similarity", "misconception", "proof"],
    explanation: "One angle pair is not enough. These triangles have different acute angles, so AA similarity is not proven.",
  }),
  q({
    questionText: "A graph's slope is -3/4. Which movement matches that slope?",
    correctAnswer: "down 3 and right 4",
    distractors: ["up 3 and right 4", "down 4 and right 3", "right 3 and down 4", "up 4 and right 3"],
    difficulty: "challenge",
    skillTags: ["slope", "rise-run", "interpretation"],
    explanation: "A negative slope means the line falls from left to right. Rise/run = -3/4 means down 3, right 4.",
  }),
];

const coreQuestions = [...scaffold, ...standard, ...challenge];
const reviewQuestions = [...scaffold.slice(0, 8), ...standard.slice(0, 12)];

function buildBank(testId, type, title, description, questions) {
  const positions = choosePositions(questions.length);
  return {
    testId,
    conceptId: "concept-course3-unit2-dilations-similarity-slope-mixed-review",
    type,
    title,
    description,
    questions: questions.map((item, index) => {
      const options = [...item.distractors];
      options.splice(positions[index], 0, item.correctAnswer);
      return {
        id: `${testId}-${String(index + 1).padStart(3, "0")}`,
        type: "multiple_choice",
        questionText: item.questionText,
        options,
        correctAnswer: item.correctAnswer,
        difficulty: item.difficulty,
        answerType: "text",
        skillTags: item.skillTags,
        explanation: item.explanation,
      };
    }),
  };
}

await fs.writeFile(
  `${outDir}/course3-unit2-dilations-similarity-slope-mixed-review-core.json`,
  `${JSON.stringify(buildBank(
    "course3-unit2-dilations-similarity-slope-mixed-review-core",
    "concept",
    "Unit 2 Mixed Review Core Test",
    "Review book Unit 2: dilations, scale factor, similar figures, similar triangles, AA similarity, constant slope, rate of change, and graph slope.",
    coreQuestions,
  ), null, 2)}\n`,
);

await fs.writeFile(
  `${outDir}/course3-unit2-dilations-similarity-slope-mixed-review-review.json`,
  `${JSON.stringify(buildBank(
    "course3-unit2-dilations-similarity-slope-mixed-review-review",
    "review",
    "Unit 2 Mixed Review Review Test",
    "Reinforce the essential Unit 2 connections from dilations and similarity to slope.",
    reviewQuestions,
  ), null, 2)}\n`,
);

console.log("Generated book-aligned Course 3 Unit 2 mixed review banks.");
