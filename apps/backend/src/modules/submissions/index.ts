import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { AutoGradeResult } from "@/modules/questions/content-schemas";
import { authPlugin } from "@/plugins/auth";
import {
  SubmissionCreateBody,
  SubmissionGradeBody,
  SubmissionListQuery,
  SubmissionUpdateBody,
  SubmissionWithDetailsSchema,
} from "./model";
import {
  autoGradeSubmission,
  createSubmission,
  getSubmissionById,
  gradeSubmission,
  listSubmissions,
  removeSubmission,
  updateSubmission,
} from "./service";

export const submissions = new Elysia({
  name: "module:submissions",
  prefix: "/submissions",
  detail: { tags: ["Submissions"] },
})
  .use(authPlugin)

  .get("/", ({ query, user }) => listSubmissions(query, user), {
    auth: true,
    query: SubmissionListQuery,
    response: {
      200: t.Object({
        data: t.Array(SubmissionWithDetailsSchema),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List submissions",
      description: "List submissions with filtering and pagination",
    },
  })

  .get("/:id", ({ params, user }) => getSubmissionById(params.id, user), {
    auth: true,
    params: IdParam,
    response: {
      200: SubmissionWithDetailsSchema,
      ...CrudErrors,
    },
    detail: {
      summary: "Get submission",
      description: "Get a submission by ID",
    },
  })

  .post(
    "/",
    ({ body, user, set }) => {
      set.status = 201;
      return createSubmission(user.sub, body);
    },
    {
      auth: true,
      body: SubmissionCreateBody,
      response: {
        201: SubmissionWithDetailsSchema,
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
    ({ params, body, user }) => updateSubmission(params.id, body, user),
    {
      auth: true,
      params: IdParam,
      body: SubmissionUpdateBody,
      response: {
        200: SubmissionWithDetailsSchema,
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

  .post("/:id/grade", ({ params, body }) => gradeSubmission(params.id, body), {
    role: "instructor",
    params: IdParam,
    body: SubmissionGradeBody,
    response: {
      200: SubmissionWithDetailsSchema,
      ...CrudErrors,
      422: ErrorResponse,
    },
    detail: {
      summary: "Grade submission",
      description: "Grade a submission (instructor/admin only)",
    },
  })

  .post("/:id/auto-grade", ({ params }) => autoGradeSubmission(params.id), {
    role: "admin",
    params: IdParam,
    response: {
      200: t.Object({
        score: t.Number(),
        result: AutoGradeResult,
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Auto-grade submission",
      description: "Auto-grade an objective submission (admin only)",
    },
  })

  .delete("/:id", ({ params, user }) => removeSubmission(params.id, user), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
        deletedAt: t.String({ format: "date-time" }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete submission",
      description: "Soft delete a submission",
    },
  });
