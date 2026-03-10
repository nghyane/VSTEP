import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type { NewQuestion } from "../../src/db/schema/questions";
import {
  logResult,
  logSection,
  readSeedFiles,
  type SeedRecord,
  SKILLS,
} from "../utils";

type QuestionLevel = NewQuestion["level"];

export interface SeededQuestionRow {
  id: string;
  skill: string;
  part: number;
  level: string;
  seedRef?: string;
}

export interface SeededQuestions {
  all: SeededQuestionRow[];
  standard: SeededQuestionRow[];
}

export async function seedQuestions(
  db: DbTransaction,
  adminId: string,
): Promise<SeededQuestions> {
  logSection("Questions");

  const allRecords = (await Promise.all(SKILLS.map(readSeedFiles))).flat();
  const values = allRecords.map((r) => toQuestion(r, adminId));

  const insertedBase = await db
    .insert(table.questions)
    .values(values)
    .returning({
      id: table.questions.id,
      skill: table.questions.skill,
      part: table.questions.part,
      level: table.questions.level,
    });

  const standardFixtures = buildStandardFixtures(adminId);
  const insertedStandard = await db
    .insert(table.questions)
    .values(standardFixtures.map((fixture) => fixture.value))
    .returning({
      id: table.questions.id,
      skill: table.questions.skill,
      part: table.questions.part,
      level: table.questions.level,
      explanation: table.questions.explanation,
    });

  const standard = insertedStandard.map((row) => ({
    id: row.id,
    skill: row.skill,
    part: row.part,
    level: row.level,
    seedRef: row.explanation ?? undefined,
  }));

  const inserted = [
    ...insertedBase,
    ...standard.map(({ seedRef, ...row }) => row),
  ];

  for (const skill of SKILLS) {
    const count = inserted.filter((r) => r.skill === skill).length;
    if (count > 0) logResult(`  ${skill}`, count);
  }
  logResult("  vstep standard fixtures", standard.length);
  logResult("Total questions", inserted.length);

  return { all: [...insertedBase, ...standard], standard };
}

function toQuestion(record: SeedRecord, createdBy: string): NewQuestion {
  return {
    skill: record.skill,
    level: record.level,
    part: record.part,
    content: record.content,
    answerKey: record.answerKey,
    createdBy,
  };
}

interface StandardQuestionFixture {
  ref: string;
  value: NewQuestion;
}

const STANDARD_LEVELS: QuestionLevel[] = ["B1", "B2", "C1"];

function buildStandardFixtures(createdBy: string): StandardQuestionFixture[] {
  const fixtures: StandardQuestionFixture[] = [];

  for (const level of STANDARD_LEVELS) {
    fixtures.push(
      makeListeningFixture(level, 1, 8, createdBy),
      makeListeningFixture(level, 2, 12, createdBy),
      makeListeningFixture(level, 3, 15, createdBy),
      makeReadingFixture(level, 1, createdBy),
      makeReadingFixture(level, 2, createdBy),
      makeReadingFixture(level, 3, createdBy),
      makeReadingFixture(level, 4, createdBy),
      makeWritingFixture(level, 1, createdBy),
      makeWritingFixture(level, 2, createdBy),
      makeSpeakingFixture(level, 1, createdBy),
      makeSpeakingFixture(level, 2, createdBy),
      makeSpeakingFixture(level, 3, createdBy),
    );
  }

  return fixtures;
}

function makeRef(level: string, skill: string, part: number): string {
  return `[SEED][VSTEP-STD] ${level} ${skill} part ${part}`;
}

function makeObjectiveAnswerKey(
  itemCount: number,
): NonNullable<NewQuestion["answerKey"]> {
  const correctAnswers: Record<string, string> = {};
  for (let i = 1; i <= itemCount; i++) {
    correctAnswers[String(i)] = String((i - 1) % 4);
  }
  return { correctAnswers };
}

