// Helpers dùng chung trong feature admin-courses: format ngày/giờ + chuyển đổi
// datetime-local ↔ ISO. Tách khỏi components để tránh duplicate giữa CourseForm,
// SlotForm, BulkSlotsForm, SlotsTab, BookingsTab.

export function todayISO(): string {
	return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00`)
	d.setDate(d.getDate() + days)
	return d.toISOString().slice(0, 10)
}

// Datetime-local input expects "YYYY-MM-DDTHH:mm" theo giờ local. Date.toISOString
// trả UTC nên phải bù offset trước khi cắt giây.
export function isoToLocalDateTimeInput(iso: string): string {
	const d = new Date(iso)
	const offset = d.getTimezoneOffset() * 60_000
	return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

export function localDateTimeInputToIso(value: string): string {
	return new Date(value).toISOString()
}

export function nowPlusHoursLocalInput(hours: number): string {
	return isoToLocalDateTimeInput(new Date(Date.now() + hours * 3_600_000).toISOString())
}

export function formatDateOnlyVN(iso: string | null | undefined): string {
	if (!iso) return "—"
	const d = new Date(iso.length >= 10 ? iso.slice(0, 10) : iso)
	return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function formatDateTimeVN(iso: string | null | undefined): string {
	if (!iso) return "—"
	return new Date(iso).toLocaleString("vi-VN", {
		weekday: "short",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

export function formatTimeRange(startIso: string, durationMin: number): string {
	const s = new Date(startIso)
	const e = new Date(s.getTime() + durationMin * 60_000)
	const fmt = (d: Date) =>
		`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
	return `${fmt(s)} – ${fmt(e)}`
}
