import { logger } from "@common/logger";
import { app } from "@/app";

logger.info("Server started", {
  url: `http://${app.server?.hostname}:${app.server?.port}`,
  env: process.env.NODE_ENV,
});

export type App = typeof app;
