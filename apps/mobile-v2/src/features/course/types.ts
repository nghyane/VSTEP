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

export interface CommitmentStatus {
  phase: "not_enrolled" | "pending" | "met";
  completed: number;
  required: number;
}

export interface CourseDetail {
  course: CourseWithRelations;
  soldSlots: number;
  commitment: CommitmentStatus | null;
}

export interface CourseListResponse {
  data: Course[];
  enrolledCourseIds: string[];
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

export interface BookingResult {
  bookingId: string;
  slotStartsAt: string;
  meetUrl: string;
}
