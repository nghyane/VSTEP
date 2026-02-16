import { ROLES } from "@common/auth-types";
import {
  AuthErrors,
  CrudErrors,
  CrudWithConflictErrors,
  IdParam,
  PaginationMeta,
  SuccessResponse,
} from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  User,
  UserCreateBody,
  UserListQuery,
  UserPasswordBody,
  UserUpdateBody,
} from "./schema";
import { byId, create, list, remove, update, updatePassword } from "./service";

export const users = new Elysia({
  name: "module:users",
  prefix: "/users",
  detail: { tags: ["Users"] },
})
  .use(authPlugin)

  .get("/:id", ({ params, user }) => byId(params.id, user), {
    auth: true,
    params: IdParam,
    response: { 200: User, ...CrudErrors },
    detail: {
      summary: "Get user by ID",
      description:
        "Retrieve a user's profile. Admins may view any user; non-admins may only view their own.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/", ({ query }) => list(query), {
    role: ROLES.ADMIN,
    query: UserListQuery,
    response: {
      200: t.Object({
        data: t.Array(User),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List users",
      description:
        "Return a paginated list of users with optional search and role filter. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/",
    async ({ body, set }) => {
      set.status = 201;
      return create(body);
    },
    {
      role: ROLES.ADMIN,
      body: UserCreateBody,
      response: { 201: User, ...CrudWithConflictErrors },
      detail: {
        summary: "Create user",
        description:
          "Create a new user account with a specified role. Requires admin role.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch("/:id", ({ params, body, user }) => update(params.id, body, user), {
    auth: true,
    params: IdParam,
    body: UserUpdateBody,
    response: { 200: User, ...CrudWithConflictErrors },
    detail: {
      summary: "Update user",
      description:
        "Partially update a user's profile (name, email). Users may update themselves; admins may update anyone.",
      security: [{ bearerAuth: [] }],
    },
  })

  .delete("/:id", ({ params, user }) => remove(params.id, user), {
    role: ROLES.ADMIN,
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete user",
      description: "Delete a user account. Requires admin role.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/:id/password",
    ({ params, body, user }) => updatePassword(params.id, body, user),
    {
      auth: true,
      params: IdParam,
      body: UserPasswordBody,
      response: { 200: SuccessResponse, ...CrudErrors },
      detail: {
        summary: "Change password",
        description:
          "Change a user's password. Requires the current password for verification.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
