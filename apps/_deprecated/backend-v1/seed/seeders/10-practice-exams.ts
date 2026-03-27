import type { DbTransaction } from "../../src/db/index";
import type { NewExam } from "../../src/db/schema/exams";
import { table } from "../../src/db/schema/index";
import type { ExamBlueprint } from "../../src/db/types/exam-blueprint";
import { logResult, logSection, SKILLS } from "../utils";
import type { SeededQuestions } from "./02-questions";

export async function seedPracticeExams(
  db: DbTransaction,
  adminId: string,
  questions: SeededQuestions["all"],
): Promise<void> {
  logSection("Practice Exams");

  const SKILL_LABELS: Record<string, string> = {
    listening: "Nghe",
    reading: "Đọc",
    writing: "Viết",
    speaking: "Nói",
  };

  const DURATIONS: Record<string, number> = {
    listening: 47,
    reading: 60,
    writing: 60,
    speaking: 12,
  };

  const exams: NewExam[] = [];

  for (const skill of SKILLS) {
    const skillQuestions = questions.filter((q) => q.skill === skill);
    if (skillQuestions.length === 0) continue;

    // Group questions by part
    const byPart = new Map<number, string[]>();
    for (const q of skillQuestions) {
      const ids = byPart.get(q.part) ?? [];
      ids.push(q.id);
      byPart.set(q.part, ids);
    }

    // Each practice exam = 1 question per part (like a real exam)
    // Number of exams = min questions across parts
    const parts = [...byPart.keys()].sort();
    const examCount = Math.min(...parts.map((p) => byPart.get(p)?.length ?? 0));

    for (let i = 0; i < examCount; i++) {
      const blueprint: ExamBlueprint = {
        durationMinutes: DURATIONS[skill] ?? 60,
      };

      const ids: string[] = [];
      for (const part of parts) {
        const partIds = byPart.get(part) ?? [];
        ids.push(partIds[i]);
      }

      blueprint[skill] = { questionIds: ids };

      exams.push({
        title: `Luyện tập ${SKILL_LABELS[skill]} - Đề ${i + 1}`,
        description: `Đề luyện tập kỹ năng ${SKILL_LABELS[skill]} VSTEP.`,
        level: "B1",
        type: "practice",
        skill,
        durationMinutes: DURATIONS[skill] ?? 60,
        blueprint,
        isActive: true,
        createdBy: adminId,
      });
    }
  }

  if (exams.length > 0) {
    await db.insert(table.exams).values(exams);
  }

  logResult("Practice exams", exams.length);
}
