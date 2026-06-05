import { useEffect, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import type { ExamVersionWritingTask, SessionResultsData, WritingFeedbackItem } from "#/features/exam/types"
import {
	DetailSection,
	EmptyPanel,
	FeedbackBlock,
	PendingBlock,
	ProductiveHeader,
	ProductiveLayout,
	type ProductiveTabItem,
	RubricSection,
} from "./ProductiveBlocks"

const WRITING_LABEL: Record<string, string> = {
	task_fulfillment: "Task Fulfillment",
	organization: "Organization",
	vocabulary: "Vocabulary",
	grammar: "Grammar",
}

export function WritingReviewPanel({ result }: { readonly result: SessionResultsData }) {
	const tasks = useMemo(
		() =>
			[...(result.version?.writing_tasks ?? [])].sort(
				(a, b) => a.part - b.part || a.display_order - b.display_order,
			),
		[result.version?.writing_tasks],
	)
	const [activeId, setActiveId] = useState(tasks[0]?.id ?? "")

	useEffect(() => {
		if (!tasks.find((item) => item.id === activeId)) setActiveId(tasks[0]?.id ?? "")
	}, [tasks, activeId])

	const firstTask = tasks[0]
	if (!firstTask) return <EmptyPanel text="Không có phần Writing." />

	const active = tasks.find((item) => item.id === activeId) ?? firstTask
	const items = tasks.map((task) =>
		taskTabItem(
			task,
			result.writing_feedback.find((item) => item.task_id === task.id),
		),
	)
	const feedback = result.writing_feedback.find((item) => item.task_id === active.id) ?? null

	return (
		<ProductiveLayout
			title="Writing"
			items={items}
			activeId={active.id}
			onSelect={setActiveId}
			tone="writing"
		>
			<ScrollArea className="min-h-0">
				<WritingDetail task={active} feedback={feedback} />
			</ScrollArea>
		</ProductiveLayout>
	)
}

function WritingDetail({
	task,
	feedback,
}: {
	readonly task: ExamVersionWritingTask
	readonly feedback: WritingFeedbackItem | null
}) {
	const status = feedback?.score_status ?? "not_submitted"

	return (
		<div>
			<ProductiveHeader
				title={`Writing Task ${task.part}`}
				status={status}
				score={feedback?.overall_band ?? null}
				tone="writing"
				meta={feedback ? `${feedback.word_count} từ` : undefined}
			/>
			<DetailSection title="Đề bài">
				<p className="whitespace-pre-wrap">{task.prompt}</p>
			</DetailSection>
			{feedback?.text && (
				<DetailSection title="Bài làm">
					<p className="whitespace-pre-wrap">{feedback.text}</p>
				</DetailSection>
			)}
			<RubricSection scores={feedback?.criterion_scores ?? null} labels={WRITING_LABEL} tone="writing" />
			<FeedbackBlock feedback={feedback?.feedback ?? null} />
			<PendingBlock status={status} />
		</div>
	)
}

function taskTabItem(
	task: ExamVersionWritingTask,
	feedback: WritingFeedbackItem | undefined,
): ProductiveTabItem {
	return {
		id: task.id,
		label: `Task ${task.part}`,
		score: feedback?.overall_band ?? null,
		status: feedback?.score_status ?? "not_submitted",
	}
}
