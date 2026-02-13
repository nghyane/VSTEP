import {
  AuthErrors,
  CrudErrors,
  ErrorResponse,
  IdParam,
} from "@common/schemas";
import { Skill } from "@db/enums";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  Goal,
  GoalBody,
  GoalUpdateBody,
  ProgressOverview,
  ProgressSkillDetail,
  ProgressSpiderChart,
} from "./schema";
import {
  createGoal,
  getProgressBySkill,
  getProgressOverview,
  getSpiderChart,
  removeGoal,
  updateGoal,
} from "./service";

export const progress = new Elysia({
  name: "module:progress",
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get("/", ({ user }) => getProgressOverview(user.sub), {
    auth: true,
    response: { 200: ProgressOverview, ...AuthErrors },
    detail: {
      summary: "Get progress overview",
      description:
        "Return an aggregated progress summary across all four skills for the authenticated user.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/spider-chart", ({ user }) => getSpiderChart(user.sub), {
    auth: true,
    response: { 200: ProgressSpiderChart, ...AuthErrors },
    detail: {
      summary: "Get spider chart data",
      description:
        "Return skill-score data points suitable for rendering a radar/spider chart.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get(
    "/:skill",
    ({ params, user }) => getProgressBySkill(user.sub, params.skill),
    {
      auth: true,
      params: t.Object({ skill: Skill }),
      response: { 200: ProgressSkillDetail, ...AuthErrors },
      detail: {
        summary: "Get skill progress",
        description:
          "Return detailed progress metrics, score history, and adaptive scaffold level for a specific skill.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post("/goals", ({ body, user }) => createGoal(user.sub, body), {
    auth: true,
    body: GoalBody,
    response: { 200: Goal, ...AuthErrors, 409: ErrorResponse },
    detail: { summary: "Create learning goal", security: [{ bearerAuth: [] }] },
  })

  .patch(
    "/goals/:id",
    ({ params, body, user }) => updateGoal(user.sub, params.id, body),
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

  .delete("/goals/:id", ({ params, user }) => removeGoal(user.sub, params.id), {
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
