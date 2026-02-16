import { Elysia } from "elysia";
import { HealthResponse } from "./schema";
import { check } from "./service";

export const health = new Elysia({
  name: "module:health",
  prefix: "/health",
  detail: { tags: ["Health"] },
}).get("/", async () => check(), {
  response: { 200: HealthResponse },
  detail: {
    summary: "Health check",
    description:
      "Return the operational status of all backing services (PostgreSQL, Redis).",
  },
});
