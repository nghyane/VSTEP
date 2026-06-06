import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { saveExamDraft, submitExamSession } from "#/features/exam/actions"
import { examRoomQuery } from "#/features/exam/queries"
import { buildMcqPayload, buildSpeakingPayload, buildWritingPayload } from "#/features/exam/submit-payload"
import type {
	ExamDraft,
	ExamDraftPayload,
	ExamRoomData,
	ExamSessionData,
	ExamSessionStatus,
	ExamVersionMcqItem,
	ExamVersionWritingTask,
	SkillKey,
	SubmitSessionPayload,
	SubmitSessionResult,
} from "#/features/exam/types"
import type { ApiResponse } from "#/lib/api"
import { useToast } from "#/lib/toast"

// ─── State ────────────────────────────────────────────────────────────────────

type ExamPhase = "active" | "expired" | "submitting" | "submitted" | "auto-submit-failed"

interface SpeakingRecording {
	audioKey: string
	audioUrl: string
	durationSeconds: number
}

interface ExamState {
	phase: ExamPhase
	skillIdx: number
	mcqAnswers: Map<string, number>
	writingAnswers: Map<string, string>
	speakingAnswers: Map<string, SpeakingRecording>
	confirmSubmit: boolean
	confirmNextSkill: boolean
}

type ExamAction =
	| { type: "ANSWER_MCQ"; itemId: string; selectedIndex: number }
	| { type: "ANSWER_WRITING"; taskId: string; text: string }
	| {
			type: "MARK_SPEAKING_DONE"
			partId: string
			audioKey: string
			audioUrl: string
			durationSeconds: number
	  }
	| { type: "UNMARK_SPEAKING_DONE"; partId: string }
	| { type: "NEXT_SKILL" }
	| { type: "SHOW_CONFIRM_SUBMIT" }
	| { type: "HIDE_CONFIRM_SUBMIT" }
	| { type: "SHOW_CONFIRM_NEXT" }
	| { type: "HIDE_CONFIRM_NEXT" }
	| { type: "SUBMITTING" }
	| { type: "SUBMITTED" }
	| { type: "SUBMISSION_FAILED" }
	| { type: "AUTO_SUBMISSION_FAILED" }
	| { type: "TIME_EXPIRED" }

function examReducer(state: ExamState, action: ExamAction): ExamState {
	switch (action.type) {
		case "ANSWER_MCQ": {
			if (state.phase !== "active") return state
			const next = new Map(state.mcqAnswers)
			next.set(action.itemId, action.selectedIndex)
			return { ...state, mcqAnswers: next }
		}
		case "ANSWER_WRITING": {
			if (state.phase !== "active") return state
			const next = new Map(state.writingAnswers)
			next.set(action.taskId, action.text)
			return { ...state, writingAnswers: next }
		}
		case "MARK_SPEAKING_DONE": {
			if (state.phase !== "active") return state
			const next = new Map(state.speakingAnswers)
			next.set(action.partId, {
				audioKey: action.audioKey,
				audioUrl: action.audioUrl,
				durationSeconds: action.durationSeconds,
			})
			return { ...state, speakingAnswers: next }
		}
		case "UNMARK_SPEAKING_DONE": {
			if (state.phase !== "active") return state
			const next = new Map(state.speakingAnswers)
			next.delete(action.partId)
			return { ...state, speakingAnswers: next }
		}
		case "NEXT_SKILL":
			return { ...state, skillIdx: state.skillIdx + 1, confirmNextSkill: false }
		case "SHOW_CONFIRM_SUBMIT":
			return { ...state, confirmSubmit: true }
		case "HIDE_CONFIRM_SUBMIT":
			return { ...state, confirmSubmit: false }
		case "SHOW_CONFIRM_NEXT":
			return { ...state, confirmNextSkill: true }
		case "HIDE_CONFIRM_NEXT":
			return { ...state, confirmNextSkill: false }
		case "SUBMITTING":
			return { ...state, phase: "submitting", confirmSubmit: false }
		case "SUBMITTED":
			return { ...state, phase: "submitted" }
		case "SUBMISSION_FAILED":
			return { ...state, phase: "active" }
		case "AUTO_SUBMISSION_FAILED":
			return { ...state, phase: "auto-submit-failed" }
		case "TIME_EXPIRED":
			if (state.phase !== "active") return state
			return { ...state, phase: "expired" }
		default:
			return state
	}
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

function calcRemaining(deadlineMs: number): number {
	return Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000))
}

export function useExamTimer(serverDeadlineAt: string): number {
	const deadlineMs = useRef(new Date(serverDeadlineAt).getTime())

	const [remaining, setRemaining] = useReducer(
		(_: number, next: number) => next,
		calcRemaining(deadlineMs.current),
	)

	useEffect(() => {
		const dl = deadlineMs.current
		const id = setInterval(() => setRemaining(calcRemaining(dl)), 1000)
		return () => clearInterval(id)
	}, [])

	return remaining
}

