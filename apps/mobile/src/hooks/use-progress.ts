// Progress hooks — thin wrappers over dashboard queries
import { useQuery } from "@tanstack/react-query";
import { overviewQuery, activityHeatmapQuery } from "@/features/dashboard/queries";

export function useProgress() {
  const { data, ...rest } = useQuery(overviewQuery);
  return { data: data?.data, ...rest };
}

export function useActivity(_days = 7) {
  const { data, ...rest } = useQuery(activityHeatmapQuery);
  return { data: data?.data, ...rest };
}
