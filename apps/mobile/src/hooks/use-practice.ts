// Practice hooks — thin wrappers
import { useQuery } from "@tanstack/react-query";
import { practiceExercisesQuery } from "@/features/practice/queries";

export function usePracticeExercises(skill: "listening" | "reading") {
  const { data, ...rest } = useQuery(practiceExercisesQuery(skill));
  return { data: data?.data, ...rest };
}
