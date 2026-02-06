/**
 * Progress Module Controller
 * Routes for tracking user progress
 */

import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ProgressService } from "./service";

// ─── Inline Schemas ─────────────────────────────────────────────

const SkillType = t.Union([
  t.Literal("listening"),
  t.Literal("reading"),
  t.Literal("writing"),
  t.Literal("speaking"),
]);

const LevelType = t.Union([
  t.Literal("A2"),
  t.Literal("B1"),
  t.Literal("B2"),
  t.Literal("C1"),
]);

const StreakDirection = t.Union([
  t.Literal("up"),
  t.Literal("down"),
  t.Literal("neutral"),
]);

const ProgressResponse = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  skill: SkillType,
  currentLevel: LevelType,
  targetLevel: t.Nullable(LevelType),
  scaffoldLevel: t.Number(),
  streakCount: t.Number(),
  streakDirection: t.Nullable(StreakDirection),
  attemptCount: t.Number(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

// ─── Controller ──────────────────────────────────────────────────

export const progress = new Elysia({
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  /**
   * GET /progress
   * List user progress
   */
  .get(
    "/",
    async ({ query, user }) => {
      return await ProgressService.list(
        query,
        user!.sub,
        user!.role === "admin",
      );
    },
    {
      auth: true,
      query: t.Object({
        ...PaginationQuery.properties,
        skill: t.Optional(SkillType),
        currentLevel: t.Optional(LevelType),
        userId: t.Optional(t.String({ format: "uuid" })),
      }),
      response: {
        200: t.Object({
          data: t.Array(ProgressResponse),
          meta: PaginationMeta,
        }),
        401: ErrorResponse,
      },
      detail: {
        summary: "List user progress",
        tags: ["Progress"],
      },
    },
  )

  /**
   * GET /progress/:id
   * Get progress by ID
   */
  .get(
    "/:id",
    async ({ params: { id } }) => {
      return await ProgressService.getById(id);
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: ProgressResponse,
        401: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get progress by ID",
        tags: ["Progress"],
      },
    },
  )

  /**
   * POST /progress/update
   * Update user progress
   */
  .post(
    "/update",
    async ({ body, user }) => {
      return await ProgressService.updateProgress(user!.sub, body);
    },
    {
      auth: true,
      body: t.Object({
        skill: SkillType,
        currentLevel: LevelType,
        targetLevel: t.Optional(LevelType),
        scaffoldLevel: t.Optional(t.Number()),
        streakCount: t.Optional(t.Number()),
        streakDirection: t.Optional(StreakDirection),
      }),
      response: {
        200: ProgressResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "Update user progress",
        tags: ["Progress"],
      },
    },
  );
