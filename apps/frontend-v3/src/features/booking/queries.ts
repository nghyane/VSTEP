import { queryOptions } from "@tanstack/react-query"
import type { ApiResponse } from "#/lib/api"
import type { BookingPageData, BookingSlot, BookingTeacher, SlotStatus } from "./types"

const SESSION_MINUTES = 30
const HOURS_MORNING = [9, 10, 11]
const HOURS_AFTERNOON = [14, 15, 16, 19, 20]
const WEEKS_AHEAD = 4

function pad2(n: number): string {
	return String(n).padStart(2, "0")
}

function snapMonday(d: Date): Date {
	const r = new Date(d)
	const dow = r.getDay()
	r.setDate(r.getDate() + (dow === 0 ? -6 : 1 - dow))
	r.setHours(0, 0, 0, 0)
	return r
}

function pseudoRandom(seed: number): number {
	const x = Math.sin(seed) * 10000
	return x - Math.floor(x)
}

function statusFor(seedKey: string, startsAtMs: number, now: number): SlotStatus {
	if (startsAtMs < now) return "past"
	let seed = 0
	for (let i = 0; i < seedKey.length; i++) seed = (seed * 31 + seedKey.charCodeAt(i)) | 0
	const r = pseudoRandom(seed)
	if (r < 0.06) return "booked_me"
	if (r < 0.32) return "booked_other"
	return "available"
}

function buildMockSlots(teacherId: string): BookingSlot[] {
	const now = Date.now()
	const start = snapMonday(new Date(now - 7 * 24 * 60 * 60 * 1000))
	const slots: BookingSlot[] = []
	const cur = new Date(start)
	for (let day = 0; day < (WEEKS_AHEAD + 1) * 7; day++) {
		const dow = cur.getDay()
		// Skip Sundays (no slot).
		if (dow !== 0) {
			const hours = dow === 6 ? HOURS_MORNING : [...HOURS_MORNING, ...HOURS_AFTERNOON]
			for (const h of hours) {
				for (const m of [0, 30]) {
					const slotStart = new Date(cur)
					slotStart.setHours(h, m, 0, 0)
					const id = `mock-${teacherId}-${slotStart.getTime()}`
					const startsAt = slotStart.toISOString()
					const status = statusFor(id, slotStart.getTime(), now)
					slots.push({
						id,
						starts_at: startsAt,
						duration_minutes: SESSION_MINUTES,
						status,
						meet_url: status === "booked_me" ? "https://meet.google.com/mock-1-1" : null,
					})
				}
			}
		}
		cur.setDate(cur.getDate() + 1)
	}
	return slots
}

const TEACHERS: Record<string, BookingTeacher> = {}
const SLOT_STORE: Record<string, BookingSlot[]> = {}

function ensureTeacher(courseId: string, fallback: BookingTeacher | null): BookingTeacher {
	if (TEACHERS[courseId]) return TEACHERS[courseId]
	const t: BookingTeacher = fallback ?? {
		id: `teacher-${courseId}`,
		full_name: "Cô Nguyễn Thị Hương",
		title: "Giáo viên chấm thi VSTEP · 8 năm kinh nghiệm",
		bio: "Đặt lịch 1-1 để được sửa bài Writing/Speaking trực tiếp và tư vấn lộ trình cá nhân.",
	}
	TEACHERS[courseId] = t
	if (!SLOT_STORE[courseId]) SLOT_STORE[courseId] = buildMockSlots(t.id)
	return t
}

function getSlots(courseId: string): BookingSlot[] {
	if (!SLOT_STORE[courseId]) SLOT_STORE[courseId] = buildMockSlots(`teacher-${courseId}`)
	return SLOT_STORE[courseId]
}

export function seedTeacher(courseId: string, teacher: BookingTeacher | null): void {
	ensureTeacher(courseId, teacher)
}

export const bookingPageQuery = (courseId: string) =>
	queryOptions({
		queryKey: ["booking", courseId],
		queryFn: async (): Promise<ApiResponse<BookingPageData>> => {
			await new Promise((resolve) => setTimeout(resolve, 280))
			const teacher = ensureTeacher(courseId, null)
			const slots = getSlots(courseId)
			return {
				data: {
					teacher,
					slots,
					my_bookings_count: slots.filter((s) => s.status === "booked_me").length,
				},
			}
		},
		staleTime: 30_000,
	})

export async function bookSlotMock(courseId: string, slotId: string): Promise<BookingSlot> {
	await new Promise((resolve) => setTimeout(resolve, 520))
	const slots = getSlots(courseId)
	const idx = slots.findIndex((s) => s.id === slotId)
	if (idx < 0) throw new Error("Slot không tồn tại.")
	if (slots[idx].status !== "available") throw new Error("Khung giờ này không còn trống.")
	const updated: BookingSlot = {
		...slots[idx],
		status: "booked_me",
		meet_url: "https://meet.google.com/mock-1-1",
	}
	slots[idx] = updated
	return updated
}

export function todayKey(): string {
	const d = new Date()
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
