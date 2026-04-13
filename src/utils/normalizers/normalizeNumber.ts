import type { AnswerType } from "../../domain/models";

export interface NormalizedAnswerValue {
  answerType: AnswerType;
  canonical: string;
  numericValue: number | null;
  notation: string;
  originalCanonical: string;
  wasSimplified: boolean;
}

export function normalizeNumericString(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }

  const numeric = Number(trimmed);
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
    return "";
  }

  return Object.is(numeric, -0) ? "0" : numeric.toString();
}

export function normalizeNumber(
  value: string,
  answerType: "number" | "decimal",
): NormalizedAnswerValue | null {
  const trimmed = value.trim();
  const canonical = normalizeNumericString(value);
  if (canonical === "") {
    return null;
  }

  return {
    answerType,
    canonical,
    numericValue: Number(canonical),
    notation: trimmed.includes(".") ? "decimal" : "integer",
    originalCanonical: canonical,
    wasSimplified: false,
  };
}
