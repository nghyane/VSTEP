import { useCallback, useEffect, useRef, useState } from "react"
import { type ApiResponse, api } from "#/lib/api"

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

interface GradingJobData {
	status: string
	progress: GradingProgress[]
	scores?: GradingScores
	feedback_ready?: boolean
	error?: string
}

interface PollState {
	status: "connecting" | "streaming" | "completed" | "failed"
	progress: GradingProgress[]
	scores: GradingScores | null
	feedbackReady: boolean
	error: string | null
}

const POLL_MS = 1_500
const TIMEOUT_MS = 60_000

export function useGradingPoll(jobId: string | null) {
	const [state, setState] = useState<PollState>({
		status: "connecting",
		progress: [],
		scores: null,
		feedbackReady: false,
		error: null,
	})

	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const progressRef = useRef<GradingProgress[]>([])
	const startRef = useRef(Date.now())

	const stop = useCallback(() => {
		if (timerRef.current !== null) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
	}, [])

	useEffect(() => {
		if (!jobId) return

		startRef.current = Date.now()

		const poll = async () => {
			if (Date.now() - startRef.current > TIMEOUT_MS) {
				setState((s) => ({ ...s, status: "failed", error: "Grading timed out" }))
				stop()
				return
			}

			try {
				const res = await api.get(`grading-jobs/${jobId}`).json<ApiResponse<GradingJobData>>()

				const { status: jobStatus, progress, scores, feedback_ready, error } = res.data

				progressRef.current = progress
				setState((s) => ({
					...s,
					status: jobStatus === "failed" ? "failed" : "streaming",
					progress,
					scores: scores ?? s.scores,
					feedbackReady: feedback_ready ?? false,
					error: error ?? null,
				}))

				if (jobStatus === "ready") {
					setState((s) => ({ ...s, status: "completed" }))
					stop()
				}

				if (jobStatus === "failed") {
					stop()
				}
			} catch {
				setState((s) => ({ ...s, status: "failed", error: "Connection lost" }))
				stop()
			}
		}

		// First poll immediately
		poll()
		timerRef.current = setInterval(poll, POLL_MS)

		return stop
	}, [jobId, stop])

	return { ...state, stop }
}
