import { useCallback, useEffect, useRef, useState } from "react"

export interface GradingProgress {
	phase: string
	duration_ms: number
	[key: string]: unknown
}

export interface GradingScores {
	overall_band: number
	rubric_scores: Record<string, number>
	strengths?: string[]
	improvements?: { message: string; explanation: string }[]
	rewrites?: string[]
}

interface SSEState {
	status: "connecting" | "streaming" | "completed" | "failed"
	progress: GradingProgress[]
	scores: GradingScores | null
	error: string | null
}

export function useGradingSSE(jobId: string | null) {
	const [state, setState] = useState<SSEState>({
		status: "connecting",
		progress: [],
		scores: null,
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

		const es = new EventSource(`/api/v1/grading-jobs/${jobId}/stream`)
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
			setState((s) => ({
				...s,
				status: "failed",
				error: "Connection lost",
			}))
			close()
		}

		return close
	}, [jobId, close])

	return state
}
