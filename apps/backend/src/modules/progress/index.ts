import { QuestionLevel, Skill } from "@common/enums";
import { ErrorResponse, IdParam, PaginationMeta, PaginationQuery } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ProgressModel } from "./model";
import { ProgressService } from "./service";

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
          data: t.Array(ProgressModel.Progress),
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
        200: ProgressModel.Progress,
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
      body: ProgressModel.UpdateBody,
      response: {
        200: ProgressModel.Progress,
        401: ErrorResponse,
      },
      detail: {
        summary: "Update user progress",
      },
    },
  );
