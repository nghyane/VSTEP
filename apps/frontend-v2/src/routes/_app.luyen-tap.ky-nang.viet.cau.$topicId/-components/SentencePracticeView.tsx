import { useSuspenseQuery } from "@tanstack/react-query"
import { CircleCheck, CircleX, Lightbulb, RotateCcw } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SpeakerIcon } from "#/components/common/SpeakerIcon"
import { writingSentenceTopicQueryOptions } from "#/lib/queries/writing-sentences"
import type { WritingSentenceItem } from "#/mocks/writing-sentences"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

const DIFFICULTY_STYLE = {
	easy: "bg-success/10 text-success",
	medium: "bg-warning/10 text-warning",
	hard: "bg-destructive/10 text-destructive",
} as const

const DIFFICULTY_LABEL = {
	easy: "Dễ",
	medium: "Trung bình",
	hard: "Khó",
} as const

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
			if (isChecked && !allChecked) {
				setCurrent((prev) => prev + 1)
			}
		}
		window.addEventListener("keydown", onEnter)
		return () => window.removeEventListener("keydown", onEnter)
	}, [allChecked, handleCheck, hasInput, isChecked])

	const handleReset = () => {
		const resetAnswers: Record<string, string[]> = {}
		for (const s of topic.sentences) {
			resetAnswers[s.id] = Array.from<string>({ length: tokenize(s.sentence).length }).fill("")
		}
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
				total={total}
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

function ProgressDots(props: {
	total: number
	current: number
	sentences: readonly WritingSentenceItem[]
	checked: Record<string, boolean>
	onSelect: (i: number) => void
}) {
	const { sentences, current, checked, onSelect } = props
	return (
		<div className="flex gap-1.5">
			{sentences.map((s, i) => (
				<button
					key={s.id}
					type="button"
					onClick={() => onSelect(i)}
					className={cn(
						"h-1.5 flex-1 rounded-full transition-colors",
						checked[s.id] === true && "bg-success",
						checked[s.id] === false && "bg-destructive",
						!(s.id in checked) && i === current && "bg-primary",
						!(s.id in checked) && i !== current && "bg-muted",
					)}
				/>
			))}
		</div>
	)
}

function ResultBanner({ correctCount, total }: { correctCount: number; total: number }) {
	const pct = total > 0 ? (correctCount / total) * 100 : 0
	return (
		<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
			<h3 className="text-lg font-semibold">Kết quả</h3>
			<p className="mt-1 text-sm text-muted-foreground">
				Bạn trả lời đúng{" "}
				<span className="font-semibold text-success">
					{correctCount}/{total}
				</span>{" "}
				câu
			</p>
			<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-success transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}

function PracticeCard(props: {
	sentence: WritingSentenceItem
	words: string[]
	slots: string[]
	isChecked: boolean
	isCorrect: boolean
	isWrong: boolean
	hintRevealed: boolean
	setHint: () => void
	onSlotChange: (idx: number, value: string) => void
	onSlotKeyDown: (idx: number, event: React.KeyboardEvent<HTMLInputElement>) => void
	onCheck: () => void
	onSpeak: () => void
	isSpeaking: boolean
	setInputRef: (idx: number, el: HTMLInputElement | null) => void
	hasInput: boolean
}) {
	const {
		sentence,
		words,
		slots,
		isChecked,
		isCorrect,
		isWrong,
		hintRevealed,
		setHint,
		onSlotChange,
		onSlotKeyDown,
		onSpeak,
		isSpeaking,
		setInputRef,
	} = props
	return (
		<div className={cn("mx-auto max-w-3xl space-y-5 rounded-2xl bg-muted/50 p-5 shadow-sm")}>
			<div className="flex items-center justify-between">
				<span
					className={cn(
						"rounded-md px-2 py-0.5 text-xs font-medium",
						DIFFICULTY_STYLE[sentence.difficulty],
					)}
				>
					{DIFFICULTY_LABEL[sentence.difficulty]}
				</span>
				<span className="text-xs text-muted-foreground">{words.length} từ</span>
			</div>
			<div className="flex flex-col items-center gap-3">
				<button
					type="button"
					className="flex size-16 items-center justify-center text-primary transition-opacity hover:opacity-80"
					onClick={onSpeak}
					aria-label="Phát âm câu"
				>
					<SpeakerIcon active={isSpeaking} className="size-7" />
				</button>
				<p className="text-center text-sm text-muted-foreground">{sentence.translation}</p>
			</div>
			<div className="flex flex-wrap items-end justify-center gap-x-1.5 gap-y-3">
				{words.map((expected, idx) => {
					const value = slots[idx] ?? ""
					const isWordCorrect = isChecked && normalize(value) === normalize(expected)
					const isWordWrong = isChecked && !isWordCorrect
					return (
						<input
							key={`${sentence.id}-${idx}`}
							ref={(el) => setInputRef(idx, el)}
							type="text"
							value={value}
							maxLength={Math.max(expected.length, 2)}
							onChange={(e) => onSlotChange(idx, e.target.value)}
							onKeyDown={(e) => onSlotKeyDown(idx, e)}
							disabled={isChecked}
							style={{ width: `${Math.max(expected.length * 0.65 + 1.2, 2.5)}rem` }}
							className={cn(
								"border-b-2 bg-transparent pb-1 text-center text-sm font-medium outline-none transition-colors focus:border-primary",
								!isChecked && "border-muted-foreground/30",
								isWordCorrect && "border-success text-success",
								isWordWrong && "border-destructive text-destructive",
							)}
						/>
					)
				})}
			</div>
			{!isChecked && (
				<div className="flex justify-center">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="gap-1.5 text-xs"
						onClick={setHint}
					>
						<Lightbulb className="size-4" />
						Gợi ý
					</Button>
				</div>
			)}
			{hintRevealed && !isChecked && (
				<p className="text-center text-xs text-muted-foreground">
					Bắt đầu bằng: “<span className="font-semibold">{words.slice(0, 3).join(" ")}</span>...” ·{" "}
					{words.length} từ
				</p>
			)}
			{isCorrect && (
				<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-success">
					<CircleCheck className="size-4" />
					Chính xác!
				</p>
			)}
			{isWrong && (
				<div className="space-y-1 text-center">
					<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-destructive">
						<CircleX className="size-4" />
						Chưa đúng
					</p>
					<p className="text-sm">
						Đáp án: <span className="font-medium text-success">{sentence.sentence}</span>
					</p>
				</div>
			)}
			{isChecked && (
				<div className="space-y-3 border-t pt-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Giải thích ngữ pháp
						</p>
						<p className="mt-1 text-sm">{sentence.explanation}</p>
					</div>
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Ứng dụng trong Writing
						</p>
						<p className="mt-1 text-sm">{sentence.writingUsage}</p>
					</div>
				</div>
			)}
		</div>
	)
}

function FooterActions(props: {
	isFirst: boolean
	isChecked: boolean
	allChecked: boolean
	hasInput: boolean
	onPrevious: () => void
	onNext: () => void
	onCheck: () => void
	onReset: () => void
}) {
	const { isFirst, isChecked, allChecked, hasInput, onPrevious, onNext, onCheck, onReset } = props
	return (
		<div className="flex items-center justify-center gap-3">
			<Button variant="outline" size="sm" disabled={isFirst} onClick={onPrevious}>
				Trước
			</Button>
			{!isChecked ? (
				<Button disabled={!hasInput} onClick={onCheck}>
					Kiểm tra
				</Button>
			) : allChecked ? (
				<Button variant="outline" size="sm" onClick={onReset}>
					<RotateCcw className="size-4" />
					Làm lại
				</Button>
			) : (
				<Button variant="outline" size="sm" onClick={onNext}>
					Tiếp
				</Button>
			)}
		</div>
	)
}

function tokenize(sentence: string): string[] {
	return sentence.split(/\s+/)
}

function normalize(word: string): string {
	return word
		.toLowerCase()
		.replace(/[.,;:!?"'()[\]{}-]/g, "")
		.trim()
}

function updateSlot(params: {
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
			if (nextIdx > index) {
				arr[nextIdx] = overflow.slice(0, normalize(expectedWords[nextIdx] ?? "").length)
			}
		}
		return { ...prev, [id]: arr }
	})

	const refs = inputRefs.current.get(id)
	if (fit.length === maxLen) {
		const nextIdx = findNextInputIndex(index, expectedWords)
		refs?.[nextIdx]?.focus()
	}
}

function handleSlotKeyDown(params: {
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
	if (event.key === "Backspace" && !(answers[sentenceId]?.[index] ?? "")) {
		refs[findPrevInputIndex(index, words)]?.focus()
	}
	if (event.key === "ArrowLeft") {
		const input = event.currentTarget
		if (input.selectionStart === 0) refs[findPrevInputIndex(index, words)]?.focus()
	}
	if (event.key === "ArrowRight") {
		const input = event.currentTarget
		if (input.selectionStart === input.value.length) refs[findNextInputIndex(index, words)]?.focus()
	}
}

function findNextInputIndex(fromIndex: number, words: string[]): number {
	for (let i = fromIndex + 1; i < words.length; i++) {
		if (normalize(words[i] ?? "").length > 0) return i
	}
	return fromIndex + 1
}

function findPrevInputIndex(fromIndex: number, words: string[]): number {
	for (let i = fromIndex - 1; i >= 0; i--) {
		if (normalize(words[i] ?? "").length > 0) return i
	}
	return fromIndex - 1
}

function setRef(
	inputRefs: React.RefObject<Map<string, HTMLInputElement[]>>,
	id: string,
	index: number,
	el: HTMLInputElement | null,
) {
	if (!el) return
	const refs = inputRefs.current.get(id) ?? []
	refs[index] = el
	inputRefs.current.set(id, refs)
}

function speakSentence(sentence: string, onStart?: () => void, onEnd?: () => void) {
	if (typeof window === "undefined" || !window.speechSynthesis) return
	window.speechSynthesis.cancel()
	const utterance = new SpeechSynthesisUtterance(sentence)
	utterance.rate = 0.9
	utterance.onstart = () => onStart?.()
	utterance.onend = () => onEnd?.()
	utterance.onerror = () => onEnd?.()
	window.speechSynthesis.speak(utterance)
}
