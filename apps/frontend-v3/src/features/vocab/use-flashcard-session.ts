import { useMutation } from "@tanstack/react-query"
import { useEffect, useReducer } from "react"
import { reviewWord } from "#/features/vocab/actions"
import type { SrsRating, WordWithState } from "#/features/vocab/types"

const KEY_TO_RATING: Record<string, SrsRating> = { "1": 1, "2": 2, "3": 3, "4": 4 }

interface State {
	queue: WordWithState[]
	index: number
	reviewed: number
	revealed: boolean
}

type Action =
	| { type: "init"; items: WordWithState[] }
	| { type: "reveal" }
	| { type: "advance"; requeue: WordWithState | null }

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "init":
			return { queue: action.items, index: 0, reviewed: 0, revealed: false }
		case "reveal":
			return { ...state, revealed: true }
		case "advance":
			return {
				queue: action.requeue ? [...state.queue, action.requeue] : state.queue,
				index: state.index + 1,
				reviewed: state.reviewed + 1,
				revealed: false,
			}
	}
}

type Status = "empty" | "active" | "done"

interface FlashcardSession {
	status: Status
	current: WordWithState | null
	index: number
	total: number
	reviewed: number
	revealed: boolean
	submitting: boolean
	reveal: () => void
	rate: (rating: SrsRating) => void
}

export function useFlashcardSession(items: WordWithState[]): FlashcardSession {
	const [state, dispatch] = useReducer(reducer, { queue: [], index: 0, reviewed: 0, revealed: false })

	useEffect(() => {
		if (items.length > 0 && state.queue.length === 0) dispatch({ type: "init", items })
	}, [items, state.queue.length])

	const { queue, index, reviewed, revealed } = state
	const total = queue.length
	const current = queue[index] ?? null

	const status: Status = total === 0 ? "empty" : index >= total ? "done" : "active"

	const mutation = useMutation({
		mutationFn: ({ wordId, rating }: { wordId: string; rating: SrsRating }) => reviewWord(wordId, rating),
		onSuccess: (_data, { rating }) => {
			dispatch({ type: "advance", requeue: rating === 1 ? current : null })
		},
	})

	function reveal() {
		dispatch({ type: "reveal" })
	}

	function rate(rating: SrsRating) {
		if (!current || mutation.isPending) return
		mutation.mutate({ wordId: current.word.id, rating })
	}

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === " " && !revealed) {
				e.preventDefault()
				reveal()
				return
			}
			const r = KEY_TO_RATING[e.key]
			if (r && revealed && !mutation.isPending) rate(r)
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	})

	return { status, current, index, total, reviewed, revealed, submitting: mutation.isPending, reveal, rate }
}
