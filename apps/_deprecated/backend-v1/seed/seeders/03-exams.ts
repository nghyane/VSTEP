import { inArray } from "drizzle-orm";
import type { DbTransaction } from "../../src/db/index";
import type { NewExam } from "../../src/db/schema/exams";
import { table } from "../../src/db/schema/index";
import type { ExamBlueprint } from "../../src/db/types/exam-blueprint";
import { validateVstepExamBlueprint } from "../../src/modules/exams/blueprint-validation";
import { logResult, logSection } from "../utils";
import type { SeededQuestionRow, SeededQuestions } from "./02-questions";

type Level = NewExam["level"];

export interface SeededExams {
  all: Array<{
    id: string;
    level: string;
    type: string;
    blueprint: ExamBlueprint;
  }>;
}

export async function seedExams(
  db: DbTransaction,
  adminId: string,
  questions: SeededQuestions,
): Promise<SeededExams> {
  logSection("Exams");

  const standardB1Blueprint = buildStandardBlueprint(questions.standard, "B1");
  const standardB2Blueprint = buildStandardBlueprint(questions.standard, "B2");
  const standardC1Blueprint = buildStandardBlueprint(questions.standard, "C1");

  await validateBlueprint(db, standardB1Blueprint);
  await validateBlueprint(db, standardB2Blueprint);
  await validateBlueprint(db, standardC1Blueprint);

  const examConfigs: Array<{
    level: Level;
    title: string;
    description: string | undefined;
    blueprint: ExamBlueprint;
    type?: NewExam["type"];
  }> = [
    {
      level: "B1",
      title: "[SEED][VSTEP-STD] B1 Standard Exam",
      description:
        "Seeded VSTEP standard exam for B1 with full 4-skill blueprint.",
      blueprint: standardB1Blueprint,
    },
    {
      level: "B2",
      title: "[SEED][VSTEP-STD] B2 Standard Exam",
      description:
        "Seeded VSTEP standard exam for B2 with full 4-skill blueprint.",
      blueprint: standardB2Blueprint,
    },
    {
      level: "C1",
      title: "[SEED][VSTEP-STD] C1 Standard Exam",
      description:
        "Seeded VSTEP standard exam for C1 with full 4-skill blueprint.",
      blueprint: standardC1Blueprint,
    },
    {
      level: "B1",
      type: "placement",
      title: "Bài kiểm tra xếp lớp VSTEP",
      description:
        "Bài kiểm tra đầu vào để xác định trình độ hiện tại của học viên.",
      blueprint: standardB1Blueprint,
    },
  ];

  const examsToInsert: NewExam[] = examConfigs.map((config) => ({
    title: config.title,
    description: config.description,
    level: config.level,
    type: config.type,
    durationMinutes: 172,
    blueprint: config.blueprint,
    isActive: true,
    createdBy: adminId,
  }));

  const inserted = await db
    .insert(table.exams)
    .values(examsToInsert)
    .returning({
      id: table.exams.id,
      level: table.exams.level,
      type: table.exams.type,
      blueprint: table.exams.blueprint,
    });

  for (const exam of inserted) {
    console.log(`  ${exam.level} exam: ${exam.id}`);
  }

  logResult("Exams", inserted.length);

  return { all: inserted };
}

function buildStandardBlueprint(
  questions: SeededQuestionRow[],
  level: Level,
): ExamBlueprint {
  const pick = (skill: string, part: number): string => {
    const selected = questions.find(
      (question) =>
        question.level === level &&
        question.skill === skill &&
        question.part === part,
    );

    if (!selected) {
      throw new Error(
        `Missing standard seed question for level ${level}, skill ${skill}, part ${part}`,
      );
    }

    return selected.id;
  };

  return {
    durationMinutes: 172,
    listening: {
      questionIds: [
        pick("listening", 1),
        pick("listening", 2),
        pick("listening", 3),
      ],
    },
    reading: {
      questionIds: [
        pick("reading", 1),
        pick("reading", 2),
        pick("reading", 3),
        pick("reading", 4),
      ],
    },
    writing: {
      questionIds: [pick("writing", 1), pick("writing", 2)],
    },
    speaking: {
      questionIds: [
        pick("speaking", 1),
        pick("speaking", 2),
        pick("speaking", 3),
      ],
    },
  };
}

async function validateBlueprint(
  db: DbTransaction,
  blueprint: ExamBlueprint,
): Promise<void> {
  const questionIds = [
    ...(blueprint.listening?.questionIds ?? []),
    ...(blueprint.reading?.questionIds ?? []),
    ...(blueprint.writing?.questionIds ?? []),
    ...(blueprint.speaking?.questionIds ?? []),
  ];

  const selectedQuestions = await db
    .select({
      id: table.questions.id,
      skill: table.questions.skill,
      part: table.questions.part,
      content: table.questions.content,
    })
    .from(table.questions)
    .where(inArray(table.questions.id, questionIds));

  validateVstepExamBlueprint(blueprint, selectedQuestions);
}
