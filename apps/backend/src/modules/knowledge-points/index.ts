import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  CrudWithConflictErrors,
  ErrorResponse,
  IdParam,
  PaginationMeta,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  KnowledgePoint,
  KnowledgePointCreateBody,
  KnowledgePointListQuery,
  KnowledgePointUpdateBody,
} from "./schema";
import { create, find, list, remove, update } from "./service";

export const knowledgePoints = new Elysia({
  name: "module:knowledge-points",
  prefix: "/knowledge-points",
  detail: { tags: ["Knowledge Points"] },
})
  .use(authPlugin)

  .get("/", ({ query }) => list(query), {
    auth: true,
    query: KnowledgePointListQuery,
    response: {
      200: t.Object({
        data: t.Array(KnowledgePoint),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List knowledge points",
      description:
        "Return a paginated list of knowledge points with optional category and search filters.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:id", ({ params }) => find(params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: KnowledgePoint,
      ...CrudErrors,
    },
    detail: {
      summary: "Get knowledge point by ID",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/",
    ({ body, set }) => {
      set.status = 201;
      return create(body);
    },
    {
      role: ROLES.ADMIN,
      body: KnowledgePointCreateBody,
      response: {
        201: KnowledgePoint,
        400: ErrorResponse,
        ...AuthErrors,
        ...CrudWithConflictErrors,
      },
      detail: {
        summary: "Create knowledge point",
        description: "Create a new knowledge point. Requires admin role.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch("/:id", ({ params, body }) => update(params.id, body), {
    role: ROLES.ADMIN,
    params: IdParam,
    body: KnowledgePointUpdateBody,
    response: {
      200: KnowledgePoint,
      400: ErrorResponse,
      ...CrudWithConflictErrors,
    },
    detail: {
      summary: "Update knowledge point",
      description:
        "Update a knowledge point's category or name. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/:id", ({ params }) => remove(params.id), {
    role: ROLES.ADMIN,
    params: IdParam,
    response: {
      200: t.Object({ id: t.String({ format: "uuid" }) }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete knowledge point",
      description:
        "Delete a knowledge point and all its question associations. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  });
