import { userGoals, userProgress } from "@db/schema";
import { createSelectSchema } from "./factory";

export const ProgressSchema = createSelectSchema(userProgress);
export type ProgressSchema = typeof ProgressSchema.static;

export const ProgressGoal = createSelectSchema(userGoals);
export type ProgressGoal = typeof ProgressGoal.static;
