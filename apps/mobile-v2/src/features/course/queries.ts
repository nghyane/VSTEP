import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type {
  BookingPageData,
  BookingResult,
  CourseDetail,
  CourseListResponse,
  EnrollmentOrder,
} from "@/features/course/types";
import type { WalletBalance } from "@/features/wallet/types";

// Fallback for the rare case where the BookingPageData query hasn't loaded yet.
// Source of truth is `data.bookingCoinCost` from GET /courses/{id}/bookings
// (BE commit 7aec9fb made it per-course; default 50 server-side).
export const BOOKING_COIN_COST_FALLBACK = 50;

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

export function useBookingPage(courseId: string) {
  return useQuery({
    queryKey: ["booking", courseId] as const,
    queryFn: () => api.get<BookingPageData>(`/api/v1/courses/${courseId}/bookings`),
    enabled: !!courseId,
    staleTime: 30_000,
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
        slotId: body.slotId,
        submissionType: body.submissionType,
        submissionId: body.submissionId,
      }),
    onSuccess: (result, variables) => {
      qc.setQueryData<BookingPageData>(["booking", variables.courseId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          slots: prev.slots.map((slot) => (slot.id === result.slot.id ? result.slot : slot)),
          myBookingsCount: prev.myBookingsCount + 1,
        };
      });
      qc.setQueryData<WalletBalance>(["wallet", "balance"], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          balance: Math.max(0, prev.balance - result.coinsCharged),
          lastTransactionAt: new Date().toISOString(),
        };
      });
      void qc.invalidateQueries({ queryKey: ["courses"] });
      void qc.invalidateQueries({ queryKey: ["booking"] });
      void qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
