import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Grammar types (mirror frontend-v3) ──

export interface GrammarPoint {
  id: string;
  slug: string;
  name: string;
  vietnameseName: string | null;
  summary: string | null;
  category: string | null;
  displayOrder: number;
  levels: string[];
  tasks: string[];
  functions: string[];
}

// ── Queries ──

export function useGrammarPoints() {
  return useQuery({
    queryKey: ["grammar", "points"],
    queryFn: () => api.get<GrammarPoint[]>("/api/v1/grammar/points"),
  });
}
