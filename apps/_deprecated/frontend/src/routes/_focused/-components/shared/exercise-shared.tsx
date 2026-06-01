import { cn } from "@/lib/utils"
import {
	type ExamQuestion,
	LISTENING_EXAMS,
	type ListeningExam,
	READING_EXAMS,
	type ReadingExam,
	SPEAKING_EXAMS,
	type SpeakingExam,
	WRITING_EXAMS,
	type WritingExam,
} from "@/routes/_learner/practice/-components/mock-data"

export type AnyExam = ListeningExam | ReadingExam | WritingExam | SpeakingExam

export function findExam(skill: string, id: string): AnyExam | null {
	switch (skill) {
		case "listening":
			return LISTENING_EXAMS.find((e) => e.id === id) ?? null
		case "reading":
			return READING_EXAMS.find((e) => e.id === id) ?? null
		case "writing":
			return WRITING_EXAMS.find((e) => e.id === id) ?? null
		case "speaking":
			return SPEAKING_EXAMS.find((e) => e.id === id) ?? null
		default:
			return null
	}
}

export function getAllQuestions(exam: AnyExam, skill: string): ExamQuestion[] {
	switch (skill) {
		case "listening":
			return (exam as ListeningExam).sections.flatMap((s) => s.questions)
		case "reading":
			return (exam as ReadingExam).passages.flatMap((p) => p.questions)
		default:
			return []
	}
}

export function getExamText(exam: AnyExam, skill: string): string {
	switch (skill) {
		case "listening": {
			const e = exam as ListeningExam
			return e.sections.map((s) => s.questions.map((q) => q.questionText).join("\n")).join("\n")
		}
		case "reading": {
			const e = exam as ReadingExam
			return e.passages.map((p) => p.content).join("\n\n")
		}
		case "writing": {
			const e = exam as WritingExam
			return e.tasks.map((t) => t.prompt).join("\n\n")
		}
		case "speaking": {
			const e = exam as SpeakingExam
			return e.parts.map((p) => p.instructions).join("\n\n")
		}
		default:
			return ""
	}
}

export function formatTime(seconds: number): string {
	if (!seconds || !Number.isFinite(seconds)) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function parseWritingPrompt(prompt: string) {
	const parts = prompt.split("\n\n\n")
	if (parts.length >= 3) {
		return { before: parts[0], quote: parts[1], after: parts.slice(2).join("\n\n") }
	}
	return { before: prompt, quote: null, after: null }
}

export function McqOption({
	letter,
	text,
	isSelected,
	isCorrect,
	isWrong,
	submitted,
	onSelect,
}: {
	letter: string
	text: string
	isSelected: boolean
	isCorrect: boolean
	isWrong: boolean
	submitted: boolean
	onSelect: () => void
}) {
	let cls = "border bg-background"
	if (submitted) {
		if (isCorrect)
			cls = "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
		else if (isWrong)
			cls = "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
	} else if (isSelected) {
		cls = "border-primary bg-primary/5 ring-1 ring-primary/20"
	}

	return (
		<button
			type="button"
			className={cn(
				"flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
				cls,
				!submitted && "cursor-pointer hover:border-primary/40",
			)}
			onClick={onSelect}
			disabled={submitted}
		>
			<span
				className={cn(
					"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
					submitted && isCorrect
						? "bg-green-500 text-white"
						: submitted && isWrong
							? "bg-red-500 text-white"
							: isSelected
								? "bg-primary text-primary-foreground"
								: "bg-muted text-muted-foreground",
				)}
			>
				{letter}
			</span>
			<span>{text}</span>
		</button>
	)
}
