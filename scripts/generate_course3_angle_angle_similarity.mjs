import fs from "node:fs/promises";

const outDir = "public/content/math/course3/test-sets";

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function choosePositions(total) {
  const targets = total === 50 ? [13, 13, 12, 12] : [5, 5, 5, 5];
  const sequence = [];
  const counts = [0, 0, 0, 0];

  function isAllowed(candidate) {
    const n = sequence.length;
    if (counts[candidate] >= targets[candidate]) {
      return false;
    }
    if (n >= 2 && sequence[n - 1] === candidate && sequence[n - 2] === candidate) {
      return false;
    }
    if (
      n >= 2 &&
      sequence[n - 1] === ((sequence[n - 2] ?? -1) + 1) % 4 &&
      candidate === ((sequence[n - 1] ?? -1) + 1) % 4
    ) {
      return false;
    }
    if (n >= 7) {
      const window = sequence.slice(n - 7);
      const windowCount = window.filter((value) => value === candidate).length + 1;
      if (windowCount > 4) {
        return false;
      }
    }
    return true;
  }

  for (let index = 0; index < total; index += 1) {
    const candidates = [1, 3, 0, 2]
      .filter(isAllowed)
      .sort((left, right) => (targets[right] - counts[right]) - (targets[left] - counts[left]));
    const choice = candidates[0];
    if (choice === undefined) {
      throw new Error(`Could not assign answer position ${index + 1}`);
    }
    sequence.push(choice);
    counts[choice] += 1;
  }

  return sequence;
}

function makeQuestion({ id, questionText, correctAnswer, distractors, difficulty, skillTags, explanation }, correctIndex) {
  const options = [...distractors];
  options.splice(correctIndex, 0, correctAnswer);
  return {
    id,
    type: "multiple_choice",
    questionText,
    options,
    correctAnswer,
    difficulty,
    answerType: "text",
    skillTags,
    explanation,
  };
}

function uniqueDistractors(correctAnswer, candidates) {
  const values = [];
  for (const candidate of candidates) {
    if (values.length === 3) {
      break;
    }
    if (candidate === correctAnswer || values.includes(candidate)) {
      continue;
    }
    values.push(candidate);
  }
  if (values.length !== 3) {
    throw new Error(`Expected 3 unique distractors for ${correctAnswer}`);
  }
  return values;
}

function thirdAngle(a, b) {
  return 180 - a - b;
}

function anglePairQuestion(index, difficulty, data) {
  const [a1, a2] = data.triangleA;
  const [b1, b2] = data.triangleB;
  return {
    questionText: `${data.context} Triangle J has angles ${a1} degrees and ${a2} degrees. Triangle K has angles ${b1} degrees and ${b2} degrees. What is the best conclusion?`,
    correctAnswer: data.similar ? "The triangles are similar by AA." : "The information does not prove the triangles are similar by AA.",
    distractors: data.similar
      ? [
          "The triangles must be congruent by AA.",
          "The triangles are similar only if all side lengths are equal.",
          "The triangles are not similar because one angle is missing.",
        ]
      : [
          "The triangles are similar by AA.",
          "The triangles must be congruent by AA.",
          "The triangles are similar because every pair of triangles has angle sum 180 degrees.",
        ],
    difficulty,
    skillTags: ["angle-angle-similarity", "angle-sums", "similarity"],
    explanation: data.similar
      ? `The third angles are ${thirdAngle(a1, a2)} degrees and ${thirdAngle(b1, b2)} degrees, so two angle pairs match. That proves similarity by AA.`
      : `The angle sets do not create two matching angle pairs. Triangle angle sums alone do not prove similarity.`,
  };
}

function missingThirdQuestion(index, difficulty, data) {
  const missing = thirdAngle(data.known[0], data.known[1]);
  return {
    questionText: `${data.context} One triangle has angles ${data.known[0]} degrees, ${data.known[1]} degrees, and ${missing} degrees. A second triangle has one angle ${data.match} degrees. What other angle would prove similarity by AA?`,
    correctAnswer: `${data.need} degrees`,
    distractors: [`${missing + 10} degrees`, `${180 - data.match} degrees`, `${Math.max(1, data.need - 8)} degrees`],
    difficulty,
    skillTags: ["angle-angle-similarity", "missing-angle", "angle-sums"],
    explanation: `AA needs two matching angle pairs. The second triangle already matches ${data.match} degrees, so a ${data.need} degree angle would give a second matching pair.`,
  };
}

