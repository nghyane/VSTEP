import { Elysia } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ProgressModel } from "./model";
import { ProgressService } from "./service";

/**
 * Progress Module Controller
 * Routes for tracking user progress
 */
export const progress = new Elysia({ prefix: "/progress" })
  .use(authPlugin)
  .get(
    "/",
    async ({ query, user, isAdmin }) => {
      return await ProgressService.list(query, user!.sub, isAdmin);
    },
    {
      query: ProgressModel.listProgressQuery,
      response: ProgressModel.listProgressResponse,
      detail: {
        summary: "List user progress",
        tags: ["Progress"],
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      return await ProgressService.getById(id);
    },
    {
      params: ProgressModel.progressIdParam,
      response: ProgressModel.userProgress,
      detail: {
        summary: "Get progress by ID",
        tags: ["Progress"],
      },
    },
  )
  .post(
    "/update",
    async ({ body, user }) => {
      return await ProgressService.updateProgress(user!.sub, body);
    },
    {
      body: ProgressModel.updateProgressBody,
      response: ProgressModel.userProgress,
      detail: {
        summary: "Update user progress",
        tags: ["Progress"],
      },
    },
  );
