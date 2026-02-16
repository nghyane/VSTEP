import type { Actor } from "@common/auth-types";
import { db, table } from "@db/index";
import { SKILLS } from "@db/schema/enums";
import { and, eq, isNull } from "drizzle-orm";
import { atRisk, forUsers } from "@/modules/progress/instructor";
import { assertActiveMember, assertClassOwner } from "./guards";

export async function dashboard(classId: string, actor: Actor) {
  await assertClassOwner(classId, actor);

  const members = await db
    .select({
      userId: table.classMembers.userId,
      fullName: table.users.fullName,
      email: table.users.email,
    })
    .from(table.classMembers)
    .innerJoin(table.users, eq(table.users.id, table.classMembers.userId))
    .where(
      and(
        eq(table.classMembers.classId, classId),
        isNull(table.classMembers.removedAt),
      ),
    );

  const userIds = members.map((m) => m.userId);
  const progress = await forUsers(userIds);
  const risks = await atRisk(userIds, progress);

  const skillSummary = Object.fromEntries(
    SKILLS.map((skill) => {
      const avgs: number[] = [];
      const trendCounts = { improving: 0, stable: 0, declining: 0 };

      for (const p of progress) {
        const s = p.skills[skill];
        if (s?.avg !== null && s?.avg !== undefined) avgs.push(s.avg);
        if (s?.trend && s.trend in trendCounts) {
          trendCounts[s.trend as keyof typeof trendCounts]++;
        }
      }

      const avgScore =
        avgs.length > 0
          ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) /
            10
          : null;

      return [skill, { avgScore, trendDistribution: trendCounts }];
    }),
  );

  const memberMap = new Map(members.map((m) => [m.userId, m]));

  const atRiskLearners = risks
    .filter((r) => r.atRisk)
    .map((r) => {
      const member = memberMap.get(r.userId);
      return {
        userId: r.userId,
        fullName: member?.fullName ?? null,
        email: member?.email ?? "",
        reasons: r.reasons,
      };
    });

  return {
    memberCount: userIds.length,
    atRiskCount: atRiskLearners.length,
    atRiskLearners,
    skillSummary,
  };
}

export async function memberProgress(
  classId: string,
  userId: string,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);
  await assertActiveMember(classId, userId);

  const [result] = await forUsers([userId]);
  return result ?? null;
}
