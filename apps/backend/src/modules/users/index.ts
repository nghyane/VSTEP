import { UserRole } from "@common/enums";
import {
  AuthErrors,
  CrudErrors,
  CrudWithConflictErrors,
  IdParam,
  PaginationMeta,
  PaginationQuery,
  SuccessResponse,
} from "@common/schemas";
import { assertOwnerOrAdmin } from "@common/utils";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { UserModel } from "./model";
import { UserService } from "./service";

export const users = new Elysia({
  prefix: "/users",
  detail: { tags: ["Users"] },
})
  .use(authPlugin)

  .get(
    "/:id",
    async ({ params, user }) => {
      assertOwnerOrAdmin(
        params.id,
        user.sub,
        user.role === "admin",
        "You can only view your own profile",
      );
      return UserService.getById(params.id);
    },
    {
      auth: true,
      params: IdParam,
      response: { 200: UserModel.User, ...CrudErrors },
      detail: {
        summary: "Get user",
        description: "Get user details by ID",
      },
    },
  )

  .get("/", ({ query }) => UserService.list(query), {
    role: "admin",
    query: t.Object({
      ...PaginationQuery.properties,
      role: t.Optional(UserRole),
      search: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({
        data: t.Array(UserModel.User),
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
      return UserService.create(body);
    },
    {
      role: "admin",
      body: UserModel.CreateBody,
      response: { 201: UserModel.User, ...CrudWithConflictErrors },
      detail: {
        summary: "Create user",
        description: "Create a new user account (Admin only)",
      },
    },
  )

  .patch(
    "/:id",
    ({ params, body, user }) =>
      UserService.update(params.id, body, user.sub, user.role === "admin"),
    {
      auth: true,
      params: IdParam,
      body: UserModel.UpdateBody,
      response: { 200: UserModel.User, ...CrudWithConflictErrors },
      detail: {
        summary: "Update user",
        description: "Update user details",
      },
    },
  )

  .delete("/:id", ({ params }) => UserService.remove(params.id), {
    role: "admin",
    params: IdParam,
    response: {
      200: t.Object({
        id: t.String({ format: "uuid" }),
        deletedAt: t.String(),
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
    ({ params, body, user }) =>
      UserService.updatePassword(
        params.id,
        body,
        user.sub,
        user.role === "admin",
      ),
    {
      auth: true,
      params: IdParam,
      body: UserModel.PasswordBody,
      response: { 200: SuccessResponse, ...CrudErrors },
      detail: {
        summary: "Update password",
        description: "Update user password",
      },
    },
  );
