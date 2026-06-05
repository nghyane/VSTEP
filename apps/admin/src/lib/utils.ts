export function cn(...inputs: (string | number | boolean | null | undefined)[]): string {
	return inputs.filter((x): x is string => typeof x === "string" && x.length > 0).join(" ")
}

export const ADMIN_TIME_ZONE = "Asia/Ho_Chi_Minh"

export function formatDate(iso: string | null | undefined): string {
	if (!iso) return "—"
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return "—"
	return d.toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		timeZone: ADMIN_TIME_ZONE,
	})
}

export function formatDateTime(iso: string | null | undefined): string {
	if (!iso) return "—"
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return "—"
	return d.toLocaleString("vi-VN", { timeZone: ADMIN_TIME_ZONE })
}
