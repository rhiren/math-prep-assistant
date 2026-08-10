import { readdir, readFile, writeFile } from "node:fs/promises";

const testSetDir = "public/content/math/course3/test-sets";

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

function longestSequentialCycle(sequence) {
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

function longestSameRun(sequence) {
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
  if (longestSequentialCycle(sequence) > 2) return false;
  if (longestSameRun(sequence) > 2) return false;
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
  throw new Error(`Could not create strict answer sequence for ${seedText}`);
}

function placeCorrect(question, correctIndex) {
  const distractors = question.options.filter((option) => option !== question.correctAnswer);
  if (distractors.length !== 3) {
    throw new Error(`${question.id} does not have exactly three distractors`);
  }
  const ordered = shuffle(distractors, rng(hashSeed(`${question.id}:strict-distractors`)));
  ordered.splice(correctIndex, 0, question.correctAnswer);
  return { ...question, options: ordered };
}

const files = (await readdir(testSetDir)).filter((file) => file.endsWith(".json")).sort();

for (const file of files) {
  const path = `${testSetDir}/${file}`;
  const bank = JSON.parse(await readFile(path, "utf8"));
  const sequence = answerSequence(bank.questions.length, bank.testId ?? file);
  bank.questions = bank.questions.map((question, index) => placeCorrect(question, sequence[index]));
  await writeFile(path, `${JSON.stringify(bank, null, 2)}\n`);
  console.log(`${bank.testId ?? file}: ${sequence.map((index) => "ABCD"[index]).join("")}`);
}
