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

/** Fetch-based SSE client — supports Authorization header with Bearer token. */
async function streamSSE(
	url: string,
	token: string,
	onEvent: (event: string, data: unknown) => void,
	onError: (error: string) => void,
	abortSignal: AbortSignal,
) {
	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
		signal: abortSignal,
	})

	if (!response.ok) {
		onError(`HTTP ${response.status}`)
		return
	}

	const reader = response.body?.getReader()
	if (!reader) {
		onError("No response body")
		return
	}

	const decoder = new TextDecoder()
	let buffer = ""

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split("\n")
			buffer = lines.pop() ?? ""

			let currentEvent = ""
			for (const line of lines) {
				if (line.startsWith("event: ")) {
					currentEvent = line.slice(7).trim()
				} else if (line.startsWith("data: ")) {
					try {
						const data = JSON.parse(line.slice(6))
						onEvent(currentEvent || "message", data)
					} catch {
						// ignore parse errors
					}
					currentEvent = ""
				}
			}
		}
	} catch (_e) {
		if (!abortSignal.aborted) {
			onError("Connection lost")
		}
	}
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

		function handleEvent(event: string, data: unknown) {
			switch (event) {
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
		}

		function handleError(error: string) {
			if (scoresRef.current) return
			setState((s) => ({ ...s, status: "failed", error }))
			close()
		}

		const url = `${API_URL}/grading-jobs/${jobId}/stream?feedback=${waitForFeedback ? "1" : "0"}`
		streamSSE(url, token, handleEvent, handleError, controller.signal)

		return close
	}, [jobId, close, waitForFeedback])

	return { ...state, close }
}
