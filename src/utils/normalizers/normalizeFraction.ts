import type { NormalizedAnswerValue } from "./normalizeNumber";
import { normalizeNumericString } from "./normalizeNumber";
import { gcd } from "../math";

export function normalizeFraction(value: string): NormalizedAnswerValue | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  const numerator = normalizeNumericString(match[1]);
  const denominator = normalizeNumericString(match[2]);

  if (numerator === "" || denominator === "") {
    return null;
  }

  const denominatorValue = Number(denominator);
  if (denominatorValue === 0) {
    return null;
  }

  let simplifiedNumerator = numerator;
  let simplifiedDenominator = denominator;

  if (/^-?\d+$/.test(numerator) && /^-?\d+$/.test(denominator)) {
    let numeratorValue = Number(numerator);
    let denominatorInt = Number(denominator);

    if (denominatorInt < 0) {
      numeratorValue *= -1;
      denominatorInt *= -1;
    }

    const divisor = gcd(numeratorValue, denominatorInt);
    simplifiedNumerator = (numeratorValue / divisor).toString();
    simplifiedDenominator = (denominatorInt / divisor).toString();
  }

  const originalCanonical = `${numerator}/${denominator}`;
  const canonical = `${simplifiedNumerator}/${simplifiedDenominator}`;

  return {
    answerType: "fraction",
    canonical,
    numericValue: Number(numerator) / denominatorValue,
    notation: "fraction",
    originalCanonical,
    wasSimplified: canonical !== originalCanonical,
  };
}