// ─── Draft persistence (BE autosave) ─────────────────────────────────────────
// User có thể thoát giữa chừng (đóng tab, crash, refresh). BE lưu draft snapshot
// qua PUT /exam-sessions/{id}/draft (1 row/session). Reducer init đọc snapshot
// đầu (initialDraft prop), effect debounce gọi mutation khi state thay đổi.
// Speaking stores audio_key for submit/STT and audio_url for public playback preview.

const DRAFT_DEBOUNCE_MS = 1500

function normalizeWritingText(value: unknown): string {
	return typeof value === "string" ? value : ""
}

function buildDraftPayload(state: ExamState): ExamDraftPayload {
	return {
		skill_idx: state.skillIdx,
		mcq_answers: Array.from(state.mcqAnswers, ([itemId, idx]) => ({
			item_ref_id: itemId,
			selected_index: idx,
		})),
		writing_answers: Array.from(state.writingAnswers, ([taskId, text]) => ({
			task_id: taskId,
			text: normalizeWritingText(text),
		})),
		speaking_marks: Array.from(state.speakingAnswers, ([partId, answer]) => ({
			part_id: partId,
			audio_key: answer.audioKey,
			audio_url: answer.audioUrl,
			duration_seconds: answer.durationSeconds,
		})),
	}
}

function formatSavedTime(value: string): string {
	return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function buildInitialSpeakingAnswers(
	marks: Array<{
		part_id: string
		audio_key?: string | null
		audio_url?: string | null
		duration_seconds?: number | null
	}>,
): Map<string, SpeakingRecording> {
	const entries: Array<[string, SpeakingRecording]> = []
	for (const mark of marks) {
		if (!mark.audio_key || !mark.audio_url || !mark.duration_seconds) continue
		entries.push([
			mark.part_id,
			{
				audioKey: mark.audio_key,
				audioUrl: mark.audio_url,
				durationSeconds: mark.duration_seconds,
			},
		])
	}
	return new Map(entries)
}

// ─── Main hook ────────────────────────────────────────────────────────────────

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]
const RESULT_STATUSES: ExamSessionStatus[] = ["submitted", "auto_submitted", "grading", "graded"]

function isResultStatus(status: ExamSessionStatus): boolean {
	return RESULT_STATUSES.includes(status)
}

interface UseExamSessionOptions {
	session: ExamSessionData
	listeningItems: ExamVersionMcqItem[]
	readingItems: ExamVersionMcqItem[]
	writingTasks: ExamVersionWritingTask[]
	initialDraft: ExamDraft | null
	remainingSeconds: number
	onSubmitted?: () => void
}

