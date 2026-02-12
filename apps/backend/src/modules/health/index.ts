import { Elysia } from "elysia";
import { HealthResponse } from "./schema";
import { checkHealth } from "./service";

export const healthModule = new Elysia({
  name: "module:health",
  prefix: "/health",
  detail: { tags: ["Health"] },
}).get("/", async () => checkHealth(), {
  response: { 200: HealthResponse },
  detail: {
    summary: "Health check",
    description:
      "Return the operational status of all backing services (PostgreSQL, Redis).",
  },
});
