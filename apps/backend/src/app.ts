import { env } from "@common/env";
import { logger } from "@common/logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
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
    swagger({
      path: "/docs",
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
  .get("/health", () => ({ status: "ok" }), {
    detail: { tags: ["Health"], summary: "Health check" },
  })
  .use(api)
  .listen(env.PORT);

logger.info("Server started", {
  url: `http://${app.server?.hostname}:${app.server?.port}`,
  env: process.env.NODE_ENV,
});
