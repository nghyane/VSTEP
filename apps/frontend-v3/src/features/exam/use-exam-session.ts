import { useMutation, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useCallback, useEffect, useReducer, useRef } from "react"
import { saveExamDraft, submitExamSession } from "#/features/exam/actions"
import type {
	ExamDraft,
	ExamDraftPayload,
	ExamSessionData,
	ExamVersionMcqItem,
	ExamVersionWritingTask,
	McqAnswerPayload,
	SkillKey,
	SubmitSessionPayload,
	SubmitSessionResult,
	WritingAnswerPayload,
} from "#/features/exam/types"
import { useToast } from "#/lib/toast"

// ─── State ────────────────────────────────────────────────────────────────────

type ExamPhase = "device-check" | "active" | "submitting" | "submitted"

interface ExamState {
	phase: ExamPhase
	skillIdx: number
	mcqAnswers: Map<string, number>
	writingAnswers: Map<string, string>
	speakingDone: Set<string>
	confirmSubmit: boolean
	confirmNextSkill: boolean
}

type ExamAction =
	| { type: "START_EXAM" }
	| { type: "ANSWER_MCQ"; itemId: string; selectedIndex: number }
	| { type: "ANSWER_WRITING"; taskId: string; text: string }
	| { type: "MARK_SPEAKING_DONE"; partId: string }
	| { type: "UNMARK_SPEAKING_DONE"; partId: string }
	| { type: "NEXT_SKILL" }
	| { type: "SHOW_CONFIRM_SUBMIT" }
	| { type: "HIDE_CONFIRM_SUBMIT" }
	| { type: "SHOW_CONFIRM_NEXT" }
	| { type: "HIDE_CONFIRM_NEXT" }
	| { type: "SUBMITTING" }
	| { type: "SUBMITTED" }

