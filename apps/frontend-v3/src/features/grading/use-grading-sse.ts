import { fetchEventSource } from "@microsoft/fetch-event-source"
import { useCallback, useEffect, useRef, useState } from "react"
import { API_URL } from "#/lib/api"
import { tokens } from "#/lib/tokens"

export interface GradingProgress {
	phase: string
	duration_ms: number
	[key: string]: unknown
}

export interface GradingScores {
	overall_band: number
	rubric_scores: Record<string, number>
	annotations?: Record<string, unknown>
	pronunciation_report?: Record<string, unknown>
	transcript?: string
}

export interface GradingFeedback {
	status: "ready"
}

interface SSEState {
	status: "connecting" | "streaming" | "completed" | "failed"
	progress: GradingProgress[]
	scores: GradingScores | null
	feedback: GradingFeedback | null
	error: string | null
}

export function useGradingSSE(jobId: string | null, waitForFeedback = false) {
	const [state, setState] = useState<SSEState>({
		status: "connecting",
		progress: [],
		scores: null,
		feedback: null,
		error: null,
	})

	const abortRef = useRef<AbortController | null>(null)
	const progressRef = useRef<GradingProgress[]>([])
	const scoresRef = useRef<GradingScores | null>(null)

	const close = useCallback(() => {
		abortRef.current?.abort()
		abortRef.current = null
	}, [])

	useEffect(() => {
		if (!jobId) return

		const token = tokens.getAccess()
		if (!token) {
			setState((s) => ({ ...s, status: "failed", error: "Not authenticated" }))
			return
		}

		const controller = new AbortController()
		abortRef.current = controller

		const url = `${API_URL}/grading-jobs/${jobId}/stream?feedback=${waitForFeedback ? "1" : "0"}`

		fetchEventSource(url, {
			headers: { Authorization: `Bearer ${token}` },
			signal: controller.signal,
			onopen: async (response) => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`)
				}
			},
			onmessage: (event) => {
				if (!event.data) return

				try {
					const data = JSON.parse(event.data)

					switch (event.event) {
						case "progress":
							progressRef.current = [...progressRef.current, data as GradingProgress]
							setState((s) => ({ ...s, status: "streaming", progress: progressRef.current }))
							break
						case "scores":
							scoresRef.current = data as GradingScores
							setState((s) => ({ ...s, scores: data as GradingScores }))
							break
						case "completed":
							setState((s) => ({
								...s,
								status: "completed",
								progress: progressRef.current,
								scores: scoresRef.current,
							}))
							if (!waitForFeedback) close()
							break
						case "feedback":
							setState((s) => ({ ...s, feedback: data as GradingFeedback }))
							close()
							break
						case "failed":
							setState((s) => ({
								...s,
								status: "failed",
								error: (data as { error?: string }).error ?? "Grading failed",
							}))
							close()
							break
					}
				} catch {
					// ignore parse errors
				}
			},
			onerror: (error) => {
				if (scoresRef.current) {
					// Already got scores — don't throw, let connection close naturally
					return
				}
				setState((s) => ({ ...s, status: "failed", error: "Connection lost" }))
				close()
				throw error // stop retry
			},
		})

		return close
	}, [jobId, close, waitForFeedback])

	return { ...state, close }
}
