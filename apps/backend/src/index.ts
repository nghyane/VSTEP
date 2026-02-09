import { env } from "@common/env";
import { logger } from "@common/logger";
import { app } from "@/app";

app.listen(env.PORT);

logger.info("Server started", {
  url: `http://${app.server?.hostname}:${app.server?.port}`,
  env: Bun.env.NODE_ENV,
});

export { app };
export type App = typeof app;
