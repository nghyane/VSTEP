// Submissions hooks — exam session results
import { useQuery } from "@tanstack/react-query";
import { examSessionsQuery } from "@/features/dashboard/queries";

export function useSubmissions() {
  const { data, ...rest } = useQuery(examSessionsQuery);
  return { data: data?.data, ...rest };
}
