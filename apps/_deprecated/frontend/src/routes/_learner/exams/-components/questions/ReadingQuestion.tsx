import { memo } from "react"
import type {
	QuestionContent,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	ReadingTNGContent,
	SessionQuestion,
} from "@/types/api"
import { MCQItemRenderer } from "./MCQItemRenderer"

interface ReadingQuestionProps {
	question: SessionQuestion
	currentAnswers: Record<string, string>
	onSelectAnswer: (
		questionId: string,
		currentAnswers: Record<string, string>,
		itemIndex: number,
		optionIndex: number,
	) => void
}

function isReadingGapFillContent(c: QuestionContent): c is ReadingGapFillContent {
	return "textWithGaps" in c
}

function isReadingMatchingContent(c: QuestionContent): c is ReadingMatchingContent {
	return "paragraphs" in c && "headings" in c
}

function isReadingPassageContent(c: QuestionContent): c is ReadingContent | ReadingTNGContent {
	return "passage" in c && "items" in c
}

export const ReadingQuestion = memo(function ReadingQuestion({
	question,
	currentAnswers,
	onSelectAnswer,
}: ReadingQuestionProps) {
	const content = question.content

	const handleSelect = (itemIndex: number, optionIndex: number) => {
		onSelectAnswer(question.id, currentAnswers, itemIndex, optionIndex)
	}

	const title = "title" in content ? (content as { title?: string }).title : undefined

	return (
		<div id={question.id} className="space-y-6">
			<h3 className="text-lg font-semibold">Reading — Part {question.part}</h3>

			{title && <p className="font-bold">{title}</p>}

			{isReadingPassageContent(content) && <PassageSection passage={content.passage} />}

			{isReadingGapFillContent(content) && <PassageSection passage={content.textWithGaps} />}

			{isReadingMatchingContent(content) && <MatchingSection content={content} />}

			<div className="space-y-6">
				{isReadingPassageContent(content) &&
					content.items.map((item, i) => (
						<MCQItemRenderer
							key={`item-${i}`}
							index={i}
							stem={item.stem}
							options={item.options}
							selectedOption={currentAnswers[String(i + 1)] ?? null}
							onSelect={handleSelect}
						/>
					))}

				{isReadingGapFillContent(content) &&
					content.items.map((item, i) => (
						<MCQItemRenderer
							key={`gap-${i}`}
							index={i}
							stem={`Gap ${i + 1}`}
							options={item.options}
							selectedOption={currentAnswers[String(i + 1)] ?? null}
							onSelect={handleSelect}
						/>
					))}

				{isReadingMatchingContent(content) &&
					content.paragraphs.map((para, i) => (
						<MCQItemRenderer
							key={`para-${i}`}
							index={i}
							stem={`${para.label}. ${para.text}`}
							options={content.headings}
							selectedOption={currentAnswers[String(i + 1)] ?? null}
							onSelect={handleSelect}
						/>
					))}
			</div>
		</div>
	)
})

export const PassageSection = memo(function PassageSection({ passage }: { passage: string }) {
	return (
		<div className="max-h-[400px] overflow-y-auto rounded-xl bg-muted/30 p-5">
			<div className="prose prose-sm whitespace-pre-line">{passage}</div>
		</div>
	)
})

export const MatchingSection = memo(function MatchingSection({
	content,
}: {
	content: ReadingMatchingContent
}) {
	return (
		<div className="max-h-[400px] overflow-y-auto rounded-xl bg-muted/30 p-5">
			<div className="prose prose-sm space-y-4">
				{content.paragraphs.map((para) => (
					<div key={para.label}>
						<span className="font-semibold">{para.label}.</span>{" "}
						<span className="whitespace-pre-line">{para.text}</span>
					</div>
				))}
			</div>
		</div>
	)
})
