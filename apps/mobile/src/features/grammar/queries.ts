import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GrammarPoint, GrammarPointDetail } from "./types";

export function useGrammarPoints() {
  return useQuery({
    queryKey: ["grammar", "points"],
    queryFn: () => api.get<GrammarPoint[]>("/api/v1/grammar/points"),
  });
}

export function useGrammarPointDetail(id: string) {
  return useQuery({
    queryKey: ["grammar", "points", id],
    queryFn: () => api.get<GrammarPointDetail>(`/api/v1/grammar/points/${id}`),
    enabled: !!id,
  });
}
