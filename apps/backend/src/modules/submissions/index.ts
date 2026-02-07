import { Skill, SubmissionStatus as SubmissionStatusEnum } from "@common/enums";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
  PaginationQuery,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { SubmissionModel } from "./model";
import { SubmissionService } from "./service";

export const submissions = new Elysia({
  prefix: "/submissions",
  detail: { tags: ["Submissions"] },
})
  .use(authPlugin)

  .get("/", ({ query, user }) => SubmissionService.list(query, user), {
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
      ...AuthErrors,
    },
    detail: {
      summary: "List submissions",
      description: "List submissions with filtering and pagination",
    },
  })

  .get(
    "/:id",
    ({ params, user }) => SubmissionService.getById(params.id, user),
    {
      auth: true,
      params: IdParam,
      response: {
        200: SubmissionModel.SubmissionWithDetails,
        ...CrudErrors,
      },
      detail: {
        summary: "Get submission",
        description: "Get a submission by ID",
      },
    },
  )

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return SubmissionService.create(user.sub, body);
    },
    {
      auth: true,
      body: SubmissionModel.CreateBody,
      response: {
        201: SubmissionModel.SubmissionWithDetails,
        400: ErrorResponse,
        ...CrudErrors,
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
    ({ params, body, user }) => SubmissionService.update(params.id, user, body),
    {
      auth: true,
      params: IdParam,
      body: SubmissionModel.UpdateBody,
      response: {
        200: SubmissionModel.SubmissionWithDetails,
        400: ErrorResponse,
        ...CrudErrors,
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
    ({ params, body }) => SubmissionService.grade(params.id, body),
    {
      role: "instructor",
      params: IdParam,
      body: SubmissionModel.GradeBody,
      response: {
        200: SubmissionModel.SubmissionWithDetails,
        ...CrudErrors,
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
    ({ params }) => SubmissionService.autoGrade(params.id),
    {
      role: "admin",
      params: IdParam,
      response: {
        200: t.Object({
          score: t.Number(),
          result: t.Any(),
        }),
        ...CrudErrors,
      },
      detail: {
        summary: "Auto-grade submission",
        description: "Auto-grade an objective submission (admin only)",
      },
    },
  )

  .delete(
    "/:id",
    ({ params, user }) => SubmissionService.remove(params.id, user),
    {
      auth: true,
      params: IdParam,
      response: {
        200: t.Object({ id: t.String({ format: "uuid" }) }),
        ...CrudErrors,
      },
      detail: {
        summary: "Delete submission",
        description: "Soft delete a submission",
      },
    },
  );
