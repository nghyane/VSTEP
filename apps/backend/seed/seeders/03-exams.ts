import type { DbTransaction } from "../../src/db/index";
import type { NewExam } from "../../src/db/schema/exams";
import { table } from "../../src/db/schema/index";
import type { ExamBlueprint } from "../../src/db/types/exam-blueprint";
import { logResult, logSection, SKILLS } from "../utils";
import type { SeededQuestions } from "./02-questions";

type Level = NewExam["level"];

export interface SeededExams {
  all: Array<{ id: string; level: string }>;
}

export async function seedExams(
  db: DbTransaction,
  adminId: string,
  questions: SeededQuestions["all"],
): Promise<SeededExams> {
  logSection("Exams");

  const examConfigs: Array<{
    level: Level;
    title: string;
    description: string | undefined;
  }> = [
    {
      level: "B1",
      title: "Đề thi thử VSTEP B1 - Đề số 1",
      description:
        "Đề thi thử trình độ B1 gồm 4 kỹ năng: Nghe, Đọc, Viết, Nói. Thời gian làm bài 150 phút.",
    },
    {
      level: "B2",
      title: "Đề thi thử VSTEP B2 - Đề số 1",
      description:
        "Đề thi thử trình độ B2 gồm 4 kỹ năng: Nghe, Đọc, Viết, Nói. Thời gian làm bài 150 phút.",
    },
  ];

  const examsToInsert: NewExam[] = examConfigs.map((config) => ({
    title: config.title,
    description: config.description,
    level: config.level,
    blueprint: buildBlueprint(questions, config.level),
    isActive: true,
    createdBy: adminId,
  }));

  const inserted = await db
    .insert(table.exams)
    .values(examsToInsert)
    .returning({ id: table.exams.id, level: table.exams.level });

  for (const exam of inserted) {
    console.log(`  ${exam.level} exam: ${exam.id}`);
  }

  logResult("Exams", inserted.length);

  return { all: inserted };
}

function buildBlueprint(
  questions: SeededQuestions["all"],
  _level: string,
): ExamBlueprint {
  const blueprint: ExamBlueprint = { durationMinutes: 150 };

  for (const skill of SKILLS) {
    // Pick first few questions per skill for this exam
    const ids = questions
      .filter((q) => q.skill === skill)
      .slice(0, 4)
      .map((q) => q.id);
    if (ids.length > 0) {
      blueprint[skill] = { questionIds: ids };
    }
  }

  return blueprint;
}
