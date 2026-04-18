// exam-helpers — timer hook + utils cho phong-thi exam page.

import { useEffect, useState } from "react"

export function useCountdown(
	durationMinutes: number,
	started: boolean,
	isUnlimited: boolean,
): number | null {
	const [remaining, setRemaining] = useState<number | null>(
		isUnlimited ? null : durationMinutes * 60,
	)
	useEffect(() => {
		setRemaining(isUnlimited ? null : durationMinutes * 60)
	}, [durationMinutes, isUnlimited])
	useEffect(() => {
		if (!started || isUnlimited) return
		const id = setInterval(
			() => setRemaining((r) => (r === null ? durationMinutes * 60 : Math.max(0, r - 1))),
			1000,
		)
		return () => clearInterval(id)
	}, [durationMinutes, started, isUnlimited])
	return remaining
}

export function formatTime(seconds: number | null): string {
	if (seconds === null) return "\u221e"
	if (seconds <= 0) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function parseSelectedSectionIds(sections?: string): string[] {
	if (!sections) return []
	return sections
		.split(",")
		.map((sectionId) => sectionId.trim())
		.filter(Boolean)
}
