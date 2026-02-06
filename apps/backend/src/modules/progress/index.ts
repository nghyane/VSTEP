import { QuestionLevel, Skill, StreakDirection } from "@common/enums";
import {
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ProgressService } from "./service";

const ProgressResponse = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  skill: Skill,
  currentLevel: QuestionLevel,
  targetLevel: t.Nullable(QuestionLevel),
  scaffoldLevel: t.Number(),
  streakCount: t.Number(),
  streakDirection: t.Nullable(StreakDirection),
  attemptCount: t.Number(),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const progress = new Elysia({
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get(
    "/",
    async ({ query, user }) => {
      return await ProgressService.list(
        query,
        user.sub,
        user.role === "admin",
      );
    },
    {
      auth: true,
      query: t.Object({
        ...PaginationQuery.properties,
        skill: t.Optional(Skill),
        currentLevel: t.Optional(QuestionLevel),
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
      },
    },
  )

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
      },
    },
  )

  .post(
    "/update",
    async ({ body, user }) => {
      return await ProgressService.updateProgress(user.sub, body);
    },
    {
      auth: true,
      body: t.Object({
        skill: Skill,
        currentLevel: QuestionLevel,
        targetLevel: t.Optional(QuestionLevel),
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
      },
    },
  );
