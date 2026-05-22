export interface CourseTeacher {
  id: string;
  fullName: string;
  title?: string | null;
  bio?: string | null;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  targetLevel: string;
  targetExamSchool: string | null;
  description: string | null;
  priceVnd: number;
  originalPriceVnd: number | null;
  bonusCoins: number;
  maxSlots: number;
  startDate: string;
  endDate: string;
  requiredFullTests: number;
  commitmentWindowDays: number;
  livestreamUrl: string | null;
  teacher: CourseTeacher | null;
  soldSlots?: number;
  scheduleItemsCount?: number;
}

export interface CourseScheduleItem {
  id: string;
  sessionNumber: number;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
}

export interface CourseWithRelations extends Course {
  scheduleItems: CourseScheduleItem[];
}

export type CommitmentPhase = "not_enrolled" | "pending" | "met" | "violated";

export interface CommitmentStatus {
  phase: CommitmentPhase;
  completed: number;
  required: number;
  windowStartAt: string | null;
  deadlineAt: string | null;
}

export interface CourseDetail {
  course: CourseWithRelations;
  soldSlots: number;
  commitment: CommitmentStatus | null;
}

export interface EnrollmentDetail {
  nextSession: CourseScheduleItem | null;
  commitment: CommitmentStatus;
}

export interface CourseListResponse {
  data: Course[];
  enrolledCourseIds: string[];
  enrollments: Record<string, EnrollmentDetail>;
}

export interface EnrollResult {
  enrollmentId: string;
  coinsPaid: number;
  bonusReceived: number;
}

export interface EnrollmentOrder {
  id: string;
  courseId: string;
  courseTitle: string;
  amountVnd: number;
  status: string;
  paymentProvider: string;
  paidAt: string | null;
  createdAt: string;
}

export type BookingSlotStatus = "available" | "booked_other" | "booked_me" | "past";

export interface BookingSlot {
  id: string;
  startsAt: string;
  durationMinutes: number;
  status: BookingSlotStatus;
  meetUrl: string | null;
}

export interface BookingTeacher {
  id: string;
  fullName: string;
  title: string | null;
  bio: string | null;
}

export interface BookingCommitment {
  phase: CommitmentPhase;
  completed: number;
  required: number;
  windowStartAt: string | null;
  deadlineAt: string | null;
}

export interface BookingPageData {
  teacher: BookingTeacher;
  slots: BookingSlot[];
  myBookingsCount: number;
  maxBookingsPerStudent: number;
  commitment: BookingCommitment;
}

export interface BookingResult {
  bookingId: string;
  slot: BookingSlot;
  coinsCharged: number;
}
