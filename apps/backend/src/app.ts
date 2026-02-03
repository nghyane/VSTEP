import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env } from "./common/env";
import { authPlugin } from "./plugins/auth";

/**
 * Main Elysia application with auto OpenAPI generation
 * API Docs available at /docs
 * OpenAPI JSON available at /docs/json
 *
 * 2026 Stack:
 * - Authentication: @elysiajs/jwt + Bun.password (no bcrypt)
 * - Validation: Zod with @t3-oss/env-core for env
 * - Database: Drizzle ORM + postgres
 */
export const app = new Elysia()
  .use(cors())
  .use(authPlugin()) // JWT + Bun.password auth
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
          { name: "Exam", description: "Exam management endpoints" },
          { name: "User", description: "User management endpoints" },
        ],
      },
    }),
  )
  // Health check
  .get("/", () => ({ status: "ok" }), {
    detail: { tags: ["Health"], summary: "Health check" },
  })
  .listen(env.PORT);
