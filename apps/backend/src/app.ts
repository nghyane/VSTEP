import { env } from "@common/env";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { auth } from "@/modules/auth";
import { classes } from "@/modules/classes";
import { exams } from "@/modules/exams";
import { health } from "@/modules/health";
import { knowledgePoints } from "@/modules/knowledge-points";
import { devicesModule, notificationsModule } from "@/modules/notifications";
import { onboarding } from "@/modules/onboarding";
import { practice } from "@/modules/practice";
import { progress } from "@/modules/progress";
import { questions } from "@/modules/questions";
import { submissions } from "@/modules/submissions";
import { uploads } from "@/modules/uploads";
import { users } from "@/modules/users";
import { vocabulary } from "@/modules/vocabulary";
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
          {
            name: "Knowledge Points",
            description: "Knowledge point taxonomy for adaptive learning",
          },
          { name: "Progress", description: "User progress endpoints" },
          { name: "Exams", description: "Exam endpoints" },
          {
            name: "Classes",
            description:
              "Class management, enrollment, dashboard, and feedback",
          },
          {
            name: "Onboarding",
            description:
              "Learner onboarding: placement test, self-assessment, or skip",
          },
          {
            name: "Practice",
            description: "Adaptive practice question selection",
          },
          {
            name: "Vocabulary",
            description: "Vocabulary topics, words, and learning progress",
          },
          {
            name: "Uploads",
            description: "File upload endpoints (audio, etc.)",
          },
          {
            name: "Notifications",
            description:
              "Notifications and device token management for push notifications",
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    }),
  )
  .use(auth)
  .use(users)
  .use(submissions)
  .use(questions)
  .use(knowledgePoints)
  .use(progress)
  .use(exams)
  .use(classes)
  .use(onboarding)
  .use(vocabulary)
  .use(uploads)
  .use(practice)
  .use(notificationsModule)
  .use(devicesModule);

/** Root app — health check outside /api, everything else inside */
export const app = new Elysia()
  .use(errorPlugin)
  .use(
    cors({
      origin: env.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : env.NODE_ENV === "production"
          ? []
          : true,
      credentials: true,
    }),
  )
  .use(health)
  .use(api);
