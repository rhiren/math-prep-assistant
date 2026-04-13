import type { NormalizedAnswerValue } from "./normalizeNumber";
import { normalizeNumericString } from "./normalizeNumber";
import { gcd } from "../math";

export function normalizeRatio(value: string): NormalizedAnswerValue | null {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*([:/])\s*(-?\d+(?:\.\d+)?)$/);

  if (!match) {
    return null;
  }

  const left = normalizeNumericString(match[1]);
  const right = normalizeNumericString(match[3]);

  if (left === "" || right === "") {
    return null;
  }

  const rightValue = Number(right);
  if (rightValue === 0) {
    return null;
  }

  let simplifiedLeft = left;
  let simplifiedRight = right;

  if (/^-?\d+$/.test(left) && /^-?\d+$/.test(right)) {
    let leftValue = Number(left);
    let rightInt = Number(right);

    if (rightInt < 0) {
      leftValue *= -1;
      rightInt *= -1;
    }

    const divisor = gcd(leftValue, rightInt);
    simplifiedLeft = (leftValue / divisor).toString();
    simplifiedRight = (rightInt / divisor).toString();
  }

  const originalCanonical = `${left}:${right}`;
  const canonical = `${simplifiedLeft}:${simplifiedRight}`;

  return {
    answerType: "ratio",
    canonical,
    numericValue: Number(left) / rightValue,
    notation: match[2] === "/" ? "slash-ratio" : "colon-ratio",
    originalCanonical,
    wasSimplified: canonical !== originalCanonical,
  };
}
