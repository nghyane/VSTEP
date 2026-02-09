import { users } from "@db/schema";
import { t } from "elysia";
import { createSelectSchema } from "./factory";

const UserRow = createSelectSchema(users);

export const UserSchema = t.Omit(UserRow, ["passwordHash", "deletedAt"]);
export type UserSchema = typeof UserSchema.static;
