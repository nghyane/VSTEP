import { users } from "@db/schema";
import { getTableColumns } from "drizzle-orm";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { toQueryColumns } from "./helpers";

const { passwordHash: _, deletedAt: __, ...columns } = getTableColumns(users);
const UserRow = createSelectSchema(users);

export const userView = {
  columns,
  queryColumns: toQueryColumns(columns),
  schema: t.Omit(UserRow, ["passwordHash", "deletedAt"]),
};
