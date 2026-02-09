import { Elysia, t } from "elysia";
import { checkHealth } from "./service";

export const healthModule = new Elysia({
  name: "module:health",
  prefix: "/health",
  detail: { tags: ["Health"] },
}).get("/", async () => checkHealth(), {
  response: {
    200: t.Object({
      status: t.String(),
      services: t.Object({
        db: t.Object({ status: t.String(), latency: t.Optional(t.Number()) }),
        redis: t.Object({
          status: t.String(),
          latency: t.Optional(t.Number()),
        }),
        rabbitmq: t.Object({
          status: t.String(),
          latency: t.Optional(t.Number()),
        }),
      }),
    }),
  },
  detail: { summary: "Health check" },
});
