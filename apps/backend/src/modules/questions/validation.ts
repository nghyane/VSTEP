import { BadRequestError } from "@common/errors";
import {
  ListeningDictationContent,
  ListeningMCQContent,
  ReadingGapFillContent,
  ReadingMatchingHeadingsContent,
  ReadingMCQContent,
  ReadingTNGContent,
  SpeakingPart1Content,
  SpeakingPart2Content,
  SpeakingPart3Content,
  WritingTask1Content,
  WritingTask2Content,
} from "@db/types/question-content";
import type { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const CONTENT_SCHEMAS: Record<string, TSchema> = {
  writing_task_1: WritingTask1Content,
  writing_task_2: WritingTask2Content,
  speaking_part_1: SpeakingPart1Content,
  speaking_part_2: SpeakingPart2Content,
  speaking_part_3: SpeakingPart3Content,
  reading_mcq: ReadingMCQContent,
  reading_tng: ReadingTNGContent,
  reading_matching_headings: ReadingMatchingHeadingsContent,
  reading_gap_fill: ReadingGapFillContent,
  listening_mcq: ListeningMCQContent,
  listening_dictation: ListeningDictationContent,
};

const SUBJECTIVE_FORMATS = new Set([
  "writing_task_1",
  "writing_task_2",
  "speaking_part_1",
  "speaking_part_2",
  "speaking_part_3",
]);

const ABCD = new Set(["A", "B", "C", "D"]);
const ABC = new Set(["A", "B", "C"]);

// Objective formats → allowed answer values (null = any non-empty string)
const ALLOWED_VALUES: Record<string, Set<string> | null> = {
  reading_mcq: ABCD,
  listening_mcq: ABCD,
  reading_tng: ABC,
  reading_matching_headings: null,
  listening_dictation: null,
};

export function assertContentMatchesFormat(
  format: string,
  content: unknown,
): void {
  const schema = CONTENT_SCHEMAS[format];
  if (!schema) throw new BadRequestError(`Unknown question format '${format}'`);
  if (!Value.Check(schema, content))
    throw new BadRequestError(`Content does not match format '${format}'`);
}

export function assertAnswerKeyMatchesFormat(
  format: string,
  content: unknown,
  answerKey: unknown,
): void {
  if (SUBJECTIVE_FORMATS.has(format)) {
    if (answerKey != null)
      throw new BadRequestError(
        `Answer key must not be provided for subjective format '${format}'`,
      );
    return;
  }

  const answers = requireAnswerKey(answerKey, format);
  const items = extractItemNumbers(content);
  assertKeysMatchItems(Object.keys(answers), items, format);

  // Gap fill is special: each item may be MCQ or free-text
  if (format === "reading_gap_fill") {
    assertGapFillValues(content, answers, format);
    return;
  }

  const allowed = ALLOWED_VALUES[format];
  if (allowed) {
    assertValuesInSet(answers, allowed, format);
  } else {
    assertValuesNonEmpty(answers, format);
  }
}

function requireAnswerKey(
  answerKey: unknown,
  format: string,
): Record<string, string> {
  if (answerKey == null)
    throw new BadRequestError(`Answer key is required for format '${format}'`);
  if (
    typeof answerKey !== "object" ||
    !("correctAnswers" in answerKey) ||
    typeof answerKey.correctAnswers !== "object" ||
    answerKey.correctAnswers === null
  )
    throw new BadRequestError(
      `Answer key must have a 'correctAnswers' object for format '${format}'`,
    );
  return answerKey.correctAnswers as Record<string, string>;
}

function extractItemNumbers(content: unknown): string[] {
  if (typeof content !== "object" || content === null) return [];
  if (!("items" in content) || !Array.isArray(content.items)) return [];
  return content.items
    .filter(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "number" in item &&
        (typeof item.number === "number" || typeof item.number === "string"),
    )
    .map((item: { number: number | string }) => String(item.number));
}

function assertKeysMatchItems(
  keys: string[],
  items: string[],
  format: string,
): void {
  const itemSet = new Set(items);
  if (keys.length !== itemSet.size)
    throw new BadRequestError(
      `Answer key has ${keys.length} entries but content has ${itemSet.size} items for format '${format}'`,
    );
  for (const key of keys) {
    if (!itemSet.has(key))
      throw new BadRequestError(
        `Answer key contains unknown item number '${key}' for format '${format}'`,
      );
  }
}

function assertValuesInSet(
  answers: Record<string, string>,
  allowed: Set<string>,
  format: string,
): void {
  for (const [key, value] of Object.entries(answers)) {
    if (!allowed.has(value.toUpperCase()))
      throw new BadRequestError(
        `Answer key value '${value}' for item ${key} is invalid for format '${format}' — must be one of ${[...allowed].join(", ")}`,
      );
  }
}

function assertValuesNonEmpty(
  answers: Record<string, string>,
  format: string,
): void {
  for (const [key, value] of Object.entries(answers)) {
    if (!value.trim())
      throw new BadRequestError(
        `Answer key value for item ${key} must not be empty for format '${format}'`,
      );
  }
}

function assertGapFillValues(
  content: unknown,
  answers: Record<string, string>,
  format: string,
): void {
  if (typeof content !== "object" || content === null) return;
  if (!("items" in content) || !Array.isArray(content.items)) return;

  const items = new Map<string, { options?: unknown }>();
  for (const item of content.items) {
    if (typeof item === "object" && item !== null && "number" in item)
      items.set(String(item.number), item as { options?: unknown });
  }

  for (const [key, value] of Object.entries(answers)) {
    const item = items.get(key);
    if (!item) continue;

    if (item.options != null && typeof item.options === "object") {
      if (!ABCD.has(value.toUpperCase()))
        throw new BadRequestError(
          `Answer key value '${value}' for MCQ gap item ${key} must be A, B, C, or D for format '${format}'`,
        );
    } else if (!value.trim()) {
      throw new BadRequestError(
        `Answer key value for free-text gap item ${key} must not be empty for format '${format}'`,
      );
    }
  }
}
