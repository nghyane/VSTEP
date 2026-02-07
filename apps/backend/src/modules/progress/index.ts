import { Skill } from "@common/enums";
import { AuthErrors } from "@common/schemas";
import { Elysia, t } from "elysia";
import { authPlugin } from "@/plugins/auth";
import { ProgressModel } from "./model";
import { ProgressService } from "./service";

export const progress = new Elysia({
  prefix: "/progress",
  detail: { tags: ["Progress"] },
})
  .use(authPlugin)

  .get("/", ({ user }) => ProgressService.getOverview(user.sub), {
    auth: true,
    response: { 200: ProgressModel.OverviewResponse, ...AuthErrors },
    detail: { summary: "Get progress overview (all skills)" },
  })

  .get(
    "/spider-chart",
    ({ user }) => ProgressService.getSpiderChart(user.sub),
    {
      auth: true,
      response: { 200: ProgressModel.SpiderChartResponse, ...AuthErrors },
      detail: { summary: "Get spider chart data for all skills" },
    },
  )

  .get(
    "/:skill",
    ({ params: { skill }, user }) =>
      ProgressService.getBySkill(skill, user.sub),
    {
      auth: true,
      params: t.Object({ skill: Skill }),
      response: { 200: ProgressModel.SkillDetailResponse, ...AuthErrors },
      detail: { summary: "Get progress for a specific skill" },
    },
  );
