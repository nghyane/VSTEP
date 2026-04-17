// Compute trạng thái cam kết kỷ luật cho 1 enrollment cụ thể.
// Tất cả logic derive từ: Course (phase config) + Enrollment (purchasedAt)
// + completion log (số full-test đã hoàn thành trong window).

import { countFullTestsInWindow } from "#/lib/courses/completion-log"
import type { Enrollment } from "#/lib/courses/enrollment-store"
import { type Course, examDeadlineMs, practicePhaseEndMs } from "#/lib/mock/courses"

export type CommitmentPhase =
	| "practice" // Đang luyện tập — chưa tới giai đoạn thi bắt buộc
	| "exam" // Trong giai đoạn thi bắt buộc
	| "fulfilled" // Đã đủ số bài thi yêu cầu
	| "violated" // Quá deadline, chưa đủ — tài khoản bị khóa

export interface CommitmentStatus {
	phase: CommitmentPhase
	/** Số bài full-test đã hoàn thành trong cửa sổ tính. */
	completed: number
	/** Số bài cần (lấy từ course.requiredFullTests). */
	required: number
	/** Số bài còn thiếu = max(0, required - completed). */
	remaining: number
	/** Timestamp bắt đầu giai đoạn thi (ms). */
	examPhaseStartMs: number
	/** Timestamp deadline cuối (ms). */
	examDeadlineMs: number
	/** Số ms còn lại tới deadline (âm nếu đã qua). */
	msUntilDeadline: number
	/** Số ngày còn lại tới deadline (ceil, âm nếu đã qua). */
	daysUntilDeadline: number
}

/**
 * Tính window đếm full-test: từ lúc mua khóa → deadline.
 * Lý do tính cả practice phase: nếu user tự giác làm full-test sớm thì vẫn tính.
 */
function computeWindow(course: Course, enrollment: Enrollment): { from: number; to: number } {
	return {
		from: enrollment.purchasedAt,
		to: examDeadlineMs(course),
	}
}

export function computeCommitment(
	course: Course,
	enrollment: Enrollment,
	now: number = Date.now(),
): CommitmentStatus {
	const examStart = practicePhaseEndMs(course)
	const deadline = examDeadlineMs(course)
	const { from, to } = computeWindow(course, enrollment)
	const completed = countFullTestsInWindow(from, to)
	const required = course.requiredFullTests
	const remaining = Math.max(0, required - completed)
	const msUntilDeadline = deadline - now
	const daysUntilDeadline = Math.ceil(msUntilDeadline / (1000 * 60 * 60 * 24))

	let phase: CommitmentPhase
	if (completed >= required) {
		phase = "fulfilled"
	} else if (now > deadline) {
		phase = "violated"
	} else if (now < examStart) {
		phase = "practice"
	} else {
		phase = "exam"
	}

	return {
		phase,
		completed,
		required,
		remaining,
		examPhaseStartMs: examStart,
		examDeadlineMs: deadline,
		msUntilDeadline,
		daysUntilDeadline,
	}
}

export function commitmentPhaseLabel(phase: CommitmentPhase): string {
	switch (phase) {
		case "practice":
			return "Đang luyện tập"
		case "exam":
			return "Đến hạn thi"
		case "fulfilled":
			return "Đã hoàn thành cam kết"
		case "violated":
			return "Vi phạm cam kết"
	}
}
