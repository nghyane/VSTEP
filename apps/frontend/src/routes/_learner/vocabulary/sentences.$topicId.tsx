import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	BulbIcon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Loading03Icon,
	Refresh01Icon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { usePronounce } from "@/hooks/use-pronounce"
import { useSentenceTopic } from "@/hooks/use-sentences"
import { cn } from "@/lib/utils"
import type { SentenceItemData } from "@/types/api"

export const Route = createFileRoute("/_learner/vocabulary/sentences/$topicId")({
	component: SentencePracticePage,
})

const DIFFICULTY_LABELS: Record<SentenceItemData["difficulty"], string> = {
	easy: "Dễ",
	medium: "Trung bình",
	hard: "Khó",
}

const DIFFICULTY_COLORS: Record<SentenceItemData["difficulty"], string> = {
	easy: "bg-green-100 text-green-700",
	medium: "bg-amber-100 text-amber-700",
	hard: "bg-red-100 text-red-700",
}

function getWordSlots(sentence: string): string[] {
	return sentence.split(/\s+/)
}

const PUNCT_RE = /[.,;:!?'"''""—–\-()[\]{}]/g

function normalizeWord(w: string): string {
	return w.toLowerCase().replace(PUNCT_RE, "").trim()
}

function getTrailingPunct(w: string): string {
	const match = w.match(/[.,;:!?'"''""—–\-)[\]{}]+$/)
	return match ? match[0] : ""
}

function getLeadingPunct(w: string): string {
	const match = w.match(/^['"''""([[{]+/)
	return match ? match[0] : ""
}

function SentencePracticePage() {
	const { topicId } = Route.useParams()
	const { data: topic, isLoading, error } = useSentenceTopic(topicId)
	const { speak, supported: speechSupported } = usePronounce()

	const sentences = topic?.sentences ?? []
	const totalCount = sentences.length

	const [current, setCurrent] = useState(0)
	const [words, setWords] = useState<Record<string, string[]>>({})
	// Initialize word slots when sentences load
	useEffect(() => {
		if (sentences.length === 0) return
		setWords((prev) => {
			// Only init slots that don't already exist
			const next = { ...prev }
			for (const s of sentences) {
				if (!(s.id in next)) {
					const count = getWordSlots(s.sentence).length
					next[s.id] = Array.from<string>({ length: count }).fill("")
				}
			}
			return next
		})
	}, [sentences])

	const [checked, setChecked] = useState<Record<string, boolean>>({})
	const [hints, setHints] = useState<Set<string>>(new Set())
	const inputRefs = useRef<Map<string, HTMLInputElement[]>>(new Map())

	// Auto-speak when switching sentence or first load
	useEffect(() => {
		const s = sentences[current]
		if (s && speechSupported) speak(s.sentence)
	}, [current, sentences, speechSupported, speak])

	const sentence = sentences[current] as SentenceItemData | undefined
	const sentenceId = sentence?.id ?? ""
	const isChecked = sentenceId in checked
	const allChecked = Object.keys(checked).length === totalCount && totalCount > 0
	const isCorrect = checked[sentenceId] === true
	const isWrong = checked[sentenceId] === false
	const correctCount = Object.values(checked).filter(Boolean).length
	const hintRevealed = hints.has(sentenceId)
	const wordSlots = words[sentenceId] ?? []
	const hasInput = wordSlots.some((w) => w.trim())

	const setRef = useCallback((id: string, index: number, el: HTMLInputElement | null) => {
		if (!el) return
		const refs = inputRefs.current.get(id) ?? []
		if (!inputRefs.current.has(id)) {
			inputRefs.current.set(id, refs)
		}
		refs[index] = el
	}, [])

	const checkSentence = useCallback(
		(id: string) => {
			if (id in checked) return
			const s = sentences.find((x) => x.id === id)
			if (!s) return
			const expected = getWordSlots(s.sentence)
			const given = words[id] ?? []
			const correct =
				expected.length === given.length &&
				expected.every((w, i) => normalizeWord(given[i] ?? "") === normalizeWord(w))
			setChecked((prev) => ({ ...prev, [id]: correct }))
		},
		[checked, words, sentences],
	)

	useEffect(() => {
		if (!isChecked && sentenceId) {
			const refs = inputRefs.current.get(sentenceId)
			refs?.[0]?.focus()
		}
	}, [sentenceId, isChecked])

	useEffect(() => {
		function onEnter(e: KeyboardEvent) {
			if (e.key !== "Enter") return
			e.preventDefault()
			if (!isChecked && hasInput) {
				checkSentence(sentenceId)
			} else if (isChecked && !allChecked) {
				setCurrent((p) => p + 1)
			}
		}
		window.addEventListener("keydown", onEnter)
		return () => window.removeEventListener("keydown", onEnter)
	}, [isChecked, allChecked, hasInput, sentenceId, checkSentence])

	if (isLoading) {
		return (
			<div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 py-16">
				<HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin text-muted-foreground" />
				<p className="text-muted-foreground">Đang tải...</p>
			</div>
		)
	}

	if (error || !topic || !sentence) {
		return (
			<div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 py-16">
				<p className="text-muted-foreground">
					{error ? `Lỗi: ${error.message}` : "Không tìm thấy chủ đề."}
				</p>
				<Button variant="outline" asChild>
					<Link to="/vocabulary">Quay lại</Link>
				</Button>
			</div>
		)
	}

	const isFirst = current === 0
	const expectedWords = getWordSlots(sentence.sentence)

	function handleWordChange(id: string, index: number, value: string) {
		if (isChecked) return
		const clean = value.replace(/ /g, "")
		const pureExpected = normalizeWord(expectedWords[index] ?? "")
		const maxLen = pureExpected.length

		if (clean.length > maxLen) {
			const fit = clean.slice(0, maxLen)
			const overflow = clean.slice(maxLen)
			setWords((prev) => {
				const arr = [...(prev[id] ?? [])]
				arr[index] = fit
				return { ...prev, [id]: arr }
			})
			const refs = inputRefs.current.get(id)
			const nextIdx = findNextInputIndex(index)
			if (refs?.[nextIdx] !== undefined) {
				refs[nextIdx].focus()
				const nextExpected = normalizeWord(expectedWords[nextIdx] ?? "")
				if (overflow.length <= nextExpected.length) {
					setWords((prev) => {
						const arr = [...(prev[id] ?? [])]
						arr[nextIdx] = overflow
						return { ...prev, [id]: arr }
					})
				}
			}
			return
		}

		setWords((prev) => {
			const arr = [...(prev[id] ?? [])]
			arr[index] = clean
			return { ...prev, [id]: arr }
		})

		if (clean.length === maxLen) {
			const refs = inputRefs.current.get(id)
			const nextIdx = findNextInputIndex(index)
			if (refs?.[nextIdx] !== undefined) {
				refs[nextIdx].focus()
			}
		}
	}

	function findNextInputIndex(fromIndex: number): number {
		for (let i = fromIndex + 1; i < expectedWords.length; i++) {
			if (normalizeWord(expectedWords[i] ?? "").length > 0) return i
		}
		return fromIndex + 1
	}

	function findPrevInputIndex(fromIndex: number): number {
		for (let i = fromIndex - 1; i >= 0; i--) {
			if (normalizeWord(expectedWords[i] ?? "").length > 0) return i
		}
		return fromIndex - 1
	}

	function handleKeyDown(id: string, index: number, e: React.KeyboardEvent) {
		if (isChecked) return
		const refs = inputRefs.current.get(id)
		if (e.key === " ") {
			e.preventDefault()
			const nextIdx = findNextInputIndex(index)
			if (refs?.[nextIdx]) {
				refs[nextIdx].focus()
			}
		}
		if (e.key === "Backspace" && !words[id]?.[index]) {
			const prevIdx = findPrevInputIndex(index)
			if (refs?.[prevIdx]) {
				refs[prevIdx].focus()
			}
		}
		if (e.key === "ArrowLeft" && refs?.[index - 1]) {
			const input = e.currentTarget as HTMLInputElement
			if (input.selectionStart === 0) {
				refs[index - 1].focus()
			}
		}
		if (e.key === "ArrowRight" && refs?.[index + 1]) {
			const input = e.currentTarget as HTMLInputElement
			if (input.selectionStart === input.value.length) {
				refs[index + 1].focus()
			}
		}
	}

	function handleReset() {
		const init: Record<string, string[]> = {}
		for (const s of sentences) {
			const count = getWordSlots(s.sentence).length
			init[s.id] = Array.from<string>({ length: count }).fill("")
		}
		setWords(init)
		setHints(new Set())
		setChecked({})
		setCurrent(0)
	}

	function revealHint(id: string) {
		setHints((prev) => new Set(prev).add(id))
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Link
						to="/vocabulary"
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Luyện theo câu
					</Link>
					<h1 className="text-2xl font-bold">{topic.name}</h1>
					<p className="text-muted-foreground">Nghe và điền lại câu hoàn chỉnh vào ô bên dưới</p>
				</div>
				<span className="text-sm font-medium text-muted-foreground">
					{current + 1}/{totalCount}
				</span>
			</div>

			<div className="flex gap-1.5">
				{sentences.map((s, i) => (
					<button
						key={s.id}
						type="button"
						className={cn(
							"h-1.5 flex-1 rounded-full transition-colors",
							checked[s.id] === true && "bg-green-500",
							checked[s.id] === false && "bg-red-400",
							!(s.id in checked) && i === current && "bg-primary",
							!(s.id in checked) && i !== current && "bg-muted",
						)}
						onClick={() => setCurrent(i)}
					/>
				))}
			</div>

			{allChecked && (
				<div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 dark:border-green-800 dark:bg-green-950/20">
					<h3 className="text-lg font-bold">Kết quả</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Bạn trả lời đúng{" "}
						<span className="font-semibold text-green-600">
							{correctCount}/{totalCount}
						</span>{" "}
						câu
					</p>
					<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-green-500 transition-all"
							style={{
								width: `${totalCount > 0 ? (correctCount / totalCount) * 100 : 0}%`,
							}}
						/>
					</div>
				</div>
			)}

			<div
				className={cn(
					"mx-auto max-w-3xl space-y-5 rounded-2xl bg-muted/50 p-6",
					isCorrect &&
						"border border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10",
					isWrong && "border border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10",
				)}
			>
				<div className="flex items-center justify-between">
					<span
						className={cn(
							"rounded-md px-2 py-0.5 text-xs font-medium",
							DIFFICULTY_COLORS[sentence.difficulty],
						)}
					>
						{DIFFICULTY_LABELS[sentence.difficulty]}
					</span>
					<span className="text-xs text-muted-foreground">{expectedWords.length} từ</span>
				</div>

				<div className="flex flex-col items-center gap-3">
					<button
						type="button"
						className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
						aria-label="Phát âm"
						disabled={!speechSupported}
						onClick={() => speak(sentence.sentence)}
					>
						<HugeiconsIcon icon={VolumeHighIcon} className="size-7" />
					</button>
					<p className="text-center text-sm text-muted-foreground">{sentence.translation}</p>
				</div>

				<div className="flex flex-wrap items-end justify-center gap-x-1.5 gap-y-3">
					{expectedWords.map((expected, i) => {
						const pureWord = normalizeWord(expected)
						const leading = getLeadingPunct(expected)
						const trailing = getTrailingPunct(expected)
						const value = wordSlots[i] ?? ""
						const isWordCorrect = isChecked && normalizeWord(value) === pureWord
						const isWordWrong = isChecked && !isWordCorrect

						if (pureWord.length === 0) {
							return (
								<span key={`${sentence.id}-${i}`} className="pb-1 text-sm text-muted-foreground">
									{expected}
								</span>
							)
						}

						return (
							<span key={`${sentence.id}-${i}`} className="inline-flex items-end">
								{leading && <span className="pb-1 text-sm text-muted-foreground">{leading}</span>}
								<input
									ref={(el) => setRef(sentence.id, i, el)}
									type="text"
									value={value}
									maxLength={pureWord.length}
									onChange={(e) => handleWordChange(sentence.id, i, e.target.value)}
									onKeyDown={(e) => handleKeyDown(sentence.id, i, e)}
									disabled={isChecked}
									style={{ width: `${Math.max(pureWord.length * 0.65 + 1.2, 2.5)}rem` }}
									className={cn(
										"border-b-2 bg-transparent pb-1 text-center text-sm font-medium outline-none transition-colors focus:border-primary",
										!isChecked && "border-muted-foreground/30",
										isWordCorrect && "border-green-500 text-green-600",
										isWordWrong && "border-red-500 text-red-600",
									)}
								/>
								{trailing && <span className="pb-1 text-sm text-muted-foreground">{trailing}</span>}
							</span>
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
							onClick={() => revealHint(sentence.id)}
						>
							<HugeiconsIcon icon={BulbIcon} className="size-4" />
							Gợi ý
						</Button>
					</div>
				)}

				{hintRevealed && !isChecked && (
					<p className="text-center text-xs text-muted-foreground">
						Bắt đầu bằng: &ldquo;
						<span className="font-semibold">{expectedWords.slice(0, 3).join(" ")}</span>
						...&rdquo; · {expectedWords.length} từ
					</p>
				)}

				{isCorrect && (
					<div className="space-y-1 text-center">
						<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-green-600">
							<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
							Chính xác!
						</p>
						<p className="text-sm text-muted-foreground">{sentence.sentence}</p>
					</div>
				)}

				{isWrong && (
					<div className="space-y-1 text-center">
						<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-red-600">
							<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
							Chưa đúng
						</p>
						<p className="text-sm">
							Đáp án: <span className="font-medium text-green-600">{sentence.sentence}</span>
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

			<div className="flex items-center justify-center gap-3">
				<Button
					variant="outline"
					size="sm"
					disabled={isFirst}
					onClick={() => setCurrent((p) => p - 1)}
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					Trước
				</Button>

				{!isChecked ? (
					<Button disabled={!hasInput} onClick={() => checkSentence(sentence.id)}>
						Kiểm tra
					</Button>
				) : allChecked ? (
					<Button variant="outline" size="sm" onClick={handleReset}>
						<HugeiconsIcon icon={Refresh01Icon} className="size-4" />
						Làm lại
					</Button>
				) : (
					<Button variant="outline" size="sm" onClick={() => setCurrent((p) => p + 1)}>
						Tiếp
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				)}
			</div>
		</div>
	)
}
