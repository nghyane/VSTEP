import { getTableName, sql } from "drizzle-orm";
import { db } from "../src/db/index";
import { table } from "../src/db/schema/index";
import { SEED_PASSWORD, seedUsers } from "./seeders/01-users";
import { seedQuestions } from "./seeders/02-questions";
import { seedExams } from "./seeders/03-exams";
import { seedClasses } from "./seeders/04-classes";
import { seedSubmissions } from "./seeders/05-submissions";
import { seedExamSessions } from "./seeders/06-exam-sessions";
import { seedProgress } from "./seeders/07-progress";

const tableNames = Object.values(table)
  .map((t) => getTableName(t))
  .join(", ");

async function main(): Promise<void> {
  const start = performance.now();
  console.log("=== VSTEP Database Seed ===");

  const result = await db.transaction(async (tx) => {
    // Reset all tables
    console.log("\n▸ Resetting database...");
    await tx.execute(sql.raw(`TRUNCATE ${tableNames} CASCADE`));
    console.log("  All tables truncated");

    // Run seeders in order — fail at any step → rollback everything
    const users = await seedUsers(tx);
    const { all: questions } = await seedQuestions(tx, users.admin.id);
    const exams = await seedExams(tx, users.admin.id, questions);
    const submissions = await seedSubmissions(tx, users, questions);
    await seedExamSessions(tx, users, exams, questions, submissions);
    await seedProgress(tx, users, submissions);
    await seedClasses(tx, users);
    return users;
  });

  // Summary (only reached if transaction committed)
  const elapsed = Math.round(performance.now() - start);
  console.log(`\n✓ Seed completed in ${elapsed}ms`);
  console.log(`  Admin: ${result.admin.email}`);
  console.log(`  Password: ${SEED_PASSWORD}`);
}

main().catch((err: unknown) => {
  console.error("\n✗ Seed failed (rolled back):", err);
  process.exit(1);
});
