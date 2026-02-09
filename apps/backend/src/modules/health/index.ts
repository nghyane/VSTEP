import { Elysia } from "elysia";
import { HealthResponse } from "./model";
import { checkHealth } from "./service";

export const healthModule = new Elysia({
  name: "module:health",
  prefix: "/health",
  detail: { tags: ["Health"] },
}).get("/", async () => checkHealth(), {
  response: { 200: HealthResponse },
  detail: { summary: "Health check" },
});
