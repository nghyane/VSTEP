import { useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useReducer, useRef } from "react"
import { submitExamSession } from "#/features/exam/actions"
import type {
	ExamSessionData,
	ExamVersionMcqItem,
	McqAnswerPayload,
	SkillKey,
	SubmitSessionResult,
} from "#/features/exam/types"

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

// ─── Main hook ────────────────────────────────────────────────────────────────

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

interface UseExamSessionOptions {
	session: ExamSessionData
	listeningItems: ExamVersionMcqItem[]
	readingItems: ExamVersionMcqItem[]
	onSubmitted: (result: SubmitSessionResult) => void
}

export function useExamSession({
	session,
	listeningItems,
	readingItems,
	onSubmitted,
}: UseExamSessionOptions) {
	const activeSkills = SKILL_ORDER.filter((sk) => session.selected_skills.includes(sk))

	const [state, dispatch] = useReducer(examReducer, {
		phase: "device-check" as const,
		skillIdx: 0,
		mcqAnswers: new Map<string, number>(),
		writingAnswers: new Map<string, string>(),
		speakingDone: new Set<string>(),
		confirmSubmit: false,
		confirmNextSkill: false,
	} satisfies ExamState)

	const submitMutation = useMutation({
		mutationFn: (payload: McqAnswerPayload[]) => submitExamSession(session.id, { mcq_answers: payload }),
		onSuccess: (result) => {
			dispatch({ type: "SUBMITTED" })
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

	const handleConfirmNext = useCallback(() => dispatch({ type: "NEXT_SKILL" }), [])
	const handleShowConfirmNext = useCallback(() => dispatch({ type: "SHOW_CONFIRM_NEXT" }), [])
	const handleHideConfirmNext = useCallback(() => dispatch({ type: "HIDE_CONFIRM_NEXT" }), [])
	const handleShowConfirmSubmit = useCallback(() => dispatch({ type: "SHOW_CONFIRM_SUBMIT" }), [])
	const handleHideConfirmSubmit = useCallback(() => dispatch({ type: "HIDE_CONFIRM_SUBMIT" }), [])

	const handleSubmit = useCallback(() => {
		dispatch({ type: "SUBMITTING" })
		const payload = [
			...buildMcqPayload(listeningItems, "exam_listening_item", state.mcqAnswers),
			...buildMcqPayload(readingItems, "exam_reading_item", state.mcqAnswers),
		]
		submitMutation.mutate(payload)
	}, [listeningItems, readingItems, state.mcqAnswers, submitMutation])

	const currentSkill = activeSkills[state.skillIdx] ?? activeSkills[0]
	const isLastSkill = state.skillIdx >= activeSkills.length - 1
	const nextSkill = activeSkills[state.skillIdx + 1] ?? null
	const totalMcq = listeningItems.length + readingItems.length
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
		handleConfirmNext,
		handleShowConfirmNext,
		handleHideConfirmNext,
		handleShowConfirmSubmit,
		handleHideConfirmSubmit,
		handleSubmit,
	}
}
