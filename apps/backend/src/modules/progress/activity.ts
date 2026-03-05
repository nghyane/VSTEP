import { db, table } from "@db/index";
import { eq, sql } from "drizzle-orm";

export async function activity(userId: string, days: number) {
  const rows = await db
    .selectDistinctOn([sql`DATE(${table.userSkillScores.createdAt})`], {
      date: sql<string>`DATE(${table.userSkillScores.createdAt})::text`.as(
        "date",
      ),
    })
    .from(table.userSkillScores)
    .where(eq(table.userSkillScores.userId, userId))
    .orderBy(sql`DATE(${table.userSkillScores.createdAt}) DESC`);

  let streak = 0;
  const first = rows[0];
  if (first) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expected = today;
    const firstDate = new Date(first.date);
    firstDate.setHours(0, 0, 0, 0);

    if (firstDate.getTime() < today.getTime()) {
      expected = new Date(today);
      expected.setDate(expected.getDate() - 1);
    }

    for (const row of rows) {
      const d = new Date(row.date);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === expected.getTime()) {
        streak++;
        expected = new Date(expected);
        expected.setDate(expected.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const activeDays = rows.filter((r) => r.date >= cutoffStr).map((r) => r.date);

  return { streak, total: rows.length, activeDays };
}
