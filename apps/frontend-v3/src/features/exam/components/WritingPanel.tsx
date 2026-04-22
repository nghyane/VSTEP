import { useState } from "react"
import type { ExamVersionWritingTask } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Props {
	tasks: ExamVersionWritingTask[]
	writingAnswers: Map<string, string>
	onAnswer: (taskId: string, text: string) => void
}

interface TaskEditorProps {
	task: ExamVersionWritingTask
	answer: string
	onAnswer: (taskId: string, text: string) => void
}

const TASK_TYPE_LABEL: Record<string, string> = {
	letter: "Thư",
	essay: "Bài luận",
	formal_letter: "Thư trang trọng",
	informal_letter: "Thư thân mật",
}

function TaskEditor({ task, answer, onAnswer }: TaskEditorProps) {
	const wordCount = answer.trim() === "" ? 0 : answer.trim().split(/\s+/).length
	const isUnder = wordCount < task.min_words
	const typeLabel = TASK_TYPE_LABEL[task.task_type] ?? task.task_type

	return (
		<div className="grid h-full grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border">
			{/* Prompt */}
			<div className="overflow-y-auto px-6 py-6">
				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-skill-writing/15 px-3 py-1 text-xs font-bold text-skill-writing">
							Phần {task.part}
						</span>
						<span className="rounded-full bg-border px-3 py-1 text-xs font-medium text-muted">
							{typeLabel}
						</span>
						<span className="ml-auto text-xs text-muted">{task.duration_minutes} phút</span>
					</div>
					<div className="rounded-xl border-2 border-skill-writing/20 bg-skill-writing/4 p-5">
						<p className="text-sm font-semibold text-muted mb-2">Đề bài</p>
						<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{task.prompt}</p>
					</div>
					<p className="text-xs text-muted">Tối thiểu {task.min_words} từ</p>
				</div>
			</div>

			{/* Editor */}
			<div className="flex flex-col px-6 py-6 gap-3">
				<div className="flex items-center justify-between">
					<p className="text-sm font-semibold text-foreground">Bài làm</p>
					<span className={cn("text-xs tabular-nums font-medium", isUnder ? "text-warning" : "text-success")}>
						{wordCount} / {task.min_words} từ
					</span>
				</div>
				<textarea
					value={answer}
					onChange={(e) => onAnswer(task.id, e.target.value)}
					placeholder="Viết bài làm của bạn ở đây..."
					className="flex-1 resize-none rounded-xl border-2 border-border bg-surface p-4 text-sm text-foreground placeholder-placeholder outline-none transition-colors focus:border-primary"
					aria-label={`Bài làm phần ${task.part}`}
				/>
				{isUnder && wordCount > 0 && (
					<p className="text-xs text-warning">Còn thiếu {task.min_words - wordCount} từ</p>
				)}
			</div>
		</div>
	)
}

export function WritingPanel({ tasks, writingAnswers, onAnswer }: Props) {
	const [activeIdx, setActiveIdx] = useState(0)
	const active = tasks[activeIdx]

	return (
		<div className="flex h-full flex-col">
			{/* Task tabs */}
			{tasks.length > 1 && (
				<div className="flex shrink-0 gap-1 border-b border-border bg-card px-5 py-2">
					{tasks.map((t, idx) => (
						<button
							key={t.id}
							type="button"
							onClick={() => setActiveIdx(idx)}
							className={cn(
								"rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
								activeIdx === idx
									? "bg-skill-writing/15 text-skill-writing"
									: "text-muted hover:text-foreground hover:bg-surface",
							)}
						>
							Phần {t.part}
						</button>
					))}
				</div>
			)}

			{/* Content */}
			<div className="flex-1 overflow-hidden">
				{active && (
					<TaskEditor
						key={active.id}
						task={active}
						answer={writingAnswers.get(active.id) ?? ""}
						onAnswer={onAnswer}
					/>
				)}
			</div>
		</div>
	)
}
