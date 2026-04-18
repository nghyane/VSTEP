// Enrollment store — lưu các khóa đã mua bằng localStorage.
// Pattern: giống streak-rewards/coin-store (module state + CustomEvent broadcast).
//
// Ghi chú: khóa học được mua bằng TIỀN THẬT (VND), không phải xu. Xu là vật phẩm
// tặng kèm — sau khi thanh toán thành công, cộng `bonusCoins` vào coin-store.

import { useSyncExternalStore } from "react"
import { refundCoins } from "#/features/coin/lib/coin-store"
import type { Course } from "#/mocks/courses"

export interface Enrollment {
	courseId: string
	purchasedAt: number
	/** Số VND đã trả (snapshot lúc mua). */
	pricePaidVnd: number
	/** Xu bonus đã nhận khi mua khóa (snapshot). */
	bonusCoinsReceived: number
	/** Cam kết kỷ luật user đã tick lúc mua (snapshot). */
	acknowledgedCommitment: boolean
}

const STORAGE_KEY = "vstep:course-enrollments:v1"
const EVENT = "vstep:course-enrollments-change"

let enrollments: readonly Enrollment[] = loadInitial()

function loadInitial(): Enrollment[] {
	if (typeof window === "undefined") return []
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		return parsed
			.filter(
				(e): e is Partial<Enrollment> & Pick<Enrollment, "courseId"> =>
					e !== null &&
					typeof e === "object" &&
					typeof (e as Enrollment).courseId === "string" &&
					typeof (e as Enrollment).purchasedAt === "number" &&
					typeof (e as Enrollment).pricePaidVnd === "number" &&
					typeof (e as Enrollment).bonusCoinsReceived === "number",
			)
			.map((e) => ({
				courseId: e.courseId,
				purchasedAt: e.purchasedAt ?? 0,
				pricePaidVnd: e.pricePaidVnd ?? 0,
				bonusCoinsReceived: e.bonusCoinsReceived ?? 0,
				// Migrate enrollments cũ chưa có field này — coi như đã đồng ý.
				acknowledgedCommitment: e.acknowledgedCommitment ?? true,
			}))
	} catch {
		return []
	}
}

function persist() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollments))
	} catch {
		// ignore
	}
}

function emit() {
	persist()
	window.dispatchEvent(new CustomEvent(EVENT))
}

function subscribe(cb: () => void): () => void {
	window.addEventListener(EVENT, cb)
	return () => window.removeEventListener(EVENT, cb)
}

function getSnapshot(): readonly Enrollment[] {
	return enrollments
}

const EMPTY: readonly Enrollment[] = []

export function useEnrollments(): readonly Enrollment[] {
	return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}

export function getEnrollments(): readonly Enrollment[] {
	return enrollments
}

export function isEnrolled(courseId: string): boolean {
	return enrollments.some((e) => e.courseId === courseId)
}

/**
 * Ghi nhận user đã mua khóa học (mock — giả lập payment đã thành công).
 * Cộng xu bonus vào coin-store như quà tặng kèm.
 * Idempotent — nếu đã enrolled thì không cộng xu thêm lần 2.
 */
export function enrollInCourse(course: Course): void {
	if (isEnrolled(course.id)) return
	const next: Enrollment[] = [
		...enrollments,
		{
			courseId: course.id,
			purchasedAt: Date.now(),
			pricePaidVnd: course.priceVnd,
			bonusCoinsReceived: course.bonusCoins,
			acknowledgedCommitment: true,
		},
	]
	enrollments = next
	emit()
	if (course.bonusCoins > 0) refundCoins(course.bonusCoins)
}
