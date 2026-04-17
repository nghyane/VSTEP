// Mock khóa học cấp tốc — giáo viên "gà bài" sát kỳ thi.
// Shape tương đồng với DB sau này để admin có thể CRUD mà component không đổi.

export type CourseLevel = "B1" | "B2" | "C1"

export interface CourseInstructor {
	name: string
	title: string
	bio: string
}

export interface CourseSession {
	id: string
	sessionNumber: number
	date: string // ISO "2026-04-22"
	startTime: string // "19:30"
	endTime: string // "21:30"
	topic: string // "Nghe/Đọc" | "Viết/Nói" | "Tổng ôn"
}

export interface Course {
	id: string
	slug: string
	title: string
	targetExam: string
	level: CourseLevel
	description: string
	highlights: readonly string[]
	/** Giá khóa học tính bằng VND — admin set. */
	priceVnd: number
	/** Giá gốc (niêm yết) tính bằng VND — admin set. Dùng để hiển thị "giảm giá".
	 * Bằng hoặc nhỏ hơn priceVnd khi không giảm giá. */
	originalPriceVnd: number
	/** Xu tặng kèm khi mua khóa — admin set. */
	bonusCoins: number
	maxSlots: number
	soldSlots: number
	startDate: string
	endDate: string
	/** Cam kết kỷ luật: số bài full-test tối thiểu học viên phải hoàn thành trong thời hạn khóa. */
	requiredFullTests: number
	/** Số ngày kể từ `startDate` được phép luyện tập tự do (trước khi bắt đầu giai đoạn thi bắt buộc). */
	practicePhaseDays: number
	/** Số ngày kể từ `startDate` là deadline cuối cùng phải hoàn thành `requiredFullTests` bài thi. */
	examPhaseDays: number
	instructor: CourseInstructor
	livestreamUrl: string
	sessions: readonly CourseSession[]
}

export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = {
	B1: "B1 · Trung cấp",
	B2: "B2 · Trên trung cấp",
	C1: "C1 · Nâng cao",
}

// ─── Helper tạo session grid (8 buổi × 2 tuần) ────────────────────────────────

function buildSessions(
	prefix: string,
	startISO: string,
	pattern: readonly ("Nghe/Đọc" | "Viết/Nói" | "Tổng ôn")[],
): CourseSession[] {
	const start = new Date(startISO)
	return pattern.map((topic, i) => {
		const d = new Date(start)
		d.setDate(start.getDate() + i * 2)
		const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
		return {
			id: `${prefix}-s${i + 1}`,
			sessionNumber: i + 1,
			date: iso,
			startTime: "19:30",
			endTime: "21:30",
			topic,
		}
	})
}

const B1_PATTERN = [
	"Nghe/Đọc",
	"Nghe/Đọc",
	"Viết/Nói",
	"Viết/Nói",
	"Nghe/Đọc",
	"Viết/Nói",
	"Tổng ôn",
	"Tổng ôn",
] as const

// ─── Courses ──────────────────────────────────────────────────────────────────

const K94_B1: Course = {
	id: "course-k94-b1",
	slug: "vstep-b1-cap-toc-k94",
	title: "VSTEP B1 Cấp tốc — K94",
	targetExam: "Đợt thi Đại học Văn Lang 15–17/04/2026",
	level: "B1",
	description:
		"Khóa ôn thi cấp tốc 2 tuần bám sát đề thi VSTEP B1 đợt Văn Lang tháng 04/2026. Giáo viên chỉ mẹo làm bài, phân tích đề mẫu và sửa bài chi tiết.",
	highlights: [
		"8 buổi × 2 giờ — học online qua Zoom",
		"Giáo viên có chứng chỉ chấm thi VSTEP",
		"Cam kết đầu ra, miễn phí học lại nếu chưa đạt B1",
	],
	priceVnd: 1_300_000,
	originalPriceVnd: 2_900_000,
	bonusCoins: 4000,
	requiredFullTests: 3,
	practicePhaseDays: 5,
	examPhaseDays: 10,
	maxSlots: 20,
	soldSlots: 20,
	startDate: "2026-04-08",
	endDate: "2026-04-22",
	instructor: {
		name: "Nguyễn Minh Anh",
		title: "Thạc sĩ Ngôn ngữ Anh · VSTEP C1",
		bio: "10+ năm giảng dạy và luyện thi VSTEP. Hiện đang giảng dạy tại trường Đại học Văn Lang, có chứng chỉ chấm thi VSTEP do Bộ GD&ĐT cấp.",
	},
	livestreamUrl: "https://meet.google.com/abc-defg-hij",
	sessions: buildSessions("k94", "2026-04-08", B1_PATTERN),
}

