import { useEffect, useState } from "react"

export function useTimer(startedAt: string, durationMinutes: number): number {
	const [remaining, setRemaining] = useState(() => calcRemaining(startedAt, durationMinutes))

	useEffect(() => {
		if (durationMinutes <= 0) return

		const interval = setInterval(() => {
			setRemaining(calcRemaining(startedAt, durationMinutes))
		}, 1000)

		return () => clearInterval(interval)
	}, [startedAt, durationMinutes])

	return remaining
}

function calcRemaining(startedAt: string, durationMinutes: number): number {
	const endMs = new Date(startedAt).getTime() + durationMinutes * 60 * 1000
	const now = Date.now()
	return Math.max(0, Math.floor((endMs - now) / 1000))
}
