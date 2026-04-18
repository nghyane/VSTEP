// Course mock data + enrollment store — aligned with frontend-v2 mocks/courses.ts
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { refundCoins } from "@/features/coin/coin-store";

// ─── Types ───────────────────────────────────────────────────────
export interface CourseSession {
  id: string;
  sessionNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
}

export interface Course {
  id: string;
  title: string;
  targetExam: string;
  level: "B1" | "B2" | "C1";
  description: string;
  highlights: string[];
  priceVnd: number;
  originalPriceVnd: number;
  bonusCoins: number;
  maxSlots: number;
  soldSlots: number;
  startDate: string;
  endDate: string;
  instructorName: string;
  instructorTitle: string;
  livestreamUrl: string;
  sessions: CourseSession[];
}

// ─── Mock courses ────────────────────────────────────────────────
function buildSessions(prefix: string, startISO: string, topics: string[]): CourseSession[] {
  const start = new Date(startISO);
  return topics.map((topic, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i * 2);
    return { id: `${prefix}-s${i + 1}`, sessionNumber: i + 1, date: d.toISOString().slice(0, 10), startTime: "19:30", endTime: "21:30", topic };
  });
}

const PATTERN = ["Nghe/Đọc", "Nghe/Đọc", "Viết/Nói", "Viết/Nói", "Nghe/Đọc", "Viết/Nói", "Tổng ôn", "Tổng ôn"];

export const MOCK_COURSES: Course[] = [
  {
    id: "course-k94-b1", title: "VSTEP B1 Cấp tốc — K94", targetExam: "Đợt thi ĐH Văn Lang 15–17/04/2026", level: "B1",
    description: "Khóa ôn thi cấp tốc 2 tuần bám sát đề thi VSTEP B1.", highlights: ["8 buổi × 2 giờ — Zoom", "GV có chứng chỉ chấm thi VSTEP", "Cam kết đầu ra B1"],
    priceVnd: 1_300_000, originalPriceVnd: 2_900_000, bonusCoins: 4000, maxSlots: 20, soldSlots: 20,
    startDate: "2026-04-08", endDate: "2026-04-22", instructorName: "Nguyễn Minh Anh", instructorTitle: "ThS Ngôn ngữ Anh · VSTEP C1",
    livestreamUrl: "https://meet.google.com/abc-defg-hij", sessions: buildSessions("k94", "2026-04-08", PATTERN),
  },
  {
    id: "course-k83-b1", title: "VSTEP B1 Cấp tốc — K83", targetExam: "Đợt thi HNUE 25/04/2026", level: "B1",
    description: "Khóa ôn thi cấp tốc 2 tuần cho đợt thi HNUE cuối tháng 04.", highlights: ["8 buổi × 2 giờ — Zoom", "Luyện đúng format đề HNUE", "Có bản ghi buổi học"],
    priceVnd: 1_300_000, originalPriceVnd: 2_900_000, bonusCoins: 4000, maxSlots: 20, soldSlots: 17,
    startDate: "2026-04-22", endDate: "2026-05-06", instructorName: "Trần Quỳnh Chi", instructorTitle: "ThS TESOL · VSTEP C1",
    livestreamUrl: "https://meet.google.com/xyz-1234-mno", sessions: buildSessions("k83", "2026-04-22", PATTERN),
  },
  {
    id: "course-k64-b2", title: "VSTEP B2 Cấp tốc — K64", targetExam: "Đợt thi ĐHSP HN 10/05/2026", level: "B2",
    description: "Khóa cấp tốc 3 tuần cho học viên nhắm mục tiêu B2.", highlights: ["12 buổi × 2 giờ — Zoom", "GV VSTEP C1, chấm thi thực tế", "Cam kết đầu ra B2"],
    priceVnd: 1_800_000, originalPriceVnd: 3_800_000, bonusCoins: 5000, maxSlots: 15, soldSlots: 11,
    startDate: "2026-04-28", endDate: "2026-05-19", instructorName: "Phạm Thu Trang", instructorTitle: "TS Ngôn ngữ Anh · VSTEP C1",
    livestreamUrl: "https://meet.google.com/uvw-9012-xyz", sessions: buildSessions("k64", "2026-04-28", [...PATTERN, "Nghe/Đọc", "Viết/Nói", "Tổng ôn", "Tổng ôn"]),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────
export function isCourseFull(c: Course): boolean { return c.soldSlots >= c.maxSlots; }
export function isCourseEnded(c: Course): boolean { return new Date(c.endDate).getTime() < Date.now(); }
export function discountPercent(c: Course): number { return c.originalPriceVnd > 0 ? Math.round(((c.originalPriceVnd - c.priceVnd) / c.originalPriceVnd) * 100) : 0; }
export function formatVnd(n: number): string { return n.toLocaleString("vi-VN") + "đ"; }

// ─── Enrollment store ────────────────────────────────────────────
interface Enrollment { courseId: string; purchasedAt: number }
const ENROLL_KEY = "vstep:course-enrollments:v1";
let enrollments: Enrollment[] = [];
const enrollListeners = new Set<() => void>();

function emitEnroll() {
  SecureStore.setItemAsync(ENROLL_KEY, JSON.stringify(enrollments)).catch(() => {});
  for (const fn of enrollListeners) fn();
}

export async function loadEnrollments(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(ENROLL_KEY);
    if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) enrollments = arr; }
  } catch {}
}

export function useEnrollments(): Enrollment[] {
  const [val, setVal] = useState(enrollments);
  useEffect(() => { const fn = () => setVal([...enrollments]); enrollListeners.add(fn); return () => { enrollListeners.delete(fn); }; }, []);
  return val;
}

export function isEnrolled(courseId: string): boolean { return enrollments.some((e) => e.courseId === courseId); }

export function enrollInCourse(course: Course): void {
  if (isEnrolled(course.id)) return;
  enrollments = [...enrollments, { courseId: course.id, purchasedAt: Date.now() }];
  emitEnroll();
  refundCoins(course.bonusCoins);
}
