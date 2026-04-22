import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ListeningExercise, ReadingExercise, McqExerciseDetail } from "./types";

export function useListeningExercises(part?: number) {
  return useQuery({
    queryKey: ["practice", "listening", "exercises", part],
    queryFn: () => api.get<ListeningExercise[]>(`/api/v1/practice/listening/exercises${part ? `?part=${part}` : ""}`),
  });
}

export function useListeningExerciseDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "listening", "exercises", id],
    queryFn: () => api.get<McqExerciseDetail<ListeningExercise>>(`/api/v1/practice/listening/exercises/${id}`),
    enabled: !!id,
  });
}

export function useReadingExercises(part?: number) {
  return useQuery({
    queryKey: ["practice", "reading", "exercises", part],
    queryFn: () => api.get<ReadingExercise[]>(`/api/v1/practice/reading/exercises${part ? `?part=${part}` : ""}`),
  });
}

export function useReadingExerciseDetail(id: string) {
  return useQuery({
    queryKey: ["practice", "reading", "exercises", id],
    queryFn: () => api.get<McqExerciseDetail<ReadingExercise>>(`/api/v1/practice/reading/exercises/${id}`),
    enabled: !!id,
  });
}
