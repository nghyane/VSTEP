import { Skill } from "@common/enums";
import { ErrorResponse } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ProgressModel } from "./model";
import { ProgressService } from "./service";

export const progress = new Elysia({
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get(
    "/",
    async ({ user }) => {
      return await ProgressService.getOverview(user.sub);
    },
    {
      auth: true,
      response: {
        200: ProgressModel.OverviewResponse,
        401: ErrorResponse,
      },
      detail: { summary: "Get progress overview (all skills)" },
    },
  )

  .get(
    "/spider-chart",
    async ({ user }) => {
      return await ProgressService.getSpiderChart(user.sub);
    },
    {
      auth: true,
      response: {
        200: ProgressModel.SpiderChartResponse,
        401: ErrorResponse,
      },
      detail: { summary: "Get spider chart data for all skills" },
    },
  )

  .get(
    "/:skill",
    async ({ params: { skill }, user }) => {
      return await ProgressService.getBySkill(skill, user.sub);
    },
    {
      auth: true,
      params: t.Object({ skill: Skill }),
      response: {
        200: ProgressModel.SkillDetailResponse,
        401: ErrorResponse,
      },
      detail: { summary: "Get progress for a specific skill" },
    },
  );
