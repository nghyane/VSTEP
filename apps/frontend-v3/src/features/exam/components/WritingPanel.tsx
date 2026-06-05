import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DuoProgressBar } from "#/components/DuoProgressBar"
import { ScrollArea } from "#/components/ScrollArea"
import { ExamRoomProgressTabs, ExamRoomSkillBadge } from "#/features/exam/components/ExamRoomChrome"
import { ExamRoomFooter, type ExamRoomFooterAction } from "#/features/exam/components/ExamRoomFooter"
import type { ExamVersionWritingTask } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	tasks: ExamVersionWritingTask[]
	writingAnswers: Map<string, string>
	onAnswer: (taskId: string, text: string) => void
	footer: ExamRoomFooterAction
}

const TASK_TYPE_LABEL: Record<string, string> = {
	letter: "Thư",
	essay: "Bài luận",
	formal_letter: "Thư trang trọng",
	informal_letter: "Thư thân mật",
}

export function WritingPanel({ tasks, writingAnswers, onAnswer, footer }: Props) {
	const sorted = useMemo(() => [...tasks].sort((a, b) => a.display_order - b.display_order), [tasks])
	const [activeIdx, setActiveIdx] = useState(0)

	const activeTask = sorted[activeIdx]
	const currentText = activeTask ? (writingAnswers.get(activeTask.id) ?? "") : ""

	const wordCount = useMemo(() => currentText.trim().split(/\s+/).filter(Boolean).length, [currentText])

	const tasksMeta = useMemo(
		() =>
			sorted.map((t) => {
				const text = writingAnswers.get(t.id) ?? ""
				const wc = text.trim().split(/\s+/).filter(Boolean).length
				return {
					typeLabel: TASK_TYPE_LABEL[t.task_type] ?? t.task_type,
					wordCount: wc,
					minWords: t.min_words,
				}
			}),
		[sorted, writingAnswers],
	)

	const handleNext = useCallback(
		() => setActiveIdx((i) => Math.min(i + 1, sorted.length - 1)),
		[sorted.length],
	)

	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const autoResize = useCallback(() => {
		const el = textareaRef.current
		if (!el) return
		el.style.height = "auto"
		el.style.height = `${el.scrollHeight}px`
	}, [])

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-run when task or text changes
	useEffect(() => {
		autoResize()
	}, [autoResize, activeTask?.id, currentText])

	if (!activeTask) return null

	const isUnder = wordCount < activeTask.min_words
	const pct = activeTask.min_words > 0 ? Math.min(100, (wordCount / activeTask.min_words) * 100) : 0
	const editorMinRows = Math.min(14, Math.max(10, Math.ceil(activeTask.min_words / 20)))
	const hasNextTask = activeIdx < sorted.length - 1
	const activeFooter = hasNextTask
		? {
				...footer,
				isLastSkill: false,
				nextTone: "secondary" as const,
				statusText: isUnder
					? `Phần ${activeIdx + 1} còn thiếu ${activeTask.min_words - wordCount} từ`
					: `Phần ${activeIdx + 1} đã đạt yêu cầu số từ`,
				nextLabel: `Tiếp: Phần ${activeIdx + 2}`,
				onNext: handleNext,
			}
		: footer

	return (
		<div className="flex flex-1 flex-col overflow-hidden bg-background">
			<ScrollArea className="flex-1">
				<div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-2">
					{/* Prompt card */}
					<div className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
						<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-5">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<ExamRoomSkillBadge tone="writing">Phần {activeTask.part}</ExamRoomSkillBadge>
								<span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted">
									{TASK_TYPE_LABEL[activeTask.task_type] ?? activeTask.task_type}
								</span>
								<span className="ml-auto text-xs text-muted">{activeTask.duration_minutes} phút</span>
							</div>
							<p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">Đề bài</p>
							<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
								{activeTask.prompt}
							</p>
						</div>

						<p className="pl-1 text-xs text-muted">Tối thiểu {activeTask.min_words} từ</p>
					</div>

					{/* Editor card */}
					<div className="flex flex-col gap-3 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-4">
						<div className="flex items-center justify-between px-1">
							<p className="text-sm font-extrabold text-foreground">Bài làm</p>
							<span
								className={cn(
									"text-xs font-bold tabular-nums",
									wordCount >= activeTask.min_words
										? "text-primary"
										: isUnder && wordCount > 0
											? "text-warning"
											: "text-muted",
								)}
							>
								{wordCount} / {activeTask.min_words} từ
							</span>
						</div>

						<ScrollArea className="max-h-[420px] rounded-(--radius-button) border-2 border-border/70 bg-background transition-all focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
							<textarea
								ref={textareaRef}
								value={currentText}
								onChange={(e) => {
									onAnswer(activeTask.id, e.target.value)
									autoResize()
								}}
								placeholder="Viết bài làm của bạn ở đây..."
								rows={editorMinRows}
								className="block w-full resize-none overflow-hidden bg-transparent p-4 text-sm leading-relaxed text-foreground placeholder:text-placeholder outline-none"
								aria-label={`Bài làm phần ${activeTask.part}`}
							/>
						</ScrollArea>

						{/* Word count progress bar */}
						<div className="space-y-1.5 px-1">
							<DuoProgressBar
								value={pct}
								tone={wordCount >= activeTask.min_words ? "primary" : "warning"}
								heightPx={12}
								label={`${wordCount}/${activeTask.min_words} từ`}
							/>
							{isUnder && wordCount > 0 && (
								<p className="text-xs text-warning">Còn thiếu {activeTask.min_words - wordCount} từ</p>
							)}
							{!isUnder && wordCount > 0 && <p className="text-xs font-bold text-primary">Đạt yêu cầu ✓</p>}
						</div>
					</div>
				</div>
			</ScrollArea>

			<ExamRoomFooter
				{...activeFooter}
				toneClass="text-skill-writing"
				context={
					<ExamRoomProgressTabs
						items={tasksMeta.map((meta, i) => ({
							id: String(i),
							label: `Phần ${i + 1}`,
							meta: `· ${meta.typeLabel}`,
							progressPct: meta.minWords > 0 ? Math.min(100, (meta.wordCount / meta.minWords) * 100) : 0,
						}))}
						activeId={String(activeIdx)}
						onChange={(id) => setActiveIdx(Number(id))}
					/>
				}
			/>
		</div>
	)
}
