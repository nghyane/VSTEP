// Compute trạng thái cam kết kỷ luật cho 1 enrollment cụ thể.
// Model đơn giản: học viên phải hoàn thành `requiredFullTests` trong `commitmentWindowDays`
// ngày kể từ `startDate`. Admin sẽ CRUD 2 con số này sau, nên UI chỉ derive, không hard-code.

import { countFullTestsInWindow } from "#/lib/courses/completion-log"
import type { Enrollment } from "#/lib/courses/enrollment-store"
import { type Course, commitmentDeadlineMs } from "#/mocks/courses"

export type CommitmentPhase =
	| "active" // Còn hạn, chưa đủ bài — đang trong cửa sổ cam kết
	| "fulfilled" // Đã đủ số bài yêu cầu
	| "violated" // Quá hạn, chưa đủ — tài khoản bị khóa

export interface CommitmentStatus {
	phase: CommitmentPhase
	completed: number
	required: number
	remaining: number
	/** Timestamp deadline cuối (ms). */
	deadlineMs: number
	/** Số ms còn lại tới deadline (âm nếu đã qua). */
	msUntilDeadline: number
	/** Số ngày còn lại tới deadline (ceil, âm nếu đã qua). */
	daysUntilDeadline: number
}

export function computeCommitment(
	course: Course,
	enrollment: Enrollment,
	now: number = Date.now(),
): CommitmentStatus {
	const deadline = commitmentDeadlineMs(course)
	// Đếm full-test từ lúc enroll đến deadline.
	const completed = countFullTestsInWindow(enrollment.purchasedAt, deadline)
	const required = course.requiredFullTests
	const remaining = Math.max(0, required - completed)
	const msUntilDeadline = deadline - now
	const daysUntilDeadline = Math.ceil(msUntilDeadline / (1000 * 60 * 60 * 24))

	let phase: CommitmentPhase
	if (completed >= required) phase = "fulfilled"
	else if (now > deadline) phase = "violated"
	else phase = "active"

	return {
		phase,
		completed,
		required,
		remaining,
		deadlineMs: deadline,
		msUntilDeadline,
		daysUntilDeadline,
	}
}

export function commitmentPhaseLabel(phase: CommitmentPhase): string {
	switch (phase) {
		case "active":
			return "Đang trong thời hạn cam kết"
		case "fulfilled":
			return "Đã hoàn thành cam kết"
		case "violated":
			return "Vi phạm cam kết"
	}
}
