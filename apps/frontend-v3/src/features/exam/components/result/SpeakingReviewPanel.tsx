import { useEffect, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import type { ExamVersionSpeakingPart, SessionResultsData, SpeakingFeedbackItem } from "#/features/exam/types"
import {
	DetailSection,
	EmptyPanel,
	FeedbackBlock,
	PendingBlock,
	ProductiveHeader,
	ProductiveLayout,
	type ProductiveTabItem,
	RubricSection,
	speakingPromptText,
} from "./ProductiveBlocks"

const SPEAKING_LABEL: Record<string, string> = {
	fluency: "Fluency",
	pronunciation: "Pronunciation",
	discourse_management: "Discourse Management",
	vocabulary: "Vocabulary",
	grammar: "Grammar",
}

export function SpeakingReviewPanel({ result }: { readonly result: SessionResultsData }) {
	const parts = useMemo(
		() =>
			[...(result.version?.speaking_parts ?? [])].sort(
				(a, b) => a.part - b.part || a.display_order - b.display_order,
			),
		[result.version?.speaking_parts],
	)
	const [activeId, setActiveId] = useState(parts[0]?.id ?? "")

	useEffect(() => {
		if (!parts.find((item) => item.id === activeId)) setActiveId(parts[0]?.id ?? "")
	}, [parts, activeId])

	const firstPart = parts[0]
	if (!firstPart) return <EmptyPanel text="Không có phần Speaking." />

	const active = parts.find((item) => item.id === activeId) ?? firstPart
	const items = parts.map((part) =>
		partTabItem(
			part,
			result.speaking_feedback.find((item) => item.part_id === part.id),
		),
	)
	const feedback = result.speaking_feedback.find((item) => item.part_id === active.id) ?? null

	return (
		<ProductiveLayout
			title="Speaking"
			items={items}
			activeId={active.id}
			onSelect={setActiveId}
			tone="speaking"
		>
			<ScrollArea className="min-h-0">
				<SpeakingDetail part={active} feedback={feedback} />
			</ScrollArea>
		</ProductiveLayout>
	)
}

function SpeakingDetail({
	part,
	feedback,
}: {
	readonly part: ExamVersionSpeakingPart
	readonly feedback: SpeakingFeedbackItem | null
}) {
	const status = feedback?.score_status ?? "not_submitted"

	return (
		<div>
			<ProductiveHeader
				title={`Speaking Part ${part.part}`}
				status={status}
				score={feedback?.overall_band ?? null}
				tone="speaking"
			/>
			<DetailSection title="Đề nói">
				<p className="whitespace-pre-wrap">{speakingPromptText(part.content)}</p>
			</DetailSection>
			{feedback?.audio_url && (
				<DetailSection title="Bài nói">
					<audio src={feedback.audio_url} controls className="w-full">
						<track kind="captions" />
					</audio>
				</DetailSection>
			)}
			{feedback?.transcript && (
				<DetailSection title="Transcript">
					<p className="whitespace-pre-wrap">{feedback.transcript}</p>
				</DetailSection>
			)}
			<RubricSection scores={feedback?.criterion_scores ?? null} labels={SPEAKING_LABEL} tone="speaking" />
			<FeedbackBlock feedback={feedback?.feedback ?? null} />
			<PendingBlock status={status} />
		</div>
	)
}

function partTabItem(
	part: ExamVersionSpeakingPart,
	feedback: SpeakingFeedbackItem | undefined,
): ProductiveTabItem {
	return {
		id: part.id,
		label: `Part ${part.part}`,
		score: feedback?.overall_band ?? null,
		status: feedback?.score_status ?? "not_submitted",
	}
}
