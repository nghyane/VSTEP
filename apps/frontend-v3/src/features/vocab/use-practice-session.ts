import { useMutation } from "@tanstack/react-query"
import { useEffect, useReducer } from "react"
import { reviewWord } from "#/features/vocab/actions"
import type { PracticeMode, SrsRating, WordWithState } from "#/features/vocab/types"

export type Phase = "prompt" | "checking" | "reveal"

export interface PracticeItem {
	entry: WordWithState
	mode: Exclude<PracticeMode, "mixed">
	/** Pre-computed for fill_blank: sentence with the target word masked. */
	maskedSentence?: string
}

type Action =
	| { type: "init"; items: PracticeItem[] }
	| { type: "value"; value: string }
	| { type: "check"; correct: boolean }
	| { type: "reveal" }
	| { type: "advance"; requeue: PracticeItem | null }

interface State {
	queue: PracticeItem[]
	index: number
	reviewed: number
	phase: Phase
	value: string
	correct: boolean | null
}

const INITIAL: State = {
	queue: [],
	index: 0,
	reviewed: 0,
	phase: "prompt",
	value: "",
	correct: null,
}

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "init":
			return { ...INITIAL, queue: action.items }
		case "value":
			return { ...state, value: action.value }
		case "check":
			// Wrong answer auto-reveals so the user sees the correct word immediately.
			return { ...state, phase: action.correct ? "checking" : "reveal", correct: action.correct }
		case "reveal":
			return { ...state, phase: "reveal" }
		case "advance":
			return {
				...INITIAL,
				queue: action.requeue ? [...state.queue, action.requeue] : state.queue,
				index: state.index + 1,
				reviewed: state.reviewed + 1,
			}
	}
}

type Status = "empty" | "active" | "done"

export interface PracticeSession {
	status: Status
	current: PracticeItem | null
	index: number
	total: number
	reviewed: number
	phase: Phase
	value: string
	correct: boolean | null
	submitting: boolean
	setValue: (v: string) => void
	check: () => void
	reveal: () => void
	rate: (r: SrsRating) => void
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function maskSentence(sentence: string, word: string): string | null {
	const re = new RegExp(`\\b${escapeRegex(word)}\\w*\\b`, "i")
	if (!re.test(sentence)) return null
	return sentence.replace(re, "_____")
}

function normalize(s: string): string {
	return s.trim().toLowerCase()
}

const MODES_FOR_MIXED: Exclude<PracticeMode, "mixed">[] = [
	"flashcard",
	"reverse",
	"typing",
	"listen",
	"fill_blank",
]

export function buildPracticeItems(words: WordWithState[], mode: PracticeMode): PracticeItem[] {
	return words.flatMap((entry): PracticeItem[] => {
		const pick = mode === "mixed" ? randomMode(entry) : mode
		if (pick === "fill_blank") {
			const masked = entry.word.example ? maskSentence(entry.word.example, entry.word.word) : null
			// Skip if no example or word not found in example — fill_blank impossible
			if (!masked) return []
			return [{ entry, mode: "fill_blank", maskedSentence: masked }]
		}
		return [{ entry, mode: pick }]
	})
}

function randomMode(entry: WordWithState): Exclude<PracticeMode, "mixed"> {
	const pool = entry.word.example ? MODES_FOR_MIXED : MODES_FOR_MIXED.filter((m) => m !== "fill_blank")
	return pool[Math.floor(Math.random() * pool.length)]
}

export function checkAnswer(item: PracticeItem, value: string): boolean {
	return normalize(value) === normalize(item.entry.word.word)
}

export function usePracticeSession(items: PracticeItem[]): PracticeSession {
	const [state, dispatch] = useReducer(reducer, INITIAL)

	useEffect(() => {
		if (items.length > 0 && state.queue.length === 0) dispatch({ type: "init", items })
	}, [items, state.queue.length])

	const total = state.queue.length
	const current = state.queue[state.index] ?? null
	const status: Status = total === 0 ? "empty" : state.index >= total ? "done" : "active"

	const mutation = useMutation({
		mutationFn: ({ wordId, rating }: { wordId: string; rating: SrsRating }) => reviewWord(wordId, rating),
		onSuccess: (_data, { rating }) => {
			dispatch({ type: "advance", requeue: rating === 1 ? current : null })
		},
	})

	function check() {
		if (!current || state.phase !== "prompt") return
		dispatch({ type: "check", correct: checkAnswer(current, state.value) })
	}

	function reveal() {
		dispatch({ type: "reveal" })
	}

	function rate(rating: SrsRating) {
		if (!current || mutation.isPending) return
		mutation.mutate({ wordId: current.entry.word.id, rating })
	}

	return {
		status,
		current,
		index: state.index,
		total,
		reviewed: state.reviewed,
		phase: state.phase,
		value: state.value,
		correct: state.correct,
		submitting: mutation.isPending,
		setValue: (v) => dispatch({ type: "value", value: v }),
		check,
		reveal,
		rate,
	}
}
