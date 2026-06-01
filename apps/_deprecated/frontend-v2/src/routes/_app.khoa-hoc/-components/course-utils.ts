// Shared helpers cho trang khóa học.

export function formatCoins(n: number): string {
	return n.toLocaleString("vi-VN")
}

export function formatVnd(n: number): string {
	return `${n.toLocaleString("vi-VN")}đ`
}

export function formatDateVi(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export function formatDateShort(iso: string): string {
	const d = new Date(iso)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
}
