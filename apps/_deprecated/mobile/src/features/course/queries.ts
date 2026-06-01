// Course queries — server-side (aligned with backend GET /courses)
import { queryOptions, useQuery } from "@tanstack/react-query";
import { type ApiResponse, api } from "@/lib/api";

export interface Course {
  id: string;
  title: string;
  target_exam: string;
  level: string;
  description: string;
  highlights: string[];
  price_vnd: number;
  original_price_vnd: number;
  bonus_coins: number;
  max_slots: number;
  sold_slots: number;
  start_date: string;
  end_date: string;
  instructor_name: string;
  instructor_title: string;
  livestream_url: string;
}

export const coursesQuery = queryOptions({
  queryKey: ["courses"],
  queryFn: () => api.get<ApiResponse<Course[]>>("courses"),
  staleTime: 60_000,
});

export function useCourses() {
  const { data, ...rest } = useQuery(coursesQuery);
  return { data: data?.data ?? [], ...rest };
}

export async function enrollCourse(courseId: string) {
  return api.post(`courses/${courseId}/enroll`);
}

export function isCourseFull(c: Course): boolean { return c.sold_slots >= c.max_slots; }
export function isCourseEnded(c: Course): boolean { return new Date(c.end_date).getTime() < Date.now(); }
export function discountPercent(c: Course): number {
  return c.original_price_vnd > 0 ? Math.round(((c.original_price_vnd - c.price_vnd) / c.original_price_vnd) * 100) : 0;
}
export function formatVnd(n: number): string { return n.toLocaleString("vi-VN") + "đ"; }
