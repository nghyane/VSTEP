import { memo, useMemo } from "react"
import type { ListeningContent, QuestionContent, SessionQuestion } from "@/types/api"
import { MCQItemRenderer } from "./MCQItemRenderer"

function isListeningContent(content: QuestionContent): content is ListeningContent {
	return "audioUrl" in content && "items" in content
}

// BE individual MCQ format: {stem, options: {A,B,C,D}, script?, audioPath?}
function isSimpleMCQ(content: QuestionContent): boolean {
	return "stem" in content && "options" in content && !("items" in content)
}

function normalizeOptions(options: unknown): string[] {
	if (Array.isArray(options)) return options
	if (typeof options === "object" && options !== null) {
		return Object.keys(options)
			.sort()
			.map((k) => (options as Record<string, string>)[k])
	}
	return []
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
	const isGrouped = isListeningContent(content)
	const isSimple = !isGrouped && isSimpleMCQ(content)

	const audioSrc = useMemo(() => {
		if (isGrouped) return content.audioUrl
		const raw = content as unknown as Record<string, unknown>
		return (raw.audioUrl ?? raw.audioPath ?? "") as string
	}, [content, isGrouped])

	if (!isGrouped && !isSimple) return null

	return (
		<div id={question.id} className="space-y-6">
			<h2 className="text-lg font-semibold">Listening — Part {question.part}</h2>

			{audioSrc && (
				<div className="rounded-xl bg-muted/30 p-4">
					{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio */}
					<audio controls controlsList="nodownload" preload="metadata" className="w-full" src={audioSrc} />
				</div>
			)}

			<div className="space-y-6">
				{isGrouped ? (
					content.items.map((item, index) => (
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
					))
				) : (
					<MCQItemRenderer
						index={0}
						stem={(content as unknown as Record<string, unknown>).stem as string}
						options={normalizeOptions((content as unknown as Record<string, unknown>).options)}
						selectedOption={currentAnswers["1"] ?? null}
						onSelect={(itemIndex, optionIndex) =>
							onSelectAnswer(question.id, currentAnswers, itemIndex, optionIndex)
						}
					/>
				)}
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
	return (
		<div className="space-y-4">
			<div className="rounded-xl bg-muted/30 p-4">
				{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio */}
				<audio controls controlsList="nodownload" preload="metadata" className="w-full" src={audioUrl} />
			</div>
			{transcript && (
				<div className="rounded-xl bg-muted/30 p-4">
					<p className="whitespace-pre-line text-sm">{transcript}</p>
				</div>
			)}
		</div>
	)
}

