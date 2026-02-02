import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get("/", () => "Hello from VSTEP Backend")
  .listen(config.PORT);
