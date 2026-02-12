import { AuthErrors } from "@common/schemas";
import { Skill } from "@db/enums";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  ProgressOverviewResponse,
  ProgressSkillDetailResponse,
  ProgressSpiderChartResponse,
} from "./schema";
import {
  getProgressBySkill,
  getProgressOverview,
  getSpiderChart,
} from "./service";

export const progress = new Elysia({
  name: "module:progress",
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get("/", ({ user }) => getProgressOverview(user.sub), {
    auth: true,
    response: { 200: ProgressOverviewResponse, ...AuthErrors },
    detail: {
      summary: "Get progress overview",
      description:
        "Return an aggregated progress summary across all four skills for the authenticated user.",
      security: [{ bearerAuth: [] }],
    },
  })

  .get("/spider-chart", ({ user }) => getSpiderChart(user.sub), {
    auth: true,
    response: { 200: ProgressSpiderChartResponse, ...AuthErrors },
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
      response: { 200: ProgressSkillDetailResponse, ...AuthErrors },
      detail: {
        summary: "Get skill progress",
        description:
          "Return detailed progress metrics, score history, and adaptive scaffold level for a specific skill.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
