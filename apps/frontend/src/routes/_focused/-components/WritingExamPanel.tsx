import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
	ExamSessionDetail,
	QuestionContent,
	SubmissionAnswer,
	WritingContent,
} from "@/types/api"

// --- Type guard ---

function isWritingContent(c: QuestionContent): c is WritingContent {
	return "prompt" in c && "taskType" in c
}

// --- Props ---

interface WritingExamPanelProps {
	questions: ExamSessionDetail["questions"]
	answers: Map<string, SubmissionAnswer>
	onUpdateWriting: (qId: string, text: string) => void
}

// --- Prompt display (left side) ---

function WritingPrompt({ content }: { content: WritingContent }) {
	const taskLabel = content.taskType === "letter" ? "Letter" : "Essay"

	return (
		<div className="space-y-4">
			<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
				{taskLabel}
			</span>

			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{content.prompt}</p>
			</div>

			{content.instructions && content.instructions.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm font-medium">Hướng dẫn:</p>
					<ol className="list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
						{content.instructions.map((ins, i) => (
							<li key={`ins-${i}`}>{ins}</li>
						))}
					</ol>
				</div>
			)}

			{content.requiredPoints && content.requiredPoints.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm font-medium">Yêu cầu:</p>
					<ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
						{content.requiredPoints.map((pt, i) => (
							<li key={`pt-${i}`}>{pt}</li>
						))}
					</ul>
				</div>
			)}

			<p className="text-sm text-muted-foreground">Tối thiểu {content.minWords} từ</p>
		</div>
	)
}

// --- Main Panel ---

export function WritingExamPanel({ questions, answers, onUpdateWriting }: WritingExamPanelProps) {
	const parts = useMemo(() => [...questions].sort((a, b) => a.part - b.part), [questions])

	const [activePartIdx, setActivePartIdx] = useState(0)
	const [mobileTab, setMobileTab] = useState<"prompt" | "editor">("prompt")

	const activeQuestion = parts[activePartIdx]
	const content = activeQuestion?.content

	// Current text answer
	const currentText = useMemo(() => {
		if (!activeQuestion) return ""
		const entry = answers.get(activeQuestion.id)
		if (entry && "text" in entry) return (entry as { text: string }).text
		return ""
	}, [answers, activeQuestion])

	const wordCount = useMemo(
		() => currentText.trim().split(/\s+/).filter(Boolean).length,
		[currentText],
	)

	// Per-part metadata for tabs
	const partsMeta = useMemo(
		() =>
			parts.map((q) => {
				const c = q.content as WritingContent
				const entry = answers.get(q.id)
				const text = entry && "text" in entry ? (entry as { text: string }).text : ""
				const wc = text.trim().split(/\s+/).filter(Boolean).length
				const minWords = isWritingContent(c) ? c.minWords : 0
				const taskType = isWritingContent(c) ? c.taskType : "essay"
				return { part: q.part, wordCount: wc, minWords, taskType }
			}),
		[parts, answers],
	)

	const handlePrevPart = useCallback(() => {
		setActivePartIdx((i) => Math.max(0, i - 1))
	}, [])

	const handleNextPart = useCallback(() => {
		setActivePartIdx((i) => Math.min(i + 1, parts.length - 1))
	}, [parts.length])

	if (!activeQuestion || !content || !isWritingContent(content)) return null

	// --- Textarea editor (shared between desktop/mobile) ---
	const editorContent = (
		<div className="flex h-full flex-col gap-3">
			<textarea
				value={currentText}
				onChange={(e) => onUpdateWriting(activeQuestion.id, e.target.value)}
				className="w-full flex-1 resize-y rounded-xl border border-border p-4 text-sm leading-relaxed focus:border-primary focus:outline-none"
				placeholder="Viết bài của bạn tại đây..."
			/>
			<p
				className={cn(
					"text-sm",
					wordCount >= content.minWords ? "text-green-600" : "text-muted-foreground",
				)}
			>
				{wordCount}/{content.minWords} từ
			</p>
		</div>
	)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* ---- Desktop: split layout (prompt left, editor right) ---- */}
			<div className="hidden flex-1 overflow-hidden lg:flex">
				<div className="w-2/5 overflow-y-auto border-r bg-muted/5 p-6">
					<WritingPrompt content={content} />
				</div>
				<div className="flex flex-1 flex-col overflow-y-auto p-6">{editorContent}</div>
			</div>

			{/* ---- Mobile: tabbed layout ---- */}
			<div className="flex flex-1 flex-col overflow-hidden lg:hidden">
				<div className="flex shrink-0 border-b">
					<button
						type="button"
						onClick={() => setMobileTab("prompt")}
						className={cn(
							"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
							mobileTab === "prompt"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Đề bài
					</button>
					<button
						type="button"
						onClick={() => setMobileTab("editor")}
						className={cn(
							"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
							mobileTab === "editor"
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						Viết bài
					</button>
				</div>
				<div className="flex flex-1 flex-col overflow-y-auto p-4">
					{mobileTab === "prompt" ? <WritingPrompt content={content} /> : editorContent}
				</div>
			</div>

			{/* ---- Part tabs + prev/next buttons ---- */}
			<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
				{/* Left: prev part */}
				{activePartIdx > 0 ? (
					<Button size="sm" variant="outline" onClick={handlePrevPart}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Task {activePartIdx}
					</Button>
				) : (
					<div className="w-24" />
				)}

				{/* Center: part tabs */}
				<div className="flex items-center gap-1.5">
					{partsMeta.map((meta, i) => {
						const isActive = i === activePartIdx
						const pct =
							meta.minWords > 0 ? Math.min(100, (meta.wordCount / meta.minWords) * 100) : 0
						const label = meta.taskType === "letter" ? "Letter" : "Essay"
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActivePartIdx(i)}
								className={cn(
									"relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 pb-2.5 pt-1.5 text-xs font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								Task {i + 1} · {label}
								<span className="opacity-80">
									{meta.wordCount}/{meta.minWords}
								</span>
								{/* Mini progress bar */}
								<span
									className={cn(
										"absolute inset-x-1 bottom-0.5 h-0.5 overflow-hidden rounded-full",
										isActive ? "bg-primary-foreground/30" : "bg-border",
									)}
								>
									<span
										className={cn(
											"block h-full rounded-full transition-[width]",
											isActive ? "bg-primary-foreground" : "bg-muted-foreground/50",
										)}
										style={{ width: `${pct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{/* Right: next part */}
				{activePartIdx < parts.length - 1 ? (
					<Button size="sm" onClick={handleNextPart}>
						Task {activePartIdx + 2}
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
