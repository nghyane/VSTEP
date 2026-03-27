import { BadRequestError } from "@common/errors";
import type { ExamBlueprint } from "@db/types/exam-blueprint";
import type { QuestionContent } from "@db/types/question-content";

const REQUIRED_SKILLS = [
  "listening",
  "reading",
  "writing",
  "speaking",
] as const;

type Skill = (typeof REQUIRED_SKILLS)[number];

const LISTENING_EXPECTED_PART_ITEMS: Record<number, number> = {
  1: 8,
  2: 12,
  3: 15,
};

const READING_EXPECTED_PART_ITEMS: Record<number, number> = {
  1: 10,
  2: 10,
  3: 10,
  4: 10,
};

type BlueprintQuestion = {
  id: string;
  skill: Skill;
  part: number;
  content: QuestionContent;
};

function getItemsCount(content: QuestionContent): number {
  if (typeof content !== "object" || content === null) return 0;

  if ("items" in content && Array.isArray(content.items)) {
    return content.items.length;
  }

  return 0;
}

function getMinWords(content: QuestionContent): number | null {
  if (typeof content !== "object" || content === null) return null;

  if ("minWords" in content && typeof content.minWords === "number") {
    return content.minWords;
  }

  return null;
}

function assertRequiredSkills(blueprint: ExamBlueprint): void {
  for (const skill of REQUIRED_SKILLS) {
    const questionIds = blueprint[skill]?.questionIds ?? [];
    if (questionIds.length === 0) {
      throw new BadRequestError(
        `Blueprint must include at least one ${skill} question`,
      );
    }
  }
}

function assertSkillOwnership(
  blueprint: ExamBlueprint,
  questionsById: Map<string, BlueprintQuestion>,
): void {
  for (const skill of REQUIRED_SKILLS) {
    const questionIds = blueprint[skill]?.questionIds ?? [];

    for (const questionId of questionIds) {
      const question = questionsById.get(questionId);
      if (!question) continue;

      if (question.skill !== skill) {
        throw new BadRequestError(
          `Question ${questionId} belongs to ${question.skill}, cannot be used in ${skill} blueprint`,
        );
      }
    }
  }
}

function assertListening(questions: BlueprintQuestion[]): void {
  const partTotals = new Map<number, number>();

  for (const question of questions) {
    const itemsCount = getItemsCount(question.content);
    partTotals.set(
      question.part,
      (partTotals.get(question.part) ?? 0) + itemsCount,
    );
  }

  for (const [part, expected] of Object.entries(
    LISTENING_EXPECTED_PART_ITEMS,
  )) {
    const partNumber = Number(part);
    const actual = partTotals.get(partNumber) ?? 0;

    if (actual !== expected) {
      throw new BadRequestError(
        `Listening part ${partNumber} must contain ${expected} items, found ${actual}`,
      );
    }
  }

  const total = [...partTotals.values()].reduce((sum, value) => sum + value, 0);
  if (total !== 35) {
    throw new BadRequestError(
      `Listening must contain exactly 35 items, found ${total}`,
    );
  }
}

function assertReading(questions: BlueprintQuestion[]): void {
  const partTotals = new Map<number, number>();

  for (const question of questions) {
    const itemsCount = getItemsCount(question.content);
    partTotals.set(
      question.part,
      (partTotals.get(question.part) ?? 0) + itemsCount,
    );
  }

  for (const [part, expected] of Object.entries(READING_EXPECTED_PART_ITEMS)) {
    const partNumber = Number(part);
    const actual = partTotals.get(partNumber) ?? 0;

    if (actual !== expected) {
      throw new BadRequestError(
        `Reading part ${partNumber} must contain ${expected} items, found ${actual}`,
      );
    }
  }

  const total = [...partTotals.values()].reduce((sum, value) => sum + value, 0);
  if (total !== 40) {
    throw new BadRequestError(
      `Reading must contain exactly 40 items, found ${total}`,
    );
  }
}

function assertWriting(questions: BlueprintQuestion[]): void {
  const byPart = new Map<number, BlueprintQuestion[]>();
  for (const question of questions) {
    const partItems = byPart.get(question.part) ?? [];
    partItems.push(question);
    byPart.set(question.part, partItems);
  }

  const task1Questions = byPart.get(1) ?? [];
  const task2Questions = byPart.get(2) ?? [];

  if (
    task1Questions.length !== 1 ||
    task2Questions.length !== 1 ||
    byPart.size !== 2
  ) {
    throw new BadRequestError(
      "Writing must contain exactly 2 tasks: part 1 (letter) and part 2 (essay)",
    );
  }

  const task1 = task1Questions[0];
  const task2 = task2Questions[0];
  if (!task1 || !task2) {
    throw new BadRequestError(
      "Writing must contain exactly 2 tasks: part 1 (letter) and part 2 (essay)",
    );
  }

  const task1MinWords = getMinWords(task1.content);
  const task2MinWords = getMinWords(task2.content);

  if (task1MinWords === null || task1MinWords < 120) {
    throw new BadRequestError(
      `Writing task 1 must require at least 120 words, found ${task1MinWords ?? 0}`,
    );
  }

  if (task2MinWords === null || task2MinWords < 250) {
    throw new BadRequestError(
      `Writing task 2 must require at least 250 words, found ${task2MinWords ?? 0}`,
    );
  }
}

function assertSpeaking(questions: BlueprintQuestion[]): void {
  const counts = new Map<number, number>();
  for (const question of questions) {
    counts.set(question.part, (counts.get(question.part) ?? 0) + 1);
  }

  for (const part of [1, 2, 3]) {
    const count = counts.get(part) ?? 0;
    if (count !== 1) {
      throw new BadRequestError(
        `Speaking part ${part} must contain exactly 1 question, found ${count}`,
      );
    }
  }

  if (counts.size !== 3) {
    throw new BadRequestError("Speaking must contain exactly 3 parts");
  }
}

export function validateVstepExamBlueprint(
  blueprint: ExamBlueprint,
  questions: BlueprintQuestion[],
): void {
  assertRequiredSkills(blueprint);

  const questionsById = new Map(
    questions.map((question) => [question.id, question]),
  );
  assertSkillOwnership(blueprint, questionsById);

  assertListening(
    questions.filter((question) => question.skill === "listening"),
  );
  assertReading(questions.filter((question) => question.skill === "reading"));
  assertWriting(questions.filter((question) => question.skill === "writing"));
  assertSpeaking(questions.filter((question) => question.skill === "speaking"));
}
