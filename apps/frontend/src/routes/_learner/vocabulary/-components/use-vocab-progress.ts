import { useSyncExternalStore } from "react"

interface TopicProgress {
	learned: string[]
	weak: string[]
}

type AllProgress = Record<string, TopicProgress>

const STORAGE_KEY = "vocab-progress"

function getSnapshot(): AllProgress {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		return raw ? (JSON.parse(raw) as AllProgress) : {}
	} catch {
		return {}
	}
}

function save(data: AllProgress) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
}

let cached = getSnapshot()

function subscribe(cb: () => void) {
	function handler(e: StorageEvent) {
		if (e.key === STORAGE_KEY || e.key === null) {
			cached = getSnapshot()
			cb()
		}
	}
	window.addEventListener("storage", handler)
	return () => window.removeEventListener("storage", handler)
}

function snap() {
	return cached
}

function useVocabProgress() {
	return useSyncExternalStore(subscribe, snap)
}

function markLearned(topicId: string, wordId: string) {
	const all = getSnapshot()
	const topic = all[topicId] ?? { learned: [], weak: [] }
	if (!topic.learned.includes(wordId)) {
		topic.learned = [...topic.learned, wordId]
	}
	save({ ...all, [topicId]: topic })
}

function markWeak(topicId: string, wordId: string) {
	const all = getSnapshot()
	const topic = all[topicId] ?? { learned: [], weak: [] }
	if (!topic.weak.includes(wordId)) {
		topic.weak = [...topic.weak, wordId]
	}
	save({ ...all, [topicId]: topic })
}

function removeWeak(topicId: string, wordId: string) {
	const all = getSnapshot()
	const topic = all[topicId]
	if (!topic) return
	topic.weak = topic.weak.filter((id) => id !== wordId)
	save({ ...all, [topicId]: topic })
}

export { markLearned, markWeak, removeWeak, useVocabProgress }
