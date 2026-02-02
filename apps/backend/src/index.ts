import { app } from "./app.js";

console.log(
  `Server is running at http://${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
