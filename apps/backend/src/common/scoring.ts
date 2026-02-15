import { ObjectiveAnswer, ObjectiveAnswerKey } from "@db/types/answers";
import { Value } from "@sinclair/typebox/value";

export const BAND_THRESHOLDS = {
  C1: 8.5,
  B2: 6.0,
  B1: 4.0,
} as const;

export type VstepBand = "B1" | "B2" | "C1" | null;

/** Scores below B1 (4.0) return null */
export function scoreToBand(score: number): VstepBand {
  if (score < 0) return null;
  if (score >= BAND_THRESHOLDS.C1) return "C1";
  if (score >= BAND_THRESHOLDS.B2) return "B2";
  if (score >= BAND_THRESHOLDS.B1) return "B1";
  return null;
}

// Simplified linear mapping for demo — real VSTEP uses non-linear conversion tables
export function calculateScore(correct: number, total: number): number | null {
  if (total === 0) return null;
  const ratio = Math.min(correct / total, 1);
  return Math.round(ratio * 10 * 2) / 2;
}

/** Normalize for comparison: trim, collapse whitespace, lowercase */
export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function parseAnswerKey(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswerKey, raw)) return raw.correctAnswers;
  return {};
}

/** Falls back to extracting string values from plain objects */
export function parseUserAnswer(raw: unknown): Record<string, string> {
  if (Value.Check(ObjectiveAnswer, raw)) return raw.answers;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const entries = Object.entries(raw as Record<string, unknown>).filter(
      ([, v]) => typeof v === "string",
    );
    if (entries.length > 0)
      return Object.fromEntries(entries) as Record<string, string>;
  }
  return {};
}
