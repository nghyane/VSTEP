import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SubmissionAnswer, SubmissionFull } from "@/types/api";

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { questionId: string; answer: SubmissionAnswer }) =>
      api.post<SubmissionFull>("/api/submissions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
