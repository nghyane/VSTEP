import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
} from "@common/schemas";
import { Skill } from "@db/enums";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { create, remove, update } from "./goals";
import { bySkill, overview, spiderChart } from "./overview";
import {
  Goal,
  GoalBody,
  GoalUpdateBody,
  ProgressOverview,
  ProgressSkillDetail,
  ProgressSpiderChart,
} from "./schema";

export const progress = new Elysia({
  name: "module:progress",
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get("/", ({ user }) => overview(user.sub), {
    auth: true,
    response: { 200: ProgressOverview, ...AuthErrors },
    detail: {
      summary: "Get progress overview",
      description:
        "Return an aggregated progress summary across all four skills for the authenticated user.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/spider-chart", ({ user }) => spiderChart(user.sub), {
    auth: true,
    response: { 200: ProgressSpiderChart, ...AuthErrors },
    detail: {
      summary: "Get spider chart data",
      description:
        "Return skill-score data points suitable for rendering a radar/spider chart.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/:skill", ({ params, user }) => bySkill(user.sub, params.skill), {
    auth: true,
    params: t.Object({ skill: Skill }),
    response: { 200: ProgressSkillDetail, ...AuthErrors },
    detail: {
      summary: "Get skill progress",
      description:
        "Return detailed progress metrics, score history, and adaptive scaffold level for a specific skill.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/goals",
    ({ body, user, set }) => {
      set.status = 201;
      return create(user.sub, body);
    },
    {
      auth: true,
      body: GoalBody,
      response: { 201: Goal, ...AuthErrors, 409: ErrorResponse },
      detail: {
        summary: "Create learning goal",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .patch(
    "/goals/:id",
    ({ params, body, user }) => update(user, params.id, body),
    {
      auth: true,
      params: IdParam,
      body: GoalUpdateBody,
      response: { 200: Goal, ...CrudErrors },
      detail: {
        summary: "Update learning goal",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .delete("/goals/:id", ({ params, user }) => remove(user, params.id), {
    auth: true,
    params: IdParam,
    response: {
      200: t.Object({ id: t.String(), deleted: t.Boolean() }),
      ...CrudErrors,
    },
    detail: {
      summary: "Delete learning goal",
      security: [{ bearerAuth: [] }],
    },
  });
