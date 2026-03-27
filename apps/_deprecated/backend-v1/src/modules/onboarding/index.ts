import { AuthErrors, ErrorResponse } from "@common/schemas";
import { Elysia } from "elysia";
import { authPlugin } from "@/plugins/auth";
import {
  OnboardingStatus,
  PlacementResult,
  PlacementStarted,
  SelfAssessBody,
  SkipBody,
} from "./schema";
import { selfAssess, skipWithSurvey, startPlacement, status } from "./service";

export const onboarding = new Elysia({
  name: "module:onboarding",
  prefix: "/onboarding",
  detail: { tags: ["Onboarding"] },
})
  .use(authPlugin)

  .get("/status", ({ user }) => status(user.sub), {
    auth: true,
    response: { 200: OnboardingStatus, ...AuthErrors },
    detail: {
      summary: "Check onboarding status",
      description: "Check if the authenticated user has completed onboarding.",
      security: [{ bearerAuth: [] }],
    },
  })

  .post(
    "/self-assess",
    async ({ body, user, set }) => {
      set.status = 201;
      return selfAssess(user.sub, body);
    },
    {
      auth: true,
      body: SelfAssessBody,
      response: { 201: PlacementResult, 409: ErrorResponse, ...AuthErrors },
      detail: {
        summary: "Self-assess proficiency",
        description:
          "Declare your own proficiency level for each skill. One-time only.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/placement",
    async ({ user, set }) => {
      set.status = 201;
      return startPlacement(user.sub);
    },
    {
      auth: true,
      response: {
        201: PlacementStarted,
        409: ErrorResponse,
        400: ErrorResponse,
        ...AuthErrors,
      },
      detail: {
        summary: "Start placement test",
        description:
          "Generate and start a dynamic placement test (listening + reading only). Use exam endpoints to answer and submit.",
        security: [{ bearerAuth: [] }],
      },
    },
  )

  .post(
    "/skip",
    async ({ body, user, set }) => {
      set.status = 201;
      return skipWithSurvey(user.sub, body);
    },
    {
      auth: true,
      body: SkipBody,
      response: { 201: PlacementResult, 409: ErrorResponse, ...AuthErrors },
      detail: {
        summary: "Skip placement with survey",
        description:
          "Skip placement test. Optionally provide background info for better level estimation.",
        security: [{ bearerAuth: [] }],
      },
    },
  );
