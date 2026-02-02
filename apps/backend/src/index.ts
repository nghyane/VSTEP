import { app } from "./app.js";

console.log(`Server is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
