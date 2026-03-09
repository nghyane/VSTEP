import { AuthErrors } from "@common/schemas";
import { Elysia } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { PracticeNextQuery, PracticeNextResponse } from "./schema";
import { next } from "./service";

export const practice = new Elysia({
  name: "module:practice",
  prefix: "/practice",
  detail: { tags: ["Practice"] },
})
  .use(authPlugin)
  .get("/next", ({ query, user }) => next(user.sub, query), {
    auth: true,
    query: PracticeNextQuery,
    response: { 200: PracticeNextResponse, ...AuthErrors },
    detail: {
      summary: "Get next practice question",
      description:
        "Returns an adaptively selected question based on user progress, targeting weak knowledge points and appropriate difficulty level.",
      security: [{ bearerAuth: [] }],
    },
  });
