import { Skill, SubmissionStatus as SubmissionStatusEnum } from "@common/enums";
import { ErrorResponse, IdParam, PaginationMeta, PaginationQuery } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { SubmissionModel } from "./model";
import { SubmissionService } from "./service";

export const submissions = new Elysia({
  prefix: "/submissions",
  detail: { tags: ["Submissions"] },
})
  .use(authPlugin)

  .get(
    "/",
    async ({ query, user, set }) => {
      const result = await SubmissionService.list(
        query,
        user.sub,
        user.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      query: t.Object({
        ...PaginationQuery.properties,
        skill: t.Optional(Skill),
        status: t.Optional(SubmissionStatusEnum),
        userId: t.Optional(t.String({ format: "uuid" })),
      }),
      response: {
        200: t.Object({
          data: t.Array(SubmissionModel.SubmissionWithDetails),
          meta: PaginationMeta,
        }),
        401: ErrorResponse,
      },
      detail: {
        summary: "List submissions",
        description: "List submissions with filtering and pagination",
      },
    },
  )

  .get(
    "/:id",
    async ({ params, user, set }) => {
      const result = await SubmissionService.getById(
        params.id,
        user.sub,
        user.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: SubmissionModel.SubmissionWithDetails,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Get submission",
        description: "Get a submission by ID",
      },
    },
  )

  .post(
    "/",
    async ({ body, user, set }) => {
      const result = await SubmissionService.create(user.sub, body);
      set.status = 201;
      return result;
    },
    {
      auth: true,
      body: SubmissionModel.CreateBody,
      response: {
        201: SubmissionModel.SubmissionWithDetails,
        400: ErrorResponse,
        401: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create submission",
        description: "Create a new submission",
      },
    },
  )

  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      const result = await SubmissionService.update(
        params.id,
        user.sub,
        user.role === "admin",
        body,
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      body: SubmissionModel.UpdateBody,
      response: {
        200: SubmissionModel.SubmissionWithDetails,
        400: ErrorResponse,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Update submission",
        description: "Update a submission",
      },
    },
  )

  .post(
    "/:id/grade",
    async ({ params, body, set }) => {
      const result = await SubmissionService.grade(params.id, body);
      set.status = 200;
      return result;
    },
    {
      role: "instructor",
      params: IdParam,
      body: SubmissionModel.GradeBody,
      response: {
        200: SubmissionModel.SubmissionWithDetails,
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        422: ErrorResponse,
      },
      detail: {
        summary: "Grade submission",
        description: "Grade a submission (instructor/admin only)",
      },
    },
  )

  .post(
    "/:id/auto-grade",
    async ({ params, set }) => {
      const result = await SubmissionService.autoGrade(params.id);
      set.status = 200;
      return result;
    },
    {
      role: "admin",
      params: IdParam,
      response: {
        200: t.Object({
          score: t.Number(),
          result: t.Any(),
        }),
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Auto-grade submission",
        description: "Auto-grade an objective submission (admin only)",
      },
    },
  )

  .delete(
    "/:id",
    async ({ params, user, set }) => {
      const result = await SubmissionService.remove(
        params.id,
        user.sub,
        user.role === "admin",
      );
      set.status = 200;
      return result;
    },
    {
      auth: true,
      params: IdParam,
      response: {
        200: t.Object({ id: t.String({ format: "uuid" }) }),
        401: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "Delete submission",
        description: "Soft delete a submission",
      },
    },
  );