function enoughInfoQuestion(index, difficulty, data) {
  return {
    questionText: `${data.context} A student wants to prove two triangles are similar. The diagram shows ${data.evidence}. Is that enough for AA similarity?`,
    correctAnswer: data.enough ? "Yes, two angle pairs are known to match." : "No, only one angle pair is known to match.",
    distractors: data.enough
      ? [
          "No, AA also requires proportional side lengths.",
          "No, AA can prove congruence but not similarity.",
          "Yes, because every triangle has the same side lengths.",
        ]
      : [
          "Yes, one angle pair is always enough.",
          "Yes, because all triangles have angle sum 180 degrees.",
          "No, because similar triangles cannot have equal angles.",
        ],
    difficulty,
    skillTags: ["angle-angle-similarity", "proof", "reasoning"],
    explanation: data.enough
      ? "Two matching angle pairs prove the triangles are similar by AA; proportional sides then follow."
      : "One matching angle pair is not enough. Many non-similar triangles can share one angle measure.",
  };
}

function correspondenceQuestion(index, difficulty, data) {
  return {
    questionText: `${data.context} Triangle ABC is similar to triangle DEF by AA. Angle A matches angle D, and angle B matches angle E. Which side correspondence follows?`,
    correctAnswer: data.correct,
    distractors: data.distractors,
    difficulty,
    skillTags: ["angle-angle-similarity", "correspondence", "similar-triangles"],
    explanation: "The order of the matching angles determines the order of corresponding vertices, so the matching sides must connect matching vertices.",
  };
}

function algebraAngleQuestion(index, difficulty, data) {
  const x = data.x;
  const first = data.m * x + data.b;
  return {
    questionText: `${data.context} Two triangles already have one pair of matching angles. Another pair is labeled ${data.m}x + ${data.b} degrees and ${first} degrees. What value of x would complete an AA similarity proof?`,
    correctAnswer: `x = ${x}`,
    distractors: uniqueDistractors(`x = ${x}`, [
      `x = ${x + 2}`,
      `x = ${Math.max(1, x - 1)}`,
      `x = ${x + data.m}`,
      `x = ${x + data.m + 1}`,
      `x = ${Math.max(1, x - 3)}`,
    ]),
    difficulty,
    skillTags: ["angle-angle-similarity", "algebra", "proof"],
    explanation: `Set the matching angles equal: ${data.m}x + ${data.b} = ${first}, so x = ${x}.`,
  };
}

function parallelLineQuestion(index, difficulty, data) {
  return {
    questionText: `${data.context} Segment ${data.segment} is parallel to a side of a larger triangle, creating a smaller triangle inside it. Which reason can prove the two triangles are similar?`,
    correctAnswer: "Corresponding angles from parallel lines match, giving AA similarity.",
    distractors: [
      "The smaller triangle was translated, so the triangles are congruent.",
      "Parallel lines make all side lengths equal.",
      "The triangles are similar only after measuring every side.",
    ],
    difficulty,
    skillTags: ["angle-angle-similarity", "parallel-lines", "proof"],
    explanation: "Parallel lines create matching corresponding angles. With the shared angle, there are two matching angle pairs, so AA proves similarity.",
  };
}

function scaleFactorProofQuestion(index, difficulty, data) {
  return {
    questionText: `${data.context} A scale factor between two triangles is ${data.num}/${data.den}. Which extra evidence would prove the triangles are similar by AA instead of only comparing side lengths?`,
    correctAnswer: "Two pairs of corresponding angles are congruent.",
    distractors: [
      "One side in each triangle has the same length.",
      "The triangles are drawn facing the same direction.",
      "The perimeters have different values.",
    ],
    difficulty,
    skillTags: ["angle-angle-similarity", "evidence", "similarity"],
    explanation: "AA similarity is based on matching angles. Two corresponding angle pairs are enough to prove the triangles are similar.",
  };
}

