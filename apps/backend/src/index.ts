import { env } from "@common/env";
import { logger } from "@common/logger";
import { app } from "@/app";

try {
  app.listen({
    port: env.PORT,
    maxRequestBodySize: 1024 * 1024 * 2, // 2MB
  });

  logger.info("Server started", {
    url: `http://${app.server?.hostname}:${app.server?.port}`,
    env: env.NODE_ENV,
  });
} catch (err) {
  logger.error("Failed to start server", { error: err });
  process.exit(1);
}

export { app };
export type App = typeof app;
