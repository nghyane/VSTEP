// Format interval (giây) thành chuỗi ngắn giống Anki: "<1m", "6m", "1d", "4d", "1mo"…

export function formatInterval(seconds: number): string {
	if (seconds < 60) return "<1m"
	const minutes = seconds / 60
	if (minutes < 60) return `${Math.round(minutes)}m`
	const hours = minutes / 60
	if (hours < 24) return `${Math.round(hours)}h`
	const days = hours / 24
	if (days < 30) return `${Math.round(days)}d`
	const months = days / 30
	if (months < 12) {
		const rounded = Math.round(months * 10) / 10
		return `${rounded}mo`
	}
	const years = days / 365
	return `${Math.round(years * 10) / 10}y`
}