function indirectAngleQuestion(index, difficulty, data) {
  const missing = 180 - data.given - data.other;
  return {
    questionText: `${data.context} Triangle R has angles ${data.given} degrees, ${data.other} degrees, and one unknown angle. Triangle S has angles ${data.given} degrees and ${missing} degrees. What conclusion follows?`,
    correctAnswer: "The triangles are similar by AA.",
    distractors: [
      "The triangles are congruent because two angles match.",
      "The triangles are not similar because one angle is unknown.",
      "The triangles are similar only if their longest sides match exactly.",
    ],
    difficulty,
    skillTags: ["angle-angle-similarity", "angle-sums", "indirect-reasoning"],
    explanation: `The unknown angle in Triangle R is ${missing} degrees. That gives two matching angle pairs, so AA proves similarity.`,
  };
}

function challengeProofQuestion(index, difficulty, data) {
  return {
    questionText: `${data.context} A student says, "${data.claim}" Which response best evaluates the proof?`,
    correctAnswer: data.correct,
    distractors: data.distractors,
    difficulty,
    skillTags: ["angle-angle-similarity", "critique", "proof"],
    explanation: data.explanation,
  };
}

const contexts = [
  "In a drawing for a ramp model,",
  "During a shadow measurement lab,",
  "On a coordinate-grid sketch,",
  "In a folded-paper diagram,",
  "While checking a scale drawing,",
  "In a bridge-truss diagram,",
  "During a geometry warm-up,",
  "In a map inset problem,",
  "While comparing two roof supports,",
  "In a triangle proof card,",
];

const coreBuilders = [];
const scaffoldAngles = [
  { triangleA: [42, 68], triangleB: [68, 70], similar: true },
  { triangleA: [35, 85], triangleB: [35, 60], similar: false },
  { triangleA: [50, 50], triangleB: [80, 50], similar: true },
  { triangleA: [48, 72], triangleB: [60, 48], similar: true },
];
for (let i = 0; i < 4; i += 1) {
  coreBuilders.push((index) => anglePairQuestion(index, "scaffold", { ...scaffoldAngles[i], context: contexts[i] }));
}
const scaffoldMissing = [
  { known: [38, 74], match: 38, need: 74 },
  { known: [45, 65], match: 70, need: 45 },
  { known: [52, 58], match: 52, need: 70 },
];
for (let i = 0; i < 3; i += 1) {
  coreBuilders.push((index) => missingThirdQuestion(index, "scaffold", { ...scaffoldMissing[i], context: contexts[i + 4] }));
}
const scaffoldEvidence = [
  { evidence: "a 40 degree angle in each triangle and a 75 degree angle in each triangle", enough: true },
  { evidence: "only one 62 degree angle in each triangle", enough: false },
  { evidence: "a shared angle and one pair of corresponding angles marked congruent", enough: true },
];
for (let i = 0; i < 3; i += 1) {
  coreBuilders.push((index) => enoughInfoQuestion(index, "scaffold", { ...scaffoldEvidence[i], context: contexts[i + 7] }));
}

