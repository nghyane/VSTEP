// sentence-utils — helper functions cho SentencePracticeView.

export function tokenize(sentence: string): string[] {
	return sentence.split(/\s+/)
}

export function normalize(word: string): string {
	return word
		.toLowerCase()
		.replace(/[.,;:!?"'()[\]{}-]/g, "")
		.trim()
}

export function findNextInputIndex(fromIndex: number, words: string[]): number {
	for (let i = fromIndex + 1; i < words.length; i++) {
		if (normalize(words[i] ?? "").length > 0) return i
	}
	return fromIndex + 1
}

export function findPrevInputIndex(fromIndex: number, _words: string[]): number {
	return Math.max(0, fromIndex - 1)
}

export function updateSlot(params: {
	id: string
	index: number
	value: string
	expectedWords: string[]
	inputRefs: React.RefObject<Map<string, HTMLInputElement[]>>
	setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}) {
	const { id, index, value, expectedWords, inputRefs, setAnswers } = params
	const clean = value.replace(/ /g, "")
	const maxLen = normalize(expectedWords[index] ?? "").length
	const fit = clean.slice(0, maxLen)
	const overflow = clean.slice(maxLen)

	setAnswers((prev) => {
		const arr = [...(prev[id] ?? [])]
		arr[index] = fit
		if (overflow.length > 0) {
			const nextIdx = findNextInputIndex(index, expectedWords)
			if (nextIdx > index)
				arr[nextIdx] = overflow.slice(0, normalize(expectedWords[nextIdx] ?? "").length)
		}
		return { ...prev, [id]: arr }
	})

	const refs = inputRefs.current.get(id)
	if (fit.length === maxLen) {
		const nextIdx = findNextInputIndex(index, expectedWords)
		refs?.[nextIdx]?.focus()
	}
}

export function handleSlotKeyDown(params: {
	index: number
	event: React.KeyboardEvent<HTMLInputElement>
	words: string[]
	inputRefs: React.RefObject<Map<string, HTMLInputElement[]>>
	sentenceId: string
	answers: Record<string, string[]>
}) {
	const { index, event, words, inputRefs, sentenceId, answers } = params
	const refs = inputRefs.current.get(sentenceId)
	if (!refs) return
	if (event.key === " ") {
		event.preventDefault()
		refs[findNextInputIndex(index, words)]?.focus()
	}
	if (event.key === "Backspace" && !(answers[sentenceId]?.[index] ?? ""))
		refs[findPrevInputIndex(index, words)]?.focus()
	if (event.key === "ArrowLeft") {
		const input = event.currentTarget
		if (input.selectionStart === 0) refs[findPrevInputIndex(index, words)]?.focus()
	}
	if (event.key === "ArrowRight") {
		const input = event.currentTarget
		if (input.selectionStart === input.value.length) refs[findNextInputIndex(index, words)]?.focus()
	}
}

export function setRef(
	inputRefs: React.RefObject<Map<string, HTMLInputElement[]>>,
	sentenceId: string,
	idx: number,
	el: HTMLInputElement | null,
) {
	if (!inputRefs.current.has(sentenceId)) inputRefs.current.set(sentenceId, [])
	const arr = inputRefs.current.get(sentenceId)!
	if (el) arr[idx] = el
	else delete arr[idx]
}

export function speakSentence(sentence: string, onStart?: () => void, onEnd?: () => void) {
	if (!window.speechSynthesis) return
	window.speechSynthesis.cancel()
	const utt = new SpeechSynthesisUtterance(sentence)
	utt.lang = "en-US"
	utt.rate = 0.85
	if (onStart) utt.onstart = onStart
	if (onEnd) {
		utt.onend = onEnd
		utt.onerror = onEnd
	}
	window.speechSynthesis.speak(utt)
}
