/**
 * Main Elysia Application
 * Feature-Based MVC Architecture
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { env } from "@common/env";
import { logger } from "@common/logger";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
// Feature modules
import { auth } from "@/modules/auth";
import { exams } from "@/modules/exams";
import { progress } from "@/modules/progress";
import { questions } from "@/modules/questions";
import { submissions } from "@/modules/submissions";
import { users } from "@/modules/users";
// Error handling plugin
import { errorPlugin } from "@/plugins/error";

/**
 * Main Elysia application with feature-based architecture
 * API Docs available at /docs
 */
export const app = new Elysia()
  // Global middleware
  .use(errorPlugin) // Custom errors + requestId tracking
  .use(cors())
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "VSTEP API",
          version: "1.0.0",
          description:
            "VSTEP Exam Platform API - Feature-Based MVC Architecture",
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

  // Health check
  .get("/", () => ({ status: "ok" }), {
    detail: { tags: ["Health"], summary: "Health check" },
  })

  // Health check with detailed info
  .get(
    "/health",
    () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }),
    {
      detail: { tags: ["Health"], summary: "Detailed health check" },
    },
  )

  // Mount feature modules
  .use(auth) // /auth/* routes
  .use(users) // /users/* routes
  .use(submissions) // /submissions/* routes
  .use(questions) // /questions/* routes
  .use(progress) // /progress/* routes
  .use(exams) // /exams/* routes

  // Start server
  .listen(env.PORT);

// Log server startup
logger.info("Server started", {
  url: `http://${app.server?.hostname}:${app.server?.port}`,
  env: process.env.NODE_ENV,
});
