import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { config } from "./common/env.js";
import { healthModule } from "./modules/health/index.js";

/**
 * Main Elysia application with auto OpenAPI generation
 * Swagger UI available at /swagger
 * OpenAPI JSON available at /swagger/json
 */
export const app = new Elysia()
  .use(cors())
  .use(
    swagger({
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
  // Health check at root
  .get("/", () => ({ status: "ok", service: "vstep-backend" }), {
    detail: {
      summary: "Root health check",
      tags: ["Health"],
      responses: {
        200: {
          description: "Service is running",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  service: { type: "string", example: "vstep-backend" },
                },
              },
            },
          },
        },
      },
    },
  })
  // Mount modules
  .use(healthModule)
  .listen(config.PORT);