export function useExamSession({
	session,
	listeningItems,
	readingItems,
	writingTasks,
	initialDraft,
	remainingSeconds,
	onSubmitted = () => {},
}: UseExamSessionOptions) {
	const activeSkills = SKILL_ORDER.filter((sk) => session.selected_skills.includes(sk))

	const [state, dispatch] = useReducer(examReducer, undefined, (): ExamState => {
		const expired = new Date(session.server_deadline_at).getTime() <= Date.now()
		const phase: ExamPhase = expired ? "expired" : "active"
		return {
			phase,
			skillIdx: initialDraft?.skill_idx ?? 0,
			mcqAnswers: new Map(
				(initialDraft?.mcq_answers ?? []).map((m) => [m.item_ref_id, m.selected_index] as const),
			),
			writingAnswers: new Map(
				(initialDraft?.writing_answers ?? []).map((w) => [w.task_id, normalizeWritingText(w.text)] as const),
			),
			speakingAnswers: buildInitialSpeakingAnswers(initialDraft?.speaking_marks ?? []),
			confirmSubmit: false,
			confirmNextSkill: false,
		}
	})

	const qc = useQueryClient()
	const [draftSavedAt, setDraftSavedAt] = useState(initialDraft?.saved_at ?? null)
	const [draftFailed, setDraftFailed] = useState(false)
	const canAnswer = state.phase === "active" && remainingSeconds > 0
	const canAnswerRef = useRef(canAnswer)
	canAnswerRef.current = canAnswer

	function finishSubmitted(result?: SubmitSessionResult) {
		dispatch({ type: "SUBMITTED" })
		if (result) {
			qc.setQueryData<ApiResponse<ExamRoomData>>(["exam-sessions", session.id, "room"], (current) => {
				if (!current) return current
				return {
					...current,
					data: {
						...current.data,
						draft: null,
						session: {
							...current.data.session,
							status: "submitted",
							submitted_at: result.submitted_at,
						},
						actions: {
							...current.data.actions,
							can_answer: false,
							can_submit: false,
							can_view_result: true,
						},
					},
				}
			})
		}
		qc.invalidateQueries({ queryKey: ["exam-sessions"], refetchType: "all" })
		qc.invalidateQueries({ queryKey: ["exams"], refetchType: "all" })
		qc.invalidateQueries({ queryKey: ["streak"] })
		qc.invalidateQueries({ queryKey: ["activity-heatmap"] })
		qc.invalidateQueries({ queryKey: ["overview"] })
		// Bài full-test đếm vào commitment của các khóa đã ghi danh; cả course list
		// và detail (["courses"] + ["courses", id]) đều lấy commitment status → must
		// invalidate prefix shortest để cả 2 refetch ngay, không phải F5. Booking
		// page query (["booking", courseId]) cũng cần update commitment.completed.
		qc.invalidateQueries({ queryKey: ["courses"] })
		qc.invalidateQueries({ queryKey: ["booking"] })
		onSubmitted()
	}

	// Toast cho lỗi autosave: chỉ hiện 1 lần / 60s để tránh spam khi BE down hoặc 5xx liên tục.
	// 429 (rate-limited) → silent: lần save tiếp theo (sau debounce) sẽ tự retry.
	const lastDraftToastAt = useRef(0)
	const draftMutation = useMutation({
		mutationFn: (payload: ExamDraftPayload) => saveExamDraft(session.id, payload),
		onSuccess: (result) => {
			if (!canAnswerRef.current) return
			setDraftSavedAt(result.saved_at)
			setDraftFailed(false)
			// Sync room draft cache because room payload has staleTime=Infinity and will not refetch when user
			// quay lại phòng thi cùng tab (SPA nav). Phải tự ghi lại để lần mount sau
			// đọc đúng state mới — không thì sẽ load lại snapshot lần đầu, mất các thay
			// đổi sau (lý do "draft chỉ lưu lần đầu").
			qc.setQueryData<ApiResponse<ExamRoomData>>(["exam-sessions", session.id, "room"], (current) => {
				if (!current) return current
				return { ...current, data: { ...current.data, draft: result } }
			})
		},
		onError: (error: unknown) => {
			if (error instanceof HTTPError && error.response.status === 429) return
			// Đã hết giờ → autosave reject là bình thường, không hiện toast
			if (!canAnswerRef.current) return
			const now = Date.now()
			setDraftFailed(true)
			if (now - lastDraftToastAt.current < 60_000) return
			lastDraftToastAt.current = now
			useToast.getState().add("Không lưu được tự động — kiểm tra kết nối mạng.")
		},
	})

	// Debounced autosave: gom các thay đổi state trong DRAFT_DEBOUNCE_MS rồi PUT 1 lần.
	const draftMutate = draftMutation.mutate
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(() => {
		if (state.phase !== "active") return
		const payload = buildDraftPayload(state)
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(() => {
			if (!canAnswerRef.current) return
			draftMutate(payload)
		}, DRAFT_DEBOUNCE_MS)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [state, draftMutate])

	// Khi timer hết giờ → chuyển sang phase expired (dừng autosave, trigger auto-submit)
	useEffect(() => {
		if (remainingSeconds <= 0 && state.phase === "active") {
			dispatch({ type: "TIME_EXPIRED" })
		}
	}, [remainingSeconds, state.phase])

	const submitMutation = useMutation({
		mutationFn: (payload: SubmitSessionPayload) => submitExamSession(session.id, payload),
		onSuccess: (result) => {
			finishSubmitted(result)
		},
		onError: async () => {
			if (autoSubmitFired.current) {
				try {
					const room = await qc.fetchQuery({ ...examRoomQuery(session.id), staleTime: 0 })
					if (isResultStatus(room.data.session.status)) {
						finishSubmitted()
						return
					}
				} catch (error: unknown) {
					if (!(error instanceof HTTPError) && !(error instanceof TypeError)) {
						throw error
					}
				}

				dispatch({ type: "AUTO_SUBMISSION_FAILED" })
				useToast.getState().add("Không nộp bài tự động được. Vui lòng tải lại phòng thi.")
				return
			}

			dispatch({ type: "SUBMISSION_FAILED" })
		},
	})

	// Auto-submit khi hết giờ (phase = expired). BE cho phép 30s grace.
	const autoSubmitFired = useRef(false)
	useEffect(() => {
		if (state.phase !== "expired" || autoSubmitFired.current) return
		autoSubmitFired.current = true
		dispatch({ type: "SUBMITTING" })
		const mcq_answers = [
			...buildMcqPayload(listeningItems, "exam_listening_item", state.mcqAnswers),
			...buildMcqPayload(readingItems, "exam_reading_item", state.mcqAnswers),
		]
		const writing_answers = activeSkills.includes("writing")
			? buildWritingPayload(writingTasks, state.writingAnswers)
			: []
		const speaking_answers = activeSkills.includes("speaking")
			? buildSpeakingPayload(state.speakingAnswers)
			: []
		submitMutation.mutate({ mcq_answers, writing_answers, speaking_answers })
	}, [
		activeSkills,
		listeningItems,
		readingItems,
		state.mcqAnswers,
		state.phase,
		state.speakingAnswers,
		state.writingAnswers,
		submitMutation,
		writingTasks,
	])

	const handleAnswerMcq = useCallback((itemId: string, selectedIndex: number) => {
		if (!canAnswerRef.current) return
		dispatch({ type: "ANSWER_MCQ", itemId, selectedIndex })
	}, [])

	const handleAnswerWriting = useCallback((taskId: string, text: string) => {
		if (!canAnswerRef.current) return
		dispatch({ type: "ANSWER_WRITING", taskId, text })
	}, [])

	const handleMarkSpeakingDone = useCallback(
		(partId: string, audioKey: string, audioUrl: string, durationSeconds: number) => {
			if (!canAnswerRef.current) return
			dispatch({ type: "MARK_SPEAKING_DONE", partId, audioKey, audioUrl, durationSeconds })
		},
		[],
	)

	const handleUnmarkSpeakingDone = useCallback((partId: string) => {
		if (!canAnswerRef.current) return
		dispatch({ type: "UNMARK_SPEAKING_DONE", partId })
	}, [])

	const handleConfirmNext = useCallback(() => dispatch({ type: "NEXT_SKILL" }), [])
	const handleShowConfirmNext = useCallback(() => dispatch({ type: "SHOW_CONFIRM_NEXT" }), [])
	const handleHideConfirmNext = useCallback(() => dispatch({ type: "HIDE_CONFIRM_NEXT" }), [])
	const handleShowConfirmSubmit = useCallback(() => dispatch({ type: "SHOW_CONFIRM_SUBMIT" }), [])
	const handleHideConfirmSubmit = useCallback(() => dispatch({ type: "HIDE_CONFIRM_SUBMIT" }), [])

	const handleSubmit = useCallback(() => {
		dispatch({ type: "SUBMITTING" })
		const mcq_answers = [
			...buildMcqPayload(listeningItems, "exam_listening_item", state.mcqAnswers),
			...buildMcqPayload(readingItems, "exam_reading_item", state.mcqAnswers),
		]
		const writing_answers = activeSkills.includes("writing")
			? buildWritingPayload(writingTasks, state.writingAnswers)
			: []
		const speaking_answers = activeSkills.includes("speaking")
			? buildSpeakingPayload(state.speakingAnswers)
			: []
		submitMutation.mutate({ mcq_answers, writing_answers, speaking_answers })
	}, [
		activeSkills,
		listeningItems,
		readingItems,
		writingTasks,
		state.mcqAnswers,
		state.speakingAnswers,
		state.writingAnswers,
		submitMutation,
	])

	const currentSkill = activeSkills[state.skillIdx] ?? activeSkills[0]
	const isLastSkill = state.skillIdx >= activeSkills.length - 1
	const nextSkill = activeSkills[state.skillIdx + 1] ?? null
	const totalMcq =
		(activeSkills.includes("listening") ? listeningItems.length : 0) +
		(activeSkills.includes("reading") ? readingItems.length : 0)
	const answeredMcq = state.mcqAnswers.size
	const autosaveLabel = draftMutation.isPending
		? "Đang lưu..."
		: draftFailed
			? "Không lưu được"
			: draftSavedAt
				? `Đã lưu ${formatSavedTime(draftSavedAt)}`
				: "Tự động lưu"

	return {
		state,
		activeSkills,
		currentSkill,
		isLastSkill,
		nextSkill,
		totalMcq,
		answeredMcq,
		isSubmitted: state.phase === "submitted",
		isSubmitting: submitMutation.isPending,
		isTimeExpired:
			remainingSeconds <= 0 ||
			state.phase === "expired" ||
			(state.phase === "submitting" && autoSubmitFired.current),
		isAutoSubmitFailed: state.phase === "auto-submit-failed",
		autosaveLabel,
		handleAnswerMcq,
		handleAnswerWriting,
		handleMarkSpeakingDone,
		handleUnmarkSpeakingDone,
		handleConfirmNext,
		handleShowConfirmNext,
		handleHideConfirmNext,
		handleShowConfirmSubmit,
		handleHideConfirmSubmit,
		handleSubmit,
	}
}
