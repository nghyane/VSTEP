import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  BookingResult,
  CourseDetail,
  CourseListResponse,
  EnrollmentOrder,
} from "@/features/course/types";

export const coursesQuery = {
  queryKey: ["courses"] as const,
  queryFn: () => api.get<CourseListResponse>("/api/v1/courses"),
};

export function useCourses() {
  return useQuery(coursesQuery);
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["courses", id] as const,
    queryFn: () => api.get<CourseDetail>(`/api/v1/courses/${id}`),
    enabled: !!id,
  });
}

export function useEnrollmentOrders() {
  return useQuery({
    queryKey: ["courses", "enrollment-orders"] as const,
    queryFn: () => api.get<EnrollmentOrder[]>("/api/v1/courses/enrollment-orders"),
  });
}

export function useCreateEnrollmentOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) =>
      api.post<EnrollmentOrder>(`/api/v1/courses/${courseId}/enrollment-orders`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["courses"] });
      void qc.invalidateQueries({ queryKey: ["courses", "enrollment-orders"] });
    },
  });
}

export function useConfirmEnrollmentOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<EnrollmentOrder>(`/api/v1/courses/enrollment-orders/${orderId}/confirm`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["courses"] });
      void qc.invalidateQueries({ queryKey: ["courses", "enrollment-orders"] });
    },
  });
}

export function useBookSlot() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { courseId: string; slotId: string; submissionType?: string; submissionId?: string }) =>
      api.post<BookingResult>(`/api/v1/courses/${body.courseId}/bookings`, {
        slot_id: body.slotId,
        submission_type: body.submissionType,
        submission_id: body.submissionId,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}
