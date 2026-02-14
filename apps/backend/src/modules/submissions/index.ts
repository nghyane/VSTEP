import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { AutoGradeResult } from "@db/types/grading";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { autoGradeSubmission } from "./auto-grade";
import {
  assignSubmission,
  claimSubmission,
  getReviewQueue,
  releaseSubmission,
  submitReview,
} from "./review";
import {
  ReviewQueueItem,
  ReviewQueueQuery,
  SubmissionAssignBody,
  SubmissionCreateBody,
  SubmissionFull,
  SubmissionGradeBody,
  SubmissionListQuery,
  SubmissionReviewBody,
  SubmissionUpdateBody,
} from "./schema";
import {
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
        data: t.Array(SubmissionFull),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List submissions",
      description:
        "Return a paginated list of submissions with optional status, skill, and date filters.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:id", ({ params, user }) => getSubmissionById(params.id, user), {
    auth: true,
    params: IdParam,
    response: {
      200: SubmissionFull,
      ...CrudErrors,
    },
    detail: {
      summary: "Get submission by ID",
      description:
        "Retrieve a single submission including its grading details.",
      security: [{ bearerAuth: [] }],
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
        201: SubmissionFull,
        400: ErrorResponse,
        ...CrudErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Create submission",
        description:
          "Submit an answer for a specific question. The submission enters the grading pipeline.",
        security: [{ bearerAuth: [] }],
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
        200: SubmissionFull,
        400: ErrorResponse,
        ...CrudErrors,
        422: ErrorResponse,
      },
      detail: {
        summary: "Update submission",
        description:
          "Partially update a pending submission's answer content before grading begins.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post("/:id/grade", ({ params, body }) => gradeSubmission(params.id, body), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    body: SubmissionGradeBody,
    response: {
      200: SubmissionFull,
      ...CrudErrors,
      422: ErrorResponse,
    },
    detail: {
      summary: "Grade submission",
      description:
        "Assign a manual score and feedback to a submission. Requires instructor role or above.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/:id/auto-grade", ({ params }) => autoGradeSubmission(params.id), {
    role: ROLES.ADMIN,
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
      description:
        "Automatically grade an objective (listening/reading) submission against answer keys. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  // Review Queue routes
  .get("/queue", ({ query, user }) => getReviewQueue(query, user), {
    role: ROLES.INSTRUCTOR,
    query: ReviewQueueQuery,
    response: {
      200: t.Object({
        data: t.Array(ReviewQueueItem),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "Get review queue",
      description:
        "List submissions pending human review, ordered by priority then FIFO.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post("/:id/claim", ({ params, user }) => claimSubmission(params.id, user), {
    role: ROLES.INSTRUCTOR,
    params: IdParam,
    response: {
      200: SubmissionFull,
      ...CrudErrors,
      409: ErrorResponse,
    },
    detail: {
      summary: "Claim submission for review",
      description:
        "Claim a submission to start reviewing. Returns 409 if already claimed by another reviewer.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/:id/release",
    ({ params, user }) => releaseSubmission(params.id, user),
    {
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      response: {
        200: SubmissionFull,
        ...CrudErrors,
      },
      detail: {
        summary: "Release claimed submission",
        description: "Release a claimed submission back to the review queue.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .put(
    "/:id/review",
    ({ params, body, user }) => submitReview(params.id, body, user),
    {
      role: ROLES.INSTRUCTOR,
      params: IdParam,
      body: SubmissionReviewBody,
      response: {
        200: SubmissionFull,
        ...CrudErrors,
        409: ErrorResponse,
      },
      detail: {
        summary: "Submit review",
        description:
          "Submit human review with score and feedback. Instructor override is final.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/:id/assign",
    ({ params, body, user }) => assignSubmission(params.id, body, user),
    {
      role: ROLES.ADMIN,
      params: IdParam,
      body: SubmissionAssignBody,
      response: {
        200: ReviewQueueItem,
        ...CrudErrors,
      },
      detail: {
        summary: "Assign reviewer",
        description:
          "Admin assigns a specific instructor to review a submission.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete("/:id", ({ params, user }) => removeSubmission(params.id, user), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete submission",
      description: "Delete a submission.",
      security: [{ bearerAuth: [] }],
    },
  });