const standardItems = [
  (index) => correspondenceQuestion(index, "standard", {
    context: contexts[0],
    correct: "Side AB corresponds to side DE.",
    distractors: ["Side AB corresponds to side EF.", "Side AC corresponds to side DE.", "Side BC corresponds to side DF."],
  }),
  (index) => algebraAngleQuestion(index, "standard", { context: contexts[1], m: 3, b: 12, x: 16 }),
  (index) => parallelLineQuestion(index, "standard", { context: contexts[2], segment: "MN" }),
  (index) => scaleFactorProofQuestion(index, "standard", { context: contexts[3], num: 5, den: 2 }),
  (index) => indirectAngleQuestion(index, "standard", { context: contexts[4], given: 44, other: 71 }),
  (index) => challengeProofQuestion(index, "standard", {
    context: contexts[5],
    claim: "These triangles share one angle, so they must be similar.",
    correct: "The proof is incomplete because one matching angle pair is not enough.",
    distractors: [
      "The proof is complete because one angle pair proves AA.",
      "The proof is complete only if both triangles are right triangles.",
      "The proof is wrong because similar triangles cannot share angles.",
    ],
    explanation: "AA requires two matching angle pairs. A shared angle gives only one pair unless another angle match is established.",
  }),
  (index) => anglePairQuestion(index, "standard", { context: contexts[6], triangleA: [36, 84], triangleB: [60, 84], similar: true }),
  (index) => missingThirdQuestion(index, "standard", { context: contexts[7], known: [29, 91], match: 60, need: 29 }),
  (index) => algebraAngleQuestion(index, "standard", { context: contexts[8], m: 4, b: 7, x: 11 }),
  (index) => parallelLineQuestion(index, "standard", { context: contexts[9], segment: "PQ" }),
  (index) => challengeProofQuestion(index, "standard", {
    context: contexts[0],
    claim: "Both triangles have angle sums of 180 degrees, so they are similar.",
    correct: "The proof is invalid because every triangle has angle sum 180 degrees.",
    distractors: [
      "The proof is valid because 180 degrees is a matching angle.",
      "The proof is valid only when the triangles are acute.",
      "The proof proves congruence instead of similarity.",
    ],
    explanation: "All triangles have angle sum 180 degrees. AA needs specific corresponding angles to match.",
  }),
  (index) => indirectAngleQuestion(index, "standard", { context: contexts[1], given: 57, other: 38 }),
  (index) => scaleFactorProofQuestion(index, "standard", { context: contexts[2], num: 3, den: 4 }),
  (index) => correspondenceQuestion(index, "standard", {
    context: contexts[3],
    correct: "Side AC corresponds to side DF.",
    distractors: ["Side AC corresponds to side DE.", "Side BC corresponds to side DF.", "Side AB corresponds to side EF."],
  }),
  (index) => anglePairQuestion(index, "standard", { context: contexts[4], triangleA: [41, 59], triangleB: [80, 41], similar: true }),
  (index) => algebraAngleQuestion(index, "standard", { context: contexts[5], m: 5, b: 9, x: 9 }),
  (index) => enoughInfoQuestion(index, "standard", { context: contexts[6], evidence: "a vertical angle pair and one alternate interior angle pair", enough: true }),
  (index) => enoughInfoQuestion(index, "standard", { context: contexts[7], evidence: "a right angle in both triangles but no other angle information", enough: false }),
  (index) => missingThirdQuestion(index, "standard", { context: contexts[8], known: [33, 47], match: 100, need: 47 }),
  (index) => parallelLineQuestion(index, "standard", { context: contexts[9], segment: "ST" }),
  (index) => challengeProofQuestion(index, "standard", {
    context: contexts[0],
    claim: "If two angles in Triangle A match two angles in Triangle B, the third pair must also match.",
    correct: "The claim is correct because each triangle's angles sum to 180 degrees.",
    distractors: [
      "The claim is incorrect because the third angles can be any size.",
      "The claim is correct only when the triangles are congruent.",
      "The claim is incorrect because AA requires side lengths.",
    ],
    explanation: "If two pairs of angles match, the remaining angles must also match because both angle sums are 180 degrees.",
  }),
  (index) => indirectAngleQuestion(index, "standard", { context: contexts[1], given: 63, other: 49 }),
  (index) => algebraAngleQuestion(index, "standard", { context: contexts[2], m: 2, b: 31, x: 14 }),
  (index) => scaleFactorProofQuestion(index, "standard", { context: contexts[3], num: 7, den: 5 }),
  (index) => anglePairQuestion(index, "standard", { context: contexts[4], triangleA: [28, 64], triangleB: [88, 28], similar: true }),
];
coreBuilders.push(...standardItems);

