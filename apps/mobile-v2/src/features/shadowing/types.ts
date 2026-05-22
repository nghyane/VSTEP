// Shadowing practice types — mirror apps/frontend-v3/src/features/practice/types.ts
// Lesson-based shadowing: each lesson has multiple segments with text + IPA +
// translation. User shadows each segment, accuracy compared word-by-word.

import type { WordCompareResult } from "@/lib/word-compare";

export interface ShadowingLesson {
  id: string;
  slug: string;
  title: string;
  level: string;
  segmentCount: number;
  estimatedMinutes: number | null;
}

export interface ShadowingSegment {
  id: string;
  index: number;
  text: string;
  ipa: string;
  translation: string;
  wordCount: number;
  audioStart: number;
  audioEnd: number;
}

export interface ShadowingLessonDetail {
  id: string;
  slug: string;
  title: string;
  level: string;
  audioUrl: string;
  segments: ShadowingSegment[];
}

export interface ShadowingAttemptResult {
  transcript: string;
  wordResults: WordCompareResult[];
  correctCount: number;
}

export interface ShadowingProgressEntry {
  segmentIndex: number;
  accuracyPercent: number;
}

export type ShadowingProgressMap = Record<string, ShadowingProgressEntry[]>;
