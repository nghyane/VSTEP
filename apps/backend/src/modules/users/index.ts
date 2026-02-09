import {
  AuthErrors,
  CrudErrors,
  CrudWithConflictErrors,
  IdParam,
  PaginationMeta,
  SuccessResponse,
} from "@common/schemas";
import { UserSchema } from "@db/typebox";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  UserCreateBody,
  UserListQuery,
  UserPasswordBody,
  UserUpdateBody,
} from "./model";
import {
  createUser,
  getUserById,
  listUsers,
  removeUser,
  updateUser,
  updateUserPassword,
} from "./service";

export const users = new Elysia({
  name: "module:users",
  prefix: "/users",
  detail: { tags: ["Users"] },
})
  .use(authPlugin)

  .get("/:id", ({ params, user }) => getUserById(params.id, user), {
    auth: true,
    params: IdParam,
    response: { 200: UserSchema, ...CrudErrors },
    detail: {
      summary: "Get user",
      description: "Get user details by ID",
    },
  })

  .get("/", ({ query }) => listUsers(query), {
    role: "admin",
    query: UserListQuery,
    response: {
      200: t.Object({
        data: t.Array(UserSchema),
        meta: PaginationMeta,
      }),
      ...AuthErrors,
    },
    detail: {
      summary: "List users",
      description: "List users with pagination and filtering (Admin only)",
    },
  })

  .post(
    "/",
    async ({ body, set }) => {
      set.status = 201;
      return createUser(body);
    },
    {
      role: "admin",
      body: UserCreateBody,
      response: { 201: UserSchema, ...CrudWithConflictErrors },
      detail: {
        summary: "Create user",
        description: "Create a new user account (Admin only)",
      },
    },
  )

  .patch(
    "/:id",
    ({ params, body, user }) => updateUser(params.id, body, user),
    {
      auth: true,
      params: IdParam,
      body: UserUpdateBody,
      response: { 200: UserSchema, ...CrudWithConflictErrors },
      detail: {
        summary: "Update user",
        description: "Update user details",
      },
    },
  )

  .delete("/:id", ({ params }) => removeUser(params.id), {
    role: "admin",
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
        deletedAt: t.String({ format: "date-time" }),
      }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete user",
      description: "Soft delete a user account (Admin only)",
    },
  })

  .post(
    "/:id/password",
    ({ params, body, user }) => updateUserPassword(params.id, body, user),
    {
      auth: true,
      params: IdParam,
      body: UserPasswordBody,
      response: { 200: SuccessResponse, ...CrudErrors },
      detail: {
        summary: "Update password",
        description: "Update user password",
      },
    },
  );
