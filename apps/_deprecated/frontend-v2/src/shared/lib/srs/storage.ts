// localStorage wrapper cho SRS state — sẽ swap sang API thật khi backend sẵn sàng.

import type { CardState } from "./types"

const PREFIX = "vstep.srs.v1.state."
const NEW_STATE: CardState = { kind: "new" }

function key(wordId: string): string {
	return PREFIX + wordId
}

export function getCardState(wordId: string): CardState {
	if (typeof window === "undefined") return NEW_STATE
	const raw = window.localStorage.getItem(key(wordId))
	if (!raw) return NEW_STATE
	try {
		// JSON boundary: localStorage chỉ lưu string, cần cast khi parse.
		const parsed = JSON.parse(raw) as CardState
		return parsed
	} catch {
		return NEW_STATE
	}
}

export function upsertCardState(wordId: string, state: CardState): void {
	if (typeof window === "undefined") return
	if (state.kind === "new") {
		window.localStorage.removeItem(key(wordId))
		return
	}
	window.localStorage.setItem(key(wordId), JSON.stringify(state))
}

export function getAllStates(wordIds: readonly string[]): Map<string, CardState> {
	const map = new Map<string, CardState>()
	for (const id of wordIds) {
		map.set(id, getCardState(id))
	}
	return map
}

export function resetTopicProgress(wordIds: readonly string[]): void {
	if (typeof window === "undefined") return
	for (const id of wordIds) {
		window.localStorage.removeItem(key(id))
	}
}
