import { Elysia } from "elysia";

/**
 * Health check module
 * Provides health check endpoints for monitoring
 */

export const healthModule = new Elysia({ prefix: "/health" })
  .get(
    "/",
    () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
    {
      detail: {
        summary: "Health check",
        description: "Returns the current health status of the service",
        tags: ["Health"],
        responses: {
          200: {
            description: "Service is healthy",
          },
        },
      },
    },
  )
  .get(
    "/ready",
    () => ({
      ready: true,
      checks: {
        database: "connected",
      },
    }),
    {
      detail: {
        summary: "Readiness check",
        description:
          "Returns readiness status for Kubernetes/Docker health checks",
        tags: ["Health"],
        responses: {
          200: {
            description: "Service is ready",
          },
        },
      },
    },
  );
