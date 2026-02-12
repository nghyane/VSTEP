import { t } from "elysia";

const ServiceHealthSchema = t.Object({
  status: t.String(),
  latency: t.Optional(t.Number()),
});

export const HealthResponse = t.Object({
  status: t.String(),
  services: t.Object({
    db: ServiceHealthSchema,
    redis: ServiceHealthSchema,
  }),
});

export type HealthResponse = typeof HealthResponse.static;