const challengeItems = [
  (index) => challengeProofQuestion(index, "challenge", {
    context: contexts[0],
    claim: "The triangles have proportional side lengths, so AA similarity is proven.",
    correct: "The conclusion may be true, but that statement is not an AA proof.",
    distractors: [
      "The statement is an AA proof because side ratios are angles.",
      "The statement proves the triangles are congruent.",
      "The statement proves the triangles are not similar.",
    ],
    explanation: "AA specifically uses two matching angle pairs. Proportional sides are different evidence for similarity.",
  }),
  (index) => algebraAngleQuestion(index, "challenge", { context: contexts[1], m: 6, b: 3, x: 12 }),
  (index) => indirectAngleQuestion(index, "challenge", { context: contexts[2], given: 34, other: 83 }),
  (index) => parallelLineQuestion(index, "challenge", { context: contexts[3], segment: "UV" }),
  (index) => challengeProofQuestion(index, "challenge", {
    context: contexts[4],
    claim: "Two triangles are both right triangles, so they are similar.",
    correct: "The proof is incomplete because the right angles give only one matching angle pair.",
    distractors: [
      "The proof is complete because all right triangles are similar.",
      "The proof is complete if one triangle is larger.",
      "The proof is invalid because right triangles can never be similar.",
    ],
    explanation: "Both having a 90 degree angle is one match. AA still needs one more corresponding angle pair.",
  }),
  (index) => missingThirdQuestion(index, "challenge", { context: contexts[5], known: [24, 96], match: 60, need: 24 }),
  (index) => algebraAngleQuestion(index, "challenge", { context: contexts[6], m: 7, b: 5, x: 8 }),
  (index) => correspondenceQuestion(index, "challenge", {
    context: contexts[7],
    correct: "Side BC corresponds to side EF.",
    distractors: ["Side BC corresponds to side DE.", "Side AB corresponds to side DF.", "Side AC corresponds to side EF."],
  }),
  (index) => anglePairQuestion(index, "challenge", { context: contexts[8], triangleA: [39, 76], triangleB: [65, 39], similar: true }),
  (index) => challengeProofQuestion(index, "challenge", {
    context: contexts[9],
    claim: "A dilation followed by a rotation maps one triangle onto another, so corresponding angles match.",
    correct: "The reasoning supports similarity because dilations and rigid motions preserve angle measures.",
    distractors: [
      "The reasoning proves congruence because dilations preserve all side lengths.",
      "The reasoning fails because rotations change angle measures.",
      "The reasoning fails because similar figures cannot be transformed.",
    ],
    explanation: "Rigid motions preserve angles, and dilations also preserve angle measures. Matching angles support similarity.",
  }),
  (index) => indirectAngleQuestion(index, "challenge", { context: contexts[0], given: 72, other: 41 }),
  (index) => scaleFactorProofQuestion(index, "challenge", { context: contexts[1], num: 9, den: 4 }),
  (index) => parallelLineQuestion(index, "challenge", { context: contexts[2], segment: "WX" }),
  (index) => algebraAngleQuestion(index, "challenge", { context: contexts[3], m: 8, b: 2, x: 7 }),
  (index) => challengeProofQuestion(index, "challenge", {
    context: contexts[4],
    claim: "The triangles have one shared angle and one pair of angles formed by parallel lines.",
    correct: "That is enough for AA similarity.",
    distractors: [
      "That is not enough because the triangles need three measured sides.",
      "That proves congruence but not similarity.",
      "That is not enough because shared angles do not count.",
    ],
    explanation: "The shared angle is one matching pair, and the parallel-line angles give a second matching pair. AA applies.",
  }),
];
coreBuilders.push(...challengeItems);

if (coreBuilders.length !== 50) {
  throw new Error(`Expected 50 core builders, found ${coreBuilders.length}`);
}

const reviewBuilders = [
  ...coreBuilders.slice(0, 8).map((builder) => (index) => ({ ...builder(index), difficulty: "scaffold" })),
  ...standardItems.slice(0, 12).map((builder) => (index) => ({ ...builder(index), difficulty: "standard" })),
];

function buildBank({ testId, type, title, description, builders }) {
  const positions = choosePositions(builders.length);
  return {
    testId,
    conceptId: "concept-angle-angle-similarity",
    type,
    title,
    description,
    questions: builders.map((builder, index) =>
      makeQuestion(
        {
          id: `${testId}-${String(index + 1).padStart(3, "0")}`,
          ...builder(index),
        },
        positions[index],
      ),
    ),
  };
}

const coreBank = buildBank({
  testId: "course3-angle-angle-similarity-core",
  type: "concept",
  title: "Angle-Angle Similarity Core Test",
  description: "Use two matching angle pairs, triangle angle sums, correspondence, parallel-line angle relationships, and proof critique to establish triangle similarity by AA.",
  builders: coreBuilders,
});

const reviewBank = buildBank({
  testId: "course3-angle-angle-similarity-review",
  type: "review",
  title: "Angle-Angle Similarity Review Test",
  description: "Review Angle-Angle similarity through missing angles, proof evidence, correspondence, and parallel-line reasoning.",
  builders: reviewBuilders,
});

await fs.writeFile(`${outDir}/course3-angle-angle-similarity-core.json`, `${JSON.stringify(coreBank, null, 2)}\n`);
await fs.writeFile(`${outDir}/course3-angle-angle-similarity-review.json`, `${JSON.stringify(reviewBank, null, 2)}\n`);

console.log("Generated Angle-Angle Similarity Course 3 banks.");
