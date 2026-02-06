import { env } from "@common/env";
import { logger } from "@common/logger";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { sql } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "@/db";
import { auth } from "@/modules/auth";
import { exams } from "@/modules/exams";
import { progress } from "@/modules/progress";
import { questions } from "@/modules/questions";
import { submissions } from "@/modules/submissions";
import { users } from "@/modules/users";
import { errorPlugin } from "@/plugins/error";

/** API sub-app — all feature modules mounted under /api */
const api = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      documentation: {
        info: {
          title: "VSTEP API",
          version: "1.0.0",
          description: "VSTEP Exam Platform API",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          { name: "Auth", description: "Authentication endpoints" },
          { name: "Users", description: "User management endpoints" },
          {
            name: "Submissions",
            description: "Submission management endpoints",
          },
          { name: "Questions", description: "Question management endpoints" },
          { name: "Progress", description: "User progress endpoints" },
          { name: "Exams", description: "Exam endpoints" },
        ],
      },
    }),
  )
  .use(auth)
  .use(users)
  .use(submissions)
  .use(questions)
  .use(progress)
  .use(exams);

/** Root app — health check outside /api, everything else inside */
export const app = new Elysia()
  .use(errorPlugin)
  .use(cors())
  .get(
    "/health",
    async () => {
      type Status = "ok" | "unavailable" | "error";
      const services: Record<string, Status> = {
        db: "unavailable",
        redis: "unavailable",
        rabbitmq: "unavailable",
      };

      // Check PostgreSQL
      try {
        await db.execute(sql`SELECT 1`);
        services.db = "ok";
      } catch {
        services.db = "error";
      }

      // Check Redis (graceful — unavailable if not configured)
      if (env.REDIS_URL) {
        try {
          const res = await fetch(
            env.REDIS_URL.replace(/^redis/, "http"),
          ).catch(() => null);
          services.redis = res ? "ok" : "error";
        } catch {
          services.redis = "error";
        }
      }

      // Check RabbitMQ (graceful — unavailable if not configured)
      if (env.RABBITMQ_URL) {
        try {
          const mgmtUrl = env.RABBITMQ_URL.replace(/^amqp/, "http").replace(
            /:5672/,
            ":15672",
          );
          const res = await fetch(`${mgmtUrl}/api/health/checks/alarms`, {
            signal: AbortSignal.timeout(2000),
          }).catch(() => null);
          services.rabbitmq = res?.ok ? "ok" : "error";
        } catch {
          services.rabbitmq = "error";
        }
      }

      const allOk = Object.values(services).every(
        (s) => s === "ok" || s === "unavailable",
      );

      return { status: allOk ? "ok" : "degraded", services };
    },
    { detail: { tags: ["Health"], summary: "Health check" } },
  )
  .use(api)
  .listen(env.PORT);

logger.info("Server started", {
  url: `http://${app.server?.hostname}:${app.server?.port}`,
  env: process.env.NODE_ENV,
});
