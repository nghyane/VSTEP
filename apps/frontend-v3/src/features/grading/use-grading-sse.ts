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

	const eventSourceRef = useRef<EventSource | null>(null)
	const progressRef = useRef<GradingProgress[]>([])
	const scoresRef = useRef<GradingScores | null>(null)

	const close = useCallback(() => {
		eventSourceRef.current?.close()
		eventSourceRef.current = null
	}, [])

	useEffect(() => {
		if (!jobId) return

		const token = tokens.getAccess()
		const url = `${API_URL}/grading-jobs/${jobId}/stream?feedback=${waitForFeedback ? "1" : "0"}${token ? `&token=${encodeURIComponent(token)}` : ""}`
		const es = new EventSource(url)
		eventSourceRef.current = es

		es.addEventListener("progress", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GradingProgress
			progressRef.current = [...progressRef.current, data]
			setState((s) => ({
				...s,
				status: "streaming",
				progress: progressRef.current,
			}))
		})

		es.addEventListener("scores", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GradingScores
			scoresRef.current = data
			setState((s) => ({
				...s,
				scores: data,
			}))
		})

		es.addEventListener("completed", () => {
			setState((s) => ({
				...s,
				status: "completed",
				progress: progressRef.current,
				scores: scoresRef.current,
			}))
			if (!waitForFeedback) {
				close()
			}
		})

		es.addEventListener("feedback", (e: MessageEvent) => {
			const data = JSON.parse(e.data) as GradingFeedback
			setState((s) => ({
				...s,
				feedback: data,
			}))
			close()
		})

		es.addEventListener("failed", (e: MessageEvent) => {
			const data = JSON.parse(e.data)
			setState((s) => ({
				...s,
				status: "failed",
				error: data.error ?? "Grading failed",
			}))
			close()
		})

		es.onerror = () => {
			if (scoresRef.current) return // Already got scores, connection close is expected
			setState((s) => ({
				...s,
				status: "failed",
				error: "Connection lost",
			}))
			close()
		}

		return close
	}, [jobId, close, waitForFeedback])

	return { ...state, close }
}
