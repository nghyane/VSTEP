import { memo } from "react"
import { usePresignedUrl } from "@/lib/storage"
import type { ListeningContent, QuestionContent, SessionQuestion } from "@/types/api"
import { MCQItemRenderer } from "./MCQItemRenderer"

function isListeningContent(content: QuestionContent): content is ListeningContent {
	return "audioUrl" in content && "items" in content
}

interface ListeningQuestionProps {
	question: SessionQuestion
	currentAnswers: Record<string, string>
	onSelectAnswer: (
		questionId: string,
		currentAnswers: Record<string, string>,
		itemIndex: number,
		optionIndex: number,
	) => void
}

export const ListeningQuestion = memo(function ListeningQuestion({
	question,
	currentAnswers,
	onSelectAnswer,
}: ListeningQuestionProps) {
	const content = question.content
	const audioKey = isListeningContent(content) ? content.audioUrl : undefined
	const { data: audioSrc } = usePresignedUrl(audioKey)

	if (!isListeningContent(content)) return null

	return (
		<div id={question.id} className="space-y-6">
			<h2 className="text-lg font-semibold">Listening — Part {question.part}</h2>

			<div className="rounded-xl bg-muted/30 p-4">
				{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio */}
				<audio
					controls
					controlsList="nodownload"
					preload="metadata"
					className="w-full"
					src={audioSrc ?? ""}
				/>
			</div>

			<div className="space-y-6">
				{content.items.map((item, index) => (
					<MCQItemRenderer
						key={`item-${index}`}
						index={index}
						stem={item.stem}
						options={item.options}
						selectedOption={currentAnswers[String(index + 1)] ?? null}
						onSelect={(itemIndex, optionIndex) =>
							onSelectAnswer(question.id, currentAnswers, itemIndex, optionIndex)
						}
					/>
				))}
			</div>
		</div>
	)
})

export function AudioPlayerSection({
	audioUrl,
	transcript,
}: {
	audioUrl: string
	transcript?: string
}) {
	const { data: audioSrc } = usePresignedUrl(audioUrl)

	return (
		<div className="space-y-4">
			<div className="rounded-xl bg-muted/30 p-4">
				{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio */}
				<audio
					controls
					controlsList="nodownload"
					preload="metadata"
					className="w-full"
					src={audioSrc ?? ""}
				/>
			</div>
			{transcript && (
				<div className="rounded-xl bg-muted/30 p-4">
					<p className="whitespace-pre-line text-sm">{transcript}</p>
				</div>
			)}
		</div>
	)
}