const K83_B1: Course = {
	id: "course-k83-b1",
	slug: "vstep-b1-cap-toc-k83",
	title: "VSTEP B1 Cấp tốc — K83",
	targetExam: "Đợt thi HNUE 25/04/2026",
	level: "B1",
	description:
		"Khóa ôn thi cấp tốc 2 tuần cho đợt thi HNUE cuối tháng 04. Tập trung vào các dạng bài hay ra và kỹ thuật làm bài dưới áp lực thời gian.",
	highlights: [
		"8 buổi × 2 giờ — học online qua Zoom",
		"Luyện đúng format đề thi HNUE",
		"Có bản ghi buổi học để xem lại",
	],
	priceVnd: 1_300_000,
	originalPriceVnd: 2_900_000,
	bonusCoins: 4000,
	requiredFullTests: 3,
	practicePhaseDays: 5,
	examPhaseDays: 10,
	maxSlots: 20,
	soldSlots: 17,
	startDate: "2026-04-22",
	endDate: "2026-05-06",
	instructor: {
		name: "Trần Quỳnh Chi",
		title: "Thạc sĩ TESOL · VSTEP C1",
		bio: "8 năm chuyên luyện thi VSTEP cấp tốc. Giảng viên tại trung tâm LUYỆN THI VSTEP, có chứng chỉ chấm thi do Bộ GD&ĐT cấp.",
	},
	livestreamUrl: "https://meet.google.com/xyz-1234-mno",
	sessions: buildSessions("k83", "2026-04-22", B1_PATTERN),
}

const K101_B1: Course = {
	id: "course-k101-b1",
	slug: "vstep-b1-cap-toc-k101",
	title: "VSTEP B1 Cấp tốc — K101",
	targetExam: "Đợt thi Đại học Hà Nội 16/05/2026",
	level: "B1",
	description:
		"Khóa chuẩn bị cho đợt thi tháng 05 tại ĐH Hà Nội. Lộ trình ngắn gọn 2 tuần, bám sát đề thi thực tế.",
	highlights: [
		"8 buổi × 2 giờ — học online qua Zoom",
		"Giáo viên sửa bài viết + nói chi tiết",
		"Cam kết đầu ra B1",
	],
	priceVnd: 1_300_000,
	originalPriceVnd: 2_900_000,
	bonusCoins: 4000,
	requiredFullTests: 3,
	practicePhaseDays: 5,
	examPhaseDays: 10,
	maxSlots: 20,
	soldSlots: 12,
	startDate: "2026-05-05",
	endDate: "2026-05-19",
	instructor: {
		name: "Lê Thanh Hà",
		title: "Thạc sĩ Ngôn ngữ Anh · VSTEP C1",
		bio: "9 năm giảng dạy VSTEP. Chuyên gia luyện thi cấp tốc với tỉ lệ học viên đạt B1 trên 98%.",
	},
	livestreamUrl: "https://meet.google.com/pqr-5678-stu",
	sessions: buildSessions("k101", "2026-05-05", B1_PATTERN),
}

