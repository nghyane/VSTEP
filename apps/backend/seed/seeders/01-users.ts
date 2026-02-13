import { table } from "../../src/db/schema/index";
import type { Db } from "../utils";
import { hashPassword, logResult, logSection } from "../utils";

const SEED_USERS = [
  { email: "admin@vstep.test", fullName: "Admin", role: "admin" },
  {
    email: "instructor@vstep.test",
    fullName: "Nguyễn Văn A",
    role: "instructor",
  },
  {
    email: "instructor2@vstep.test",
    fullName: "Trần Thị B",
    role: "instructor",
  },
  { email: "learner@vstep.test", fullName: "Lê Minh C", role: "learner" },
  { email: "learner2@vstep.test", fullName: "Phạm Thị D", role: "learner" },
] as const;

export const SEED_PASSWORD = "Vstep@2026";

export interface SeededUsers {
  admin: { id: string; email: string };
  instructors: Array<{ id: string; email: string }>;
  learners: Array<{ id: string; email: string }>;
}

export async function seedUsers(db: Db): Promise<SeededUsers> {
  logSection("Users");

  const passwordHash = await hashPassword(SEED_PASSWORD);

  const rows = await db
    .insert(table.users)
    .values(SEED_USERS.map((u) => ({ ...u, passwordHash })))
    .returning({ id: table.users.id, email: table.users.email });

  let admin: SeededUsers["admin"] | undefined;
  const instructors: SeededUsers["instructors"] = [];
  const learners: SeededUsers["learners"] = [];

  for (const row of rows) {
    const def = SEED_USERS.find((u) => u.email === row.email);
    if (!def) continue;
    if (def.role === "admin") admin = row;
    else if (def.role === "instructor") instructors.push(row);
    else learners.push(row);
  }

  if (!admin) throw new Error("Admin user not found after insert");

  logResult("Users", rows.length);
  return { admin, instructors, learners };
}
