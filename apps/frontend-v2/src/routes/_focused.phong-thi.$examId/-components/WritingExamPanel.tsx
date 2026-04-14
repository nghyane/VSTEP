import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "#/components/ui/button"
import type { MockWritingTask, WritingAnswerMap } from "#/lib/mock/exam-session"
import { cn } from "#/lib/utils"

// ─── Prompt display ───────────────────────────────────────────────────────────

function WritingPrompt({ task }: { task: MockWritingTask }) {
	return (
		<div className="space-y-4">
			<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
				{task.taskType === "letter" ? "Letter" : "Essay"}
			</span>

			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{task.prompt}</p>
			</div>

			{task.instructions.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm font-medium">Hướng dẫn:</p>
					<ol className="list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
						{task.instructions.map((ins) => (
							<li key={ins}>{ins}</li>
						))}
					</ol>
				</div>
			)}

			<p className="text-sm text-muted-foreground">Tối thiểu {task.minWords} từ</p>
		</div>
	)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	tasks: MockWritingTask[]
	answers: WritingAnswerMap
	onAnswer: (taskId: string, text: string) => void
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function WritingExamPanel({ tasks, answers, onAnswer }: Props) {
	const sorted = useMemo(() => [...tasks].sort((a, b) => a.part - b.part), [tasks])

	const [activeIdx, setActiveIdx] = useState(0)
	const [mobileTab, setMobileTab] = useState<"prompt" | "editor">("prompt")

	const activeTask = sorted[activeIdx]
	const currentText = activeTask ? (answers.get(activeTask.id) ?? "") : ""

	const wordCount = useMemo(
		() => currentText.trim().split(/\s+/).filter(Boolean).length,
		[currentText],
	)

	const tasksMeta = useMemo(
		() =>
			sorted.map((t) => {
				const text = answers.get(t.id) ?? ""
				const wc = text.trim().split(/\s+/).filter(Boolean).length
				return { taskType: t.taskType, wordCount: wc, minWords: t.minWords }
			}),
		[sorted, answers],
	)

	const handlePrev = useCallback(() => setActiveIdx((i) => Math.max(0, i - 1)), [])
	const handleNext = useCallback(
		() => setActiveIdx((i) => Math.min(i + 1, sorted.length - 1)),
		[sorted.length],
	)

	if (!activeTask) return null

	const editorContent = (
		<div className="flex h-full flex-col gap-3">
			<textarea
				value={currentText}
				onChange={(e) => onAnswer(activeTask.id, e.target.value)}
				className="w-full flex-1 resize-none rounded-xl border border-border bg-card p-4 text-sm leading-relaxed shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				placeholder="Viết bài của bạn tại đây..."
			/>
			<div className="space-y-1.5">
				<div className="h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						className={cn(
							"h-full rounded-full transition-[width] duration-300",
							wordCount >= activeTask.minWords ? "bg-emerald-500" : "bg-primary/60",
						)}
						style={{
							width: `${Math.min(100, activeTask.minWords > 0 ? (wordCount / activeTask.minWords) * 100 : 0)}%`,
						}}
					/>
				</div>
				<p
					className={cn(
						"text-sm",
						wordCount >= activeTask.minWords
							? "font-medium text-emerald-600"
							: "text-muted-foreground",
					)}
				>
					{wordCount}/{activeTask.minWords} từ
					{wordCount >= activeTask.minWords && " ✓"}
				</p>
			</div>
		</div>
	)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
		{/* Desktop: split layout */}
		<div className="hidden flex-1 overflow-hidden lg:flex">
			<div className="w-2/5 overflow-y-auto border-r bg-muted/10 p-6">
				<WritingPrompt task={activeTask} />
			</div>
			<div className="flex flex-1 flex-col overflow-y-auto p-6">{editorContent}</div>
		</div>

			{/* Mobile: tabbed layout */}
			<div className="flex flex-1 flex-col overflow-hidden lg:hidden">
				<div className="flex shrink-0 border-b">
					{(["prompt", "editor"] as const).map((tab) => (
						<button
							key={tab}
							type="button"
							onClick={() => setMobileTab(tab)}
							className={cn(
								"flex-1 py-2.5 text-center text-sm font-medium transition-colors",
								mobileTab === tab
									? "border-b-2 border-primary text-primary"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{tab === "prompt" ? "Đề bài" : "Viết bài"}
						</button>
					))}
				</div>
				<div className="flex flex-1 flex-col overflow-y-auto p-4">
					{mobileTab === "prompt" ? <WritingPrompt task={activeTask} /> : editorContent}
				</div>
			</div>

		{/* Task tabs + prev/next */}
		<div className="flex items-center justify-between border-t bg-card px-4 py-2.5">
				{activeIdx > 0 ? (
					<Button size="sm" variant="outline" onClick={handlePrev}>
						<ChevronLeft className="size-4" />
						Task {activeIdx}
					</Button>
				) : (
					<div className="w-24" />
				)}

				<div className="flex items-center gap-1.5">
					{tasksMeta.map((meta, i) => {
						const isActive = i === activeIdx
						const pct = meta.minWords > 0 ? Math.min(100, (meta.wordCount / meta.minWords) * 100) : 0
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActiveIdx(i)}
								className={cn(
									"relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 pb-2.5 pt-1.5 text-xs font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								Task {i + 1} · {meta.taskType === "letter" ? "Letter" : "Essay"}
								<span className="opacity-80">
									{meta.wordCount}/{meta.minWords}
								</span>
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

				{activeIdx < sorted.length - 1 ? (
					<Button size="sm" onClick={handleNext}>
						Task {activeIdx + 2}
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