const K64_B2: Course = {
	id: "course-k64-b2",
	slug: "vstep-b2-cap-toc-k64",
	title: "VSTEP B2 Cấp tốc — K64",
	targetExam: "Đợt thi Đại học Sư phạm HN 10/05/2026",
	level: "B2",
	description: "Khóa cấp tốc 3 tuần cho học viên nhắm mục tiêu B2. Yêu cầu đầu vào tối thiểu B1.",
	highlights: [
		"12 buổi × 2 giờ — học online qua Zoom",
		"Giáo viên VSTEP C1, chấm thi thực tế",
		"Cam kết đầu ra B2, miễn phí học lại",
	],
	priceVnd: 1_800_000,
	originalPriceVnd: 3_800_000,
	bonusCoins: 5000,
	requiredFullTests: 4,
	practicePhaseDays: 7,
	examPhaseDays: 14,
	maxSlots: 15,
	soldSlots: 11,
	startDate: "2026-04-28",
	endDate: "2026-05-19",
	instructor: {
		name: "Phạm Thu Trang",
		title: "Tiến sĩ Ngôn ngữ Anh · VSTEP C1",
		bio: "12 năm giảng dạy ĐH, chuyên luyện thi VSTEP B2/C1. Chấm thi chính thức tại ĐHSP Hà Nội.",
	},
	livestreamUrl: "https://meet.google.com/uvw-9012-xyz",
	sessions: buildSessions("k64", "2026-04-28", [
		"Nghe/Đọc",
		"Nghe/Đọc",
		"Viết/Nói",
		"Viết/Nói",
		"Nghe/Đọc",
		"Viết/Nói",
		"Nghe/Đọc",
		"Viết/Nói",
		"Tổng ôn",
		"Tổng ôn",
		"Tổng ôn",
		"Tổng ôn",
	]),
}

export const MOCK_COURSES: readonly Course[] = [K94_B1, K83_B1, K101_B1, K64_B2]

// ─── Async fetchers ───────────────────────────────────────────────────────────

export async function mockFetchCourses(): Promise<readonly Course[]> {
	await new Promise((r) => setTimeout(r, 120))
	return MOCK_COURSES
}

export async function mockFetchCourse(id: string): Promise<Course> {
	await new Promise((r) => setTimeout(r, 120))
	const course = MOCK_COURSES.find((c) => c.id === id)
	if (!course) throw new Error(`Không tìm thấy khóa học "${id}"`)
	return course
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

export function isCourseFull(course: Course): boolean {
	return course.soldSlots >= course.maxSlots
}

export function isCourseEnded(course: Course, now: number = Date.now()): boolean {
	return new Date(course.endDate).getTime() < now
}

export function remainingSlots(course: Course): number {
	return Math.max(0, course.maxSlots - course.soldSlots)
}

/** Số tiền user tiết kiệm được (0 nếu không giảm giá). */
export function savedVnd(course: Course): number {
	return Math.max(0, course.originalPriceVnd - course.priceVnd)
}

/** % giảm giá làm tròn (0 nếu không giảm giá). */
export function discountPercent(course: Course): number {
	if (course.originalPriceVnd <= 0) return 0
	const pct = ((course.originalPriceVnd - course.priceVnd) / course.originalPriceVnd) * 100
	return Math.max(0, Math.round(pct))
}

/** True nếu khóa có giảm giá (original > current). */
export function hasDiscount(course: Course): boolean {
	return course.originalPriceVnd > course.priceVnd
}

// ─── Commitment phases ────────────────────────────────────────────────────────

function addDays(iso: string, days: number): number {
	const d = new Date(iso)
	d.setDate(d.getDate() + days)
	return d.getTime()
}

/** Timestamp: thời điểm giai đoạn luyện tập kết thúc (bắt đầu giai đoạn thi bắt buộc). */
export function practicePhaseEndMs(course: Course): number {
	return addDays(course.startDate, course.practicePhaseDays)
}

/** Timestamp: deadline cuối cùng phải hoàn thành `requiredFullTests`. */
export function examDeadlineMs(course: Course): number {
	return addDays(course.startDate, course.examPhaseDays)
}