function makeListeningFixture(
  level: QuestionLevel,
  part: 1 | 2 | 3,
  itemCount: number,
  createdBy: string,
): StandardQuestionFixture {
  const ref = makeRef(level, "listening", part);

  return {
    ref,
    value: {
      skill: "listening",
      level,
      part,
      content: {
        audioUrl: `https://seed.vstep.test/${level.toLowerCase()}/listening-part-${part}.mp3`,
        transcript: `${level} listening part ${part} transcript for seed exam generation.`,
        items: Array.from({ length: itemCount }, (_, idx) => ({
          stem: `${level} listening part ${part} question ${idx + 1}`,
          options: [
            `Option A${idx + 1}`,
            `Option B${idx + 1}`,
            `Option C${idx + 1}`,
            `Option D${idx + 1}`,
          ],
        })),
      },
      answerKey: makeObjectiveAnswerKey(itemCount),
      explanation: ref,
      createdBy,
    },
  };
}

function makeReadingFixture(
  level: QuestionLevel,
  part: 1 | 2 | 3 | 4,
  createdBy: string,
): StandardQuestionFixture {
  const ref = makeRef(level, "reading", part);

  return {
    ref,
    value: {
      skill: "reading",
      level,
      part,
      content: {
        title: `${level} Reading Part ${part}`,
        passage:
          `${level} reading passage for part ${part}. This is a seeded passage to validate standard VSTEP blueprint structure in local environments. ` +
          "Learners should identify details, infer meaning, and select the best answers from the provided options.",
        items: Array.from({ length: 10 }, (_, idx) => ({
          stem: `${level} reading part ${part} item ${idx + 1}`,
          options: [
            `Reading option A${idx + 1}`,
            `Reading option B${idx + 1}`,
            `Reading option C${idx + 1}`,
            `Reading option D${idx + 1}`,
          ],
        })),
      },
      answerKey: makeObjectiveAnswerKey(10),
      explanation: ref,
      createdBy,
    },
  };
}

function makeWritingFixture(
  level: QuestionLevel,
  part: 1 | 2,
  createdBy: string,
): StandardQuestionFixture {
  const ref = makeRef(level, "writing", part);
  const isTask1 = part === 1;

  return {
    ref,
    value: {
      skill: "writing",
      level,
      part,
      content: {
        prompt: isTask1
          ? `You should spend about 20 minutes on this task. Write a formal email to request support for a language learning workshop in your university. (${level})`
          : `You should spend about 40 minutes on this task. Write an essay discussing whether online learning can fully replace classroom education. (${level})`,
        taskType: isTask1 ? "letter" : "essay",
        minWords: isTask1 ? 120 : 250,
        instructions: isTask1
          ? [
              "State your purpose clearly.",
              "Provide two practical requests.",
              "Close with an appropriate formal ending.",
            ]
          : [
              "Present a clear position.",
              "Support ideas with examples.",
              "Conclude with a balanced recommendation.",
            ],
      },
      answerKey: null,
      explanation: ref,
      createdBy,
    },
  };
}

function makeSpeakingFixture(
  level: QuestionLevel,
  part: 1 | 2 | 3,
  createdBy: string,
): StandardQuestionFixture {
  const ref = makeRef(level, "speaking", part);

  if (part === 1) {
    return {
      ref,
      value: {
        skill: "speaking",
        level,
        part,
        content: {
          topics: [
            {
              name: "daily routine",
              questions: [
                "What do you usually do in the morning?",
                "Which part of your day is the busiest?",
                "How do you manage your study time?",
              ],
            },
            {
              name: "learning environment",
              questions: [
                "Where do you prefer to study?",
                "Do you study better alone or with friends?",
                "What helps you stay focused when studying?",
              ],
            },
          ],
        },
        answerKey: null,
        explanation: ref,
        createdBy,
      },
    };
  }

  if (part === 2) {
    return {
      ref,
      value: {
        skill: "speaking",
        level,
        part,
        content: {
          situation:
            "Your class will organize an English-speaking club activity this weekend.",
          options: [
            "Invite a guest speaker",
            "Hold a debate competition",
            "Organize a role-play workshop",
          ],
          preparationSeconds: 60,
          speakingSeconds: 120,
        },
        answerKey: null,
        explanation: ref,
        createdBy,
      },
    };
  }

  return {
    ref,
    value: {
      skill: "speaking",
      level,
      part,
      content: {
        centralIdea: "How universities can support students' mental well-being",
        suggestions: [
          "Provide peer mentoring programs",
          "Offer free counseling services",
          "Create flexible study schedules",
        ],
        followUpQuestion:
          "Which solution do you think is the most practical for your university, and why?",
        preparationSeconds: 60,
        speakingSeconds: 300,
      },
      answerKey: null,
      explanation: ref,
      createdBy,
    },
  };
}
