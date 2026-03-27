import { env } from "@common/env";
import { logger } from "@common/logger";
import { app } from "@/app";
import {
  startGradingConsumer,
  stopGradingConsumer,
} from "@/modules/submissions/grading-consumer";

try {
  app.listen({
    port: env.PORT,
    maxRequestBodySize: 1024 * 1024 * 2, // 2MB
  });

  logger.info("Server started", {
    url: `http://${app.server?.hostname}:${app.server?.port}`,
    env: env.NODE_ENV,
  });

  startGradingConsumer().catch((err) => {
    logger.error("Failed to start grading consumer", { error: err });
  });
} catch (err) {
  logger.error("Failed to start server", { error: err });
  process.exit(1);
}

function shutdown() {
  logger.info("Shutting down...");
  stopGradingConsumer();
  app.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { app };
export type App = typeof app;
