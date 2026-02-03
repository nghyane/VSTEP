import { app } from "./app";

console.log(
  `Server is running at http://${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
