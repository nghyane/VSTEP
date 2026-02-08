import { Skill } from "@common/enums";
import { AuthErrors } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  ProgressOverviewResponse,
  ProgressSkillDetailResponse,
  ProgressSpiderChartResponse,
} from "./model";
import {
  getProgressBySkill,
  getProgressOverview,
  getSpiderChart,
} from "./service";

export const progress = new Elysia({
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get("/", ({ user }) => getProgressOverview(user.sub), {
    auth: true,
    response: { 200: ProgressOverviewResponse, ...AuthErrors },
    detail: { summary: "Get progress overview (all skills)" },
  })

  .get("/spider-chart", ({ user }) => getSpiderChart(user.sub), {
    auth: true,
    response: { 200: ProgressSpiderChartResponse, ...AuthErrors },
    detail: { summary: "Get spider chart data for all skills" },
  })

  .get(
    "/:skill",
    ({ params: { skill }, user }) => getProgressBySkill(skill, user.sub),
    {
      auth: true,
      params: t.Object({ skill: Skill }),
      response: { 200: ProgressSkillDetailResponse, ...AuthErrors },
      detail: { summary: "Get progress for a specific skill" },
    },
  );
