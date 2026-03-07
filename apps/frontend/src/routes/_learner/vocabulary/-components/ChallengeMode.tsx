import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	BulbIcon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VocabWord } from "./mock-data"

interface ChallengeModeProps {
	words: VocabWord[]
}

function blankWord(sentence: string, word: string): string {
	const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
	return sentence.replace(regex, "___")
}

export function ChallengeMode({ words }: ChallengeModeProps) {
	const [current, setCurrent] = useState(0)
	const [letters, setLetters] = useState<Record<string, string[]>>(() => {
		const init: Record<string, string[]> = {}
		for (const w of words) {
			init[w.id] = Array.from<string>({ length: w.word.length }).fill("")
		}
		return init
	})
	const [hints, setHints] = useState<Set<string>>(new Set())
	const [results, setResults] = useState<Record<string, boolean> | null>(null)
	const inputRefs = useRef<Map<string, HTMLInputElement[]>>(new Map())

	const word = words[current]
	const totalCount = words.length
	const isLast = current === totalCount - 1
	const isFirst = current === 0
	const submitted = results !== null

	const setRef = useCallback((wordId: string, index: number, el: HTMLInputElement | null) => {
		if (!el) return
		const refs = inputRefs.current.get(wordId) ?? []
		if (!inputRefs.current.has(wordId)) {
			inputRefs.current.set(wordId, refs)
		}
		refs[index] = el
	}, [])

	function handleLetterChange(wordId: string, index: number, value: string) {
		if (submitted) return
		const char = value.slice(-1)
		setLetters((prev) => {
			const arr = [...(prev[wordId] ?? [])]
			arr[index] = char
			return { ...prev, [wordId]: arr }
		})
		if (char) {
			const refs = inputRefs.current.get(wordId)
			if (refs?.[index + 1]) {
				refs[index + 1].focus()
			}
		}
	}

	function handleKeyDown(wordId: string, index: number, e: React.KeyboardEvent) {
		if (submitted) return
		const refs = inputRefs.current.get(wordId)
		if (e.key === "Backspace" && !letters[wordId]?.[index]) {
			if (refs?.[index - 1]) {
				refs[index - 1].focus()
			}
		}
		if (e.key === "ArrowLeft" && refs?.[index - 1]) {
			refs[index - 1].focus()
		}
		if (e.key === "ArrowRight" && refs?.[index + 1]) {
			refs[index + 1].focus()
		}
	}

	function revealHint(wordId: string) {
		setHints((prev) => {
			const next = new Set(prev)
			next.add(wordId)
			return next
		})
	}

	function handleSubmit() {
		const res: Record<string, boolean> = {}
		for (const w of words) {
			const answer = (letters[w.id] ?? []).join("").toLowerCase()
			res[w.id] = answer === w.word.toLowerCase()
		}
		setResults(res)
	}

	function handleReset() {
		const init: Record<string, string[]> = {}
		for (const w of words) {
			init[w.id] = Array.from<string>({ length: w.word.length }).fill("")
		}
		setLetters(init)
		setHints(new Set())
		setResults(null)
		setCurrent(0)
	}

	const correctCount = results ? Object.values(results).filter(Boolean).length : 0

	const wordLetters = letters[word.id] ?? []
	const hintRevealed = hints.has(word.id)
	const firstExample = word.examples[0]
	const isCorrect = results?.[word.id] === true
	const isWrong = results?.[word.id] === false

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold">Điền từ vựng</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Đọc định nghĩa và ví dụ, sau đó điền từ vào các ô bên dưới
					</p>
				</div>
				<span className="text-sm font-medium text-muted-foreground">
					{current + 1}/{totalCount}
				</span>
			</div>

			{/* Progress dots */}
			<div className="flex gap-1.5">
				{words.map((w, i) => (
					<button
						key={w.id}
						type="button"
						className={cn(
							"h-1.5 flex-1 rounded-full transition-colors",
							submitted && results?.[w.id] === true && "bg-green-500",
							submitted && results?.[w.id] === false && "bg-red-400",
							!submitted && i === current && "bg-primary",
							!submitted && i !== current && "bg-muted",
						)}
						onClick={() => setCurrent(i)}
					/>
				))}
			</div>

			{/* Results banner */}
			{submitted && (
				<div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 dark:border-green-800 dark:bg-green-950/20">
					<h3 className="text-lg font-bold">Kết quả</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Bạn trả lời đúng{" "}
						<span className="font-semibold text-green-600">
							{correctCount}/{totalCount}
						</span>{" "}
						từ
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

			{/* Current word card */}
			<div
				className={cn(
					"rounded-2xl border p-6",
					isCorrect && "border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10",
					isWrong && "border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10",
				)}
			>
				<div className="flex items-center gap-2">
					<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
						{word.partOfSpeech}
					</span>
				</div>

				<div className="mt-4 space-y-2 text-sm">
					<p>
						<span className="font-medium">Definition:</span> {word.definition}
					</p>
					<p>
						<span className="font-medium">Giải thích:</span> {word.explanation}
					</p>
				</div>

				{firstExample && (
					<p className="mt-4 text-sm italic text-muted-foreground">
						<span className="font-medium not-italic text-foreground">Ví dụ:</span> \"
						{blankWord(firstExample, word.word)}\"
					</p>
				)}

				{/* Letter slots */}
				<div className="mt-6 flex flex-wrap items-center justify-center gap-2">
					{wordLetters.map((letter, i) => (
						<input
							key={i}
							ref={(el) => setRef(word.id, i, el)}
							type="text"
							maxLength={1}
							value={letter}
							onChange={(e) => handleLetterChange(word.id, i, e.target.value)}
							onKeyDown={(e) => handleKeyDown(word.id, i, e)}
							disabled={submitted}
							className={cn(
								"size-10 rounded-md border-b-2 bg-transparent text-center text-lg font-semibold uppercase outline-none transition-colors focus:border-primary focus:bg-primary/5",
								!submitted && "border-muted-foreground/30",
								isCorrect && "border-green-500 text-green-600",
								isWrong && "border-red-500 text-red-600",
							)}
						/>
					))}
				</div>

				{/* Hint */}
				{!submitted && (
					<div className="mt-4 flex justify-center">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="gap-1.5 text-xs"
							onClick={() => revealHint(word.id)}
						>
							<HugeiconsIcon icon={BulbIcon} className="size-4" />
							Gợi ý
						</Button>
					</div>
				)}

				{hintRevealed && !submitted && (
					<p className="mt-2 text-center text-xs text-muted-foreground">
						Chữ cái đầu: \"<span className="font-semibold">{word.word[0]?.toUpperCase()}</span>
						\" · Loại từ: {word.partOfSpeech} · {word.word.length} chữ cái
					</p>
				)}

				{/* After submit feedback */}
				{isCorrect && (
					<p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-green-600">
						<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
						{word.word}
					</p>
				)}

				{isWrong && (
					<p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-red-600">
						<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
						Đáp án đúng: <span className="text-green-600">{word.word}</span>
					</p>
				)}
			</div>

			{/* Navigation + submit */}
			<div className="flex items-center justify-between">
				<Button
					variant="outline"
					size="sm"
					disabled={isFirst}
					onClick={() => setCurrent((p) => p - 1)}
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					Trước
				</Button>

				{!submitted ? (
					isLast ? (
						<Button onClick={handleSubmit}>Kiểm tra</Button>
					) : (
						<Button variant="outline" size="sm" onClick={() => setCurrent((p) => p + 1)}>
							Tiếp
							<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
						</Button>
					)
				) : (
					<div className="flex gap-2">
						{!isLast && (
							<Button variant="outline" size="sm" onClick={() => setCurrent((p) => p + 1)}>
								Tiếp
								<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
							</Button>
						)}
						<Button variant="outline" size="sm" onClick={handleReset}>
							Làm lại
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
