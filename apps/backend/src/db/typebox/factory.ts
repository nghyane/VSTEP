import { createSchemaFactory } from "drizzle-typebox";
import { t } from "elysia";

export const { createSelectSchema, createInsertSchema, createUpdateSchema } =
  createSchemaFactory({ typeboxInstance: t });
