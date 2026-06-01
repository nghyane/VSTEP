// SentencePracticeView — session controller: state + navigation.

import { useSuspenseQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { writingSentenceTopicQueryOptions } from "#/features/practice/lib/queries-writing-sentences"
import type { WritingSentenceItem } from "#/mocks/writing-sentences"
import { FooterActions, PracticeCard, ProgressDots, ResultBanner } from "./SentenceCards"
import {
	handleSlotKeyDown,
	normalize,
	setRef,
	speakSentence,
	tokenize,
	updateSlot,
} from "./sentence-utils"

const EMPTY_SENTENCE: WritingSentenceItem = {
	id: "",
	sentence: "",
	translation: "",
	explanation: "",
	writingUsage: "",
	difficulty: "easy",
}

export function SentencePracticeView({ topicId }: { topicId: string }) {
	const { data: topic } = useSuspenseQuery(writingSentenceTopicQueryOptions(topicId))
	const total = topic.sentences.length
	const [current, setCurrent] = useState(0)
	const [answers, setAnswers] = useState<Record<string, string[]>>({})
	const [checked, setChecked] = useState<Record<string, boolean>>({})
	const [hints, setHints] = useState<Record<string, boolean>>({})
	const [isSpeaking, setIsSpeaking] = useState(false)
	const inputRefs = useRef<Map<string, HTMLInputElement[]>>(new Map())

	const sentence = topic.sentences[current] ?? topic.sentences[0] ?? EMPTY_SENTENCE
	const words = useMemo(() => tokenize(sentence.sentence), [sentence.sentence])
	const slots = answers[sentence.id] ?? Array.from<string>({ length: words.length }).fill("")
	const allChecked = Object.keys(checked).length === total && total > 0
	const correctCount = Object.values(checked).filter(Boolean).length
	const isChecked = sentence.id in checked
	const isCorrect = checked[sentence.id] === true
	const isWrong = checked[sentence.id] === false
	const hasInput = slots.some((w) => w.trim())

	useEffect(() => {
		setAnswers((prev) => {
			const next = { ...prev }
			for (const s of topic.sentences) {
				if (!(s.id in next))
					next[s.id] = Array.from<string>({ length: tokenize(s.sentence).length }).fill("")
			}
			return next
		})
	}, [topic.sentences])

	useEffect(() => {
		if (!isChecked) inputRefs.current.get(sentence.id)?.[0]?.focus()
	}, [sentence.id, isChecked])

	useEffect(() => {
		speakSentence(
			sentence.sentence,
			() => setIsSpeaking(true),
			() => setIsSpeaking(false),
		)
	}, [sentence.sentence])

	const handleCheck = useCallback(() => {
		if (isChecked) return
		const expected = tokenize(sentence.sentence)
		const isOk = expected.every((word, idx) => normalize(slots[idx] ?? "") === normalize(word))
		setChecked((prev) => ({ ...prev, [sentence.id]: isOk }))
	}, [isChecked, sentence.id, sentence.sentence, slots])

	useEffect(() => {
		function onEnter(e: KeyboardEvent) {
			if (e.key !== "Enter") return
			e.preventDefault()
			if (!isChecked && hasInput) {
				handleCheck()
				return
			}
			if (isChecked && !allChecked) setCurrent((prev) => prev + 1)
		}
		window.addEventListener("keydown", onEnter)
		return () => window.removeEventListener("keydown", onEnter)
	}, [allChecked, handleCheck, hasInput, isChecked])

	const handleReset = () => {
		const resetAnswers: Record<string, string[]> = {}
		for (const s of topic.sentences)
			resetAnswers[s.id] = Array.from<string>({ length: tokenize(s.sentence).length }).fill("")
		setAnswers(resetAnswers)
		setChecked({})
		setHints({})
		setCurrent(0)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">{topic.name}</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Nghe và điền lại câu hoàn chỉnh vào ô bên dưới
				</p>
			</div>

			<ProgressDots
				current={current}
				sentences={topic.sentences}
				checked={checked}
				onSelect={setCurrent}
			/>
			{allChecked && <ResultBanner correctCount={correctCount} total={total} />}

			<PracticeCard
				sentence={sentence}
				words={words}
				slots={slots}
				isChecked={isChecked}
				isCorrect={isCorrect}
				isWrong={isWrong}
				hintRevealed={!!hints[sentence.id]}
				setHint={() => setHints((prev) => ({ ...prev, [sentence.id]: true }))}
				onSlotChange={(idx, value) =>
					updateSlot({
						id: sentence.id,
						index: idx,
						value,
						expectedWords: words,
						inputRefs,
						setAnswers,
					})
				}
				onSlotKeyDown={(idx, e) =>
					handleSlotKeyDown({
						index: idx,
						event: e,
						words,
						inputRefs,
						sentenceId: sentence.id,
						answers,
					})
				}
				onCheck={handleCheck}
				onSpeak={() =>
					speakSentence(
						sentence.sentence,
						() => setIsSpeaking(true),
						() => setIsSpeaking(false),
					)
				}
				isSpeaking={isSpeaking}
				setInputRef={(idx, el) => setRef(inputRefs, sentence.id, idx, el)}
				hasInput={hasInput}
			/>

			<FooterActions
				isFirst={current === 0}
				isChecked={isChecked}
				allChecked={allChecked}
				hasInput={hasInput}
				onPrevious={() => setCurrent((p) => p - 1)}
				onNext={() => setCurrent((p) => p + 1)}
				onCheck={handleCheck}
				onReset={handleReset}
			/>
		</div>
	)
}
