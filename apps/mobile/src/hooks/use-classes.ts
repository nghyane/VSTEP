import { useQuery, useMutation } from "@tanstack/react-query";
import { MOCK_CLASSES } from "@/lib/mock";
import type { ClassItem, ClassDetail, ClassFeedback, ClassAssignment, ClassAssignmentSubmission, LeaderboardEntry, PaginatedResponse } from "@/types/api";

export function useClasses() {
  return useQuery({ queryKey: ["classes"], queryFn: async (): Promise<PaginatedResponse<ClassItem>> => ({ data: MOCK_CLASSES, meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) });
}

export function useClassDetail(id: string) {
  return useQuery({ queryKey: ["classes", id], queryFn: async () => ({} as ClassDetail), enabled: !!id });
}

export function useJoinClass() { return useMutation({ mutationFn: async (_code: string) => ({ classId: "", className: "" }) }); }
export function useLeaveClass() { return useMutation({ mutationFn: async (_id: string) => ({ id: _id }) }); }

export function useClassFeedback(classId: string) {
  return useQuery({ queryKey: ["classes", classId, "feedback"], queryFn: async (): Promise<PaginatedResponse<ClassFeedback>> => ({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }), enabled: !!classId });
}

export function useSendFeedback() { return useMutation({ mutationFn: async (_body: any) => ({} as ClassFeedback) }); }

export function useAssignments(classId: string) {
  return useQuery({ queryKey: ["classes", classId, "assignments"], queryFn: async (): Promise<ClassAssignment[]> => [], enabled: !!classId });
}

export function useAssignment(classId: string, assignmentId: string) {
  return useQuery({ queryKey: ["classes", classId, "assignments", assignmentId], queryFn: async () => ({} as ClassAssignment), enabled: !!classId && !!assignmentId });
}

export function useStartAssignment() { return useMutation({ mutationFn: async (_body: any) => ({} as ClassAssignmentSubmission) }); }
export function useSubmitAnswer() { return useMutation({ mutationFn: async (_body: any) => ({} as ClassAssignmentSubmission) }); }

export function useLeaderboard(classId: string) {
  return useQuery({ queryKey: ["classes", classId, "leaderboard"], queryFn: async (): Promise<LeaderboardEntry[]> => [], enabled: !!classId });
}
