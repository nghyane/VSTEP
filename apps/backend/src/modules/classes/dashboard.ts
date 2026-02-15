import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { ForbiddenError } from "@common/errors";
import { assertExists } from "@common/utils";
import { SKILLS } from "@db/enums";
import { db, table } from "@db/index";
import { and, eq, isNull } from "drizzle-orm";
import {
  getAtRiskLearners,
  getProgressForUsers,
} from "@/modules/progress/instructor";

async function assertClassOwner(classId: string, actor: Actor) {
  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
    }),
    "Class",
  );
  if (!actor.is(ROLES.ADMIN) && cls.instructorId !== actor.sub) {
    throw new ForbiddenError(
      "Only the class instructor can perform this action",
    );
  }
  return cls;
}

async function assertActiveMember(classId: string, userId: string) {
  return assertExists(
    await db.query.classMembers.findFirst({
      where: and(
        eq(table.classMembers.classId, classId),
        eq(table.classMembers.userId, userId),
        isNull(table.classMembers.removedAt),
      ),
    }),
    "Class member",
  );
}

export async function getDashboard(classId: string, actor: Actor) {
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
  const progressData = await getProgressForUsers(userIds);
  const atRiskData = await getAtRiskLearners(userIds, progressData);

  const skillSummary = Object.fromEntries(
    SKILLS.map((skill) => {
      const avgs: number[] = [];
      const trendCounts = { improving: 0, stable: 0, declining: 0 };

      for (const p of progressData) {
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

  const atRiskLearners = atRiskData
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

export async function getMemberProgress(
  classId: string,
  userId: string,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);
  await assertActiveMember(classId, userId);

  const [result] = await getProgressForUsers([userId]);
  return result ?? null;
}
