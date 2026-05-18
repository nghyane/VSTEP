export function formatVnd(n: number): string {
	if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B ₫`
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ₫`
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₫`
	return `${n} ₫`
}

export function formatNum(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
	return String(n)
}

export function formatRelativeDate(iso: string): string {
	const d = new Date(iso)
	const diff = Date.now() - d.getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 1) return "Vừa xong"
	if (mins < 60) return `${mins} phút trước`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours} giờ trước`
	const days = Math.floor(hours / 24)
	if (days < 7) return `${days} ngày trước`
	return d.toLocaleDateString("vi-VN")
}

export function formatShortDate(iso: string): string {
	const d = new Date(iso)
	return `${d.getDate()}/${d.getMonth() + 1}`
}

export const CHART_COLORS = {
	primary: "#2563eb",
	primaryLight: "#93c5fd",
	success: "#10b981",
	warning: "#f59e0b",
	danger: "#ef4444",
	info: "#06b6d4",
	purple: "#8b5cf6",
	pink: "#ec4899",
	muted: "#9ca3af",
	light: "#e5e7eb",
}