function examReducer(state: ExamState, action: ExamAction): ExamState {
	switch (action.type) {
		case "START_EXAM":
			return { ...state, phase: "active" }
		case "ANSWER_MCQ": {
			const next = new Map(state.mcqAnswers)
			next.set(action.itemId, action.selectedIndex)
			return { ...state, mcqAnswers: next }
		}
		case "ANSWER_WRITING": {
			const next = new Map(state.writingAnswers)
			next.set(action.taskId, action.text)
			return { ...state, writingAnswers: next }
		}
		case "MARK_SPEAKING_DONE": {
			const next = new Set(state.speakingDone)
			next.add(action.partId)
			return { ...state, speakingDone: next }
		}
		case "UNMARK_SPEAKING_DONE": {
			const next = new Set(state.speakingDone)
			next.delete(action.partId)
			return { ...state, speakingDone: next }
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

// ─── MCQ helpers ─────────────────────────────────────────────────────────────

function buildMcqPayload(
	items: ExamVersionMcqItem[],
	refType: string,
	answers: Map<string, number>,
): McqAnswerPayload[] {
	return items
		.filter((item) => answers.has(item.id))
		.map((item) => ({
			item_ref_type: refType,
			item_ref_id: item.id,
			selected_index: answers.get(item.id) as number,
		}))
}

// ─── Draft persistence (BE autosave) ─────────────────────────────────────────
// User có thể thoát giữa chừng (đóng tab, crash, refresh). BE lưu draft snapshot
// qua PUT /exam-sessions/{id}/draft (1 row/session). Reducer init đọc snapshot
// đầu (initialDraft prop), effect debounce gọi mutation khi state thay đổi.
// Speaking audio URL hiện tại không nằm trong reducer state → user vẫn phải ghi
// âm lại sau khi resume; các phần khác được khôi phục đầy đủ.

const DRAFT_DEBOUNCE_MS = 1500

function buildDraftPayload(state: ExamState): ExamDraftPayload {
	return {
		skill_idx: state.skillIdx,
		mcq_answers: Array.from(state.mcqAnswers, ([itemId, idx]) => ({
			item_ref_id: itemId,
			selected_index: idx,
		})),
		writing_answers: Array.from(state.writingAnswers, ([taskId, text]) => ({
			task_id: taskId,
			text,
		})),
		speaking_marks: Array.from(state.speakingDone, (partId) => ({ part_id: partId })),
	}
}

// ─── Main hook ────────────────────────────────────────────────────────────────

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface UseExamSessionOptions {
	session: ExamSessionData
	listeningItems: ExamVersionMcqItem[]
	readingItems: ExamVersionMcqItem[]
	writingTasks: ExamVersionWritingTask[]
	initialDraft: ExamDraft | null
	onSubmitted: (result: SubmitSessionResult) => void
}

export function useExamSession({
	session,
	listeningItems,
	readingItems,
	writingTasks,
	initialDraft,
	onSubmitted,
}: UseExamSessionOptions) {
	const activeSkills = SKILL_ORDER.filter((sk) => session.selected_skills.includes(sk))

	const [state, dispatch] = useReducer(examReducer, undefined, (): ExamState => {
		const expired = new Date(session.server_deadline_at).getTime() <= Date.now()
		const draft = !expired ? initialDraft : null
		return {
			// Có draft => user đã bắt đầu làm => bỏ qua device-check
			phase: draft ? "active" : "device-check",
			skillIdx: draft?.skill_idx ?? 0,
			mcqAnswers: new Map((draft?.mcq_answers ?? []).map((m) => [m.item_ref_id, m.selected_index] as const)),
			writingAnswers: new Map((draft?.writing_answers ?? []).map((w) => [w.task_id, w.text] as const)),
			speakingDone: new Set((draft?.speaking_marks ?? []).map((s) => s.part_id)),
			confirmSubmit: false,
			confirmNextSkill: false,
		}
	})

	const qc = useQueryClient()

	// Toast cho lỗi autosave: chỉ hiện 1 lần / 60s để tránh spam khi BE down hoặc 5xx liên tục.
	// 429 (rate-limited) → silent: lần save tiếp theo (sau debounce) sẽ tự retry.
	const lastDraftToastAt = useRef(0)
	const draftMutation = useMutation({
		mutationFn: (payload: ExamDraftPayload) => saveExamDraft(session.id, payload),
		onError: (error: unknown) => {
			if (error instanceof HTTPError && error.response.status === 429) return
			const now = Date.now()
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
		debounceRef.current = setTimeout(() => draftMutate(payload), DRAFT_DEBOUNCE_MS)
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [state, draftMutate])

	const submitMutation = useMutation({
		mutationFn: (payload: SubmitSessionPayload) => submitExamSession(session.id, payload),
		onSuccess: (result) => {
			dispatch({ type: "SUBMITTED" })
			qc.invalidateQueries({ queryKey: ["exam-sessions"] })
			qc.invalidateQueries({ queryKey: ["exams"] })
			qc.invalidateQueries({ queryKey: ["streak"] })
			qc.invalidateQueries({ queryKey: ["activity-heatmap"] })
			qc.invalidateQueries({ queryKey: ["overview"] })
			onSubmitted(result)
		},
	})

	const handleStartExam = useCallback(() => dispatch({ type: "START_EXAM" }), [])

	const handleAnswerMcq = useCallback((itemId: string, selectedIndex: number) => {
		dispatch({ type: "ANSWER_MCQ", itemId, selectedIndex })
	}, [])

	const handleAnswerWriting = useCallback((taskId: string, text: string) => {
		dispatch({ type: "ANSWER_WRITING", taskId, text })
	}, [])

	const handleMarkSpeakingDone = useCallback((partId: string) => {
		dispatch({ type: "MARK_SPEAKING_DONE", partId })
	}, [])

	const handleUnmarkSpeakingDone = useCallback((partId: string) => {
		dispatch({ type: "UNMARK_SPEAKING_DONE", partId })
	}, [])

	const handleConfirmNext = useCallback(() => dispatch({ type: "NEXT_SKILL" }), [])
	const handleShowConfirmNext = useCallback(() => dispatch({ type: "SHOW_CONFIRM_NEXT" }), [])
	const handleHideConfirmNext = useCallback(() => dispatch({ type: "HIDE_CONFIRM_NEXT" }), [])
	const handleShowConfirmSubmit = useCallback(() => dispatch({ type: "SHOW_CONFIRM_SUBMIT" }), [])
	const handleHideConfirmSubmit = useCallback(() => dispatch({ type: "HIDE_CONFIRM_SUBMIT" }), [])

	const handleSubmit = useCallback(() => {
		dispatch({ type: "SUBMITTING" })
		const mcq_answers: McqAnswerPayload[] = [
			...buildMcqPayload(listeningItems, "exam_listening_item", state.mcqAnswers),
			...buildMcqPayload(readingItems, "exam_reading_item", state.mcqAnswers),
		]
		const writing_answers: WritingAnswerPayload[] = activeSkills.includes("writing")
			? writingTasks
					.map((task) => {
						const text = (state.writingAnswers.get(task.id) ?? "").trim()
						if (text.length === 0) return null
						return {
							task_id: task.id,
							text,
							word_count: text.split(/\s+/).filter(Boolean).length,
						}
					})
					.filter((x): x is WritingAnswerPayload => x !== null)
			: []
		submitMutation.mutate({ mcq_answers, writing_answers })
	}, [
		activeSkills,
		listeningItems,
		readingItems,
		writingTasks,
		state.mcqAnswers,
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

	return {
		state,
		activeSkills,
		currentSkill,
		isLastSkill,
		nextSkill,
		totalMcq,
		answeredMcq,
		isSubmitting: submitMutation.isPending,
		handleStartExam,
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
