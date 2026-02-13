import { env } from "@common/env";
import { logger } from "@common/logger";
import { app } from "@/app";

try {
  app.listen(env.PORT);

  logger.info("Server started", {
    url: `http://${app.server?.hostname}:${app.server?.port}`,
    env: Bun.env.NODE_ENV,
  });
} catch (err) {
  logger.error("Failed to start server", { error: err });
  process.exit(1);
}

export { app };
export type App = typeof app;
