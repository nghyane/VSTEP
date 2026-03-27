import { t } from "elysia";

const ServiceStatus = t.UnionEnum(["ok", "error", "unavailable"]);

const ServiceHealthSchema = t.Object({
  status: ServiceStatus,
  latency: t.Optional(t.Number()),
});

export const HealthResponse = t.Object({
  status: t.UnionEnum(["ok", "degraded"]),
  services: t.Object({
    db: ServiceHealthSchema,
    redis: ServiceHealthSchema,
  }),
});

export type HealthResponse = typeof HealthResponse.static;
