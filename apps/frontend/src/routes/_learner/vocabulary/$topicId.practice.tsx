import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	BulbIcon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Refresh01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getMockTopic } from "./-components/mock-data"
import { markWeak, removeWeak } from "./-components/use-vocab-progress"

export const Route = createFileRoute("/_learner/vocabulary/$topicId/practice")({
	component: PracticePage,
})

function blankWord(sentence: string, word: string): string {
	const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")
	return sentence.replace(regex, "___")
}

function PracticePage() {
	const { topicId } = Route.useParams()
	const topic = getMockTopic(topicId)

	const [current, setCurrent] = useState(0)
	const [letters, setLetters] = useState<Record<string, string[]>>(() => {
		if (!topic) return {}
		const init: Record<string, string[]> = {}
		for (const w of topic.words) {
			init[w.id] = Array.from<string>({ length: w.word.length }).fill("")
		}
		return init
	})
	const [hints, setHints] = useState<Set<string>>(new Set())
	const [checked, setChecked] = useState<Record<string, boolean>>({})
	const inputRefs = useRef<Map<string, HTMLInputElement[]>>(new Map())

	const setRef = useCallback((wordId: string, index: number, el: HTMLInputElement | null) => {
		if (!el) return
		const refs = inputRefs.current.get(wordId) ?? []
		if (!inputRefs.current.has(wordId)) {
			inputRefs.current.set(wordId, refs)
		}
		refs[index] = el
	}, [])

	if (!topic) {
		return (
			<div className="flex flex-col items-center gap-4 py-16">
				<p className="text-muted-foreground">Không tìm thấy chủ đề.</p>
				<Button variant="outline" asChild>
					<Link to="/vocabulary">Quay lại</Link>
				</Button>
			</div>
		)
	}

	const words = topic.words
	const word = words[current]
	const totalCount = words.length
	const isFirst = current === 0
	const isChecked = word.id in checked
	const allChecked = Object.keys(checked).length === totalCount

	const wordLetters = letters[word.id] ?? []
	const hintRevealed = hints.has(word.id)
	const firstExample = word.examples[0]
	const isCorrect = checked[word.id] === true
	const isWrong = checked[word.id] === false
	const correctCount = Object.values(checked).filter(Boolean).length

	function checkWord(wordId: string) {
		if (wordId in checked) return
		const answer = (letters[wordId] ?? []).join("").toLowerCase()
		const w = words.find((x) => x.id === wordId)
		if (!w) return
		const correct = answer === w.word.toLowerCase()
		setChecked((prev) => ({ ...prev, [wordId]: correct }))
		if (correct) {
			removeWeak(topicId, wordId)
		} else {
			markWeak(topicId, wordId)
		}
	}

	function handleLetterChange(wordId: string, index: number, value: string) {
		if (isChecked) return
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

	useEffect(() => {
		if (!isChecked) {
			const refs = inputRefs.current.get(word.id)
			refs?.[0]?.focus()
		}
	}, [current, word.id, isChecked])

	useEffect(() => {
		function onEnter(e: KeyboardEvent) {
			if (e.key !== "Enter") return
			e.preventDefault()
			if (!isChecked && wordLetters.some((l) => l)) {
				checkWord(word.id)
			} else if (isChecked && !allChecked) {
				setCurrent((p) => p + 1)
			}
		}
		window.addEventListener("keydown", onEnter)
		return () => window.removeEventListener("keydown", onEnter)
	}, [isChecked, allChecked, wordLetters, word.id])

	function handleKeyDown(wordId: string, index: number, e: React.KeyboardEvent) {
		if (isChecked) return
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
		setHints((prev) => new Set(prev).add(wordId))
	}

	function handleReset() {
		const init: Record<string, string[]> = {}
		for (const w of words) {
			init[w.id] = Array.from<string>({ length: w.word.length }).fill("")
		}
		setLetters(init)
		setHints(new Set())
		setChecked({})
		setCurrent(0)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<Link
						to="/vocabulary/$topicId"
						params={{ topicId }}
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						{topic.name}
					</Link>
					<h1 className="text-xl font-bold">Luyện điền từ</h1>
					<p className="text-sm text-muted-foreground">
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
							checked[w.id] === true && "bg-green-500",
							checked[w.id] === false && "bg-red-400",
							!(w.id in checked) && i === current && "bg-primary",
							!(w.id in checked) && i !== current && "bg-muted",
						)}
						onClick={() => setCurrent(i)}
					/>
				))}
			</div>

			{/* Results banner */}
			{allChecked && (
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
					"mx-auto max-w-2xl rounded-2xl border p-6",
					isCorrect && "border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10",
					isWrong && "border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10",
				)}
			>
				<div className="flex items-center gap-2">
					<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
						{word.partOfSpeech}
					</span>
					{word.phonetic && <span className="text-xs text-muted-foreground">{word.phonetic}</span>}
				</div>

				<div className="mt-4 space-y-2 text-sm">
					<p>
						<span className="font-medium">Definition:</span> {word.definition}
					</p>
					<p>
						<span className="font-medium">Giải thích:</span>{" "}
						<span className="text-muted-foreground">{word.explanation}</span>
					</p>
				</div>

				{firstExample && (
					<p className="mt-4 text-sm italic text-muted-foreground">
						<span className="font-medium not-italic text-foreground">Ví dụ:</span> &ldquo;
						{blankWord(firstExample, word.word)}&rdquo;
					</p>
				)}

				{/* Letter slots */}
				<div className="mt-6 flex flex-wrap items-end justify-center gap-1">
					{wordLetters.map((letter, i) => (
						<input
							key={`${word.id}-${i}`}
							ref={(el) => setRef(word.id, i, el)}
							type="text"
							maxLength={1}
							value={letter}
							onChange={(e) => handleLetterChange(word.id, i, e.target.value)}
							onKeyDown={(e) => handleKeyDown(word.id, i, e)}
							disabled={isChecked}
							className={cn(
								"w-8 border-b bg-transparent pb-1 text-center text-lg font-semibold uppercase outline-none transition-colors focus:border-b-2 focus:border-primary",
								!isChecked && "border-muted-foreground/40",
								isCorrect && "border-green-500 text-green-600",
								isWrong && "border-red-500 text-red-600",
							)}
						/>
					))}
				</div>

				{/* Hint */}
				{!isChecked && (
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

				{hintRevealed && !isChecked && (
					<p className="mt-2 text-center text-xs text-muted-foreground">
						Chữ cái đầu: &ldquo;
						<span className="font-semibold">{word.word[0]?.toUpperCase()}</span>
						&rdquo; · Loại từ: {word.partOfSpeech} · {word.word.length} chữ cái
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

			{/* Navigation */}
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
					<Button disabled={wordLetters.every((l) => !l)} onClick={() => checkWord(word.id)}>
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
