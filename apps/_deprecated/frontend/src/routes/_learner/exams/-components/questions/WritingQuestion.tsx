import { memo, useMemo } from "react"
import type { QuestionContent, SessionQuestion, WritingContent } from "@/types/api"

function isWritingContent(content: QuestionContent): content is WritingContent {
	return "prompt" in content && "taskType" in content
}

interface WritingQuestionProps {
	question: SessionQuestion
	currentText: string
	onUpdateText: (questionId: string, text: string) => void
}

export const WritingQuestion = memo(function WritingQuestion({
	question,
	currentText,
	onUpdateText,
}: WritingQuestionProps) {
	const content = question.content
	const isWriting = isWritingContent(content)

	const wordCount = useMemo(
		() => currentText.trim().split(/\s+/).filter(Boolean).length,
		[currentText],
	)

	if (!isWriting) return null

	const taskLabel = content.taskType === "letter" ? "Letter" : "Essay"

	return (
		<div id={question.id} className="space-y-5">
			<div className="flex items-center gap-3">
				<h3 className="text-lg font-semibold">Writing — Part {question.part}</h3>
				<span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
					{taskLabel}
				</span>
			</div>

			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line">{content.prompt}</p>
			</div>

			{content.instructions && content.instructions.length > 0 && (
				<ol className="list-decimal space-y-1 pl-6 text-sm">
					{content.instructions.map((instruction, i) => (
						<li key={`ins-${i}`}>{instruction}</li>
					))}
				</ol>
			)}

			{content.requiredPoints && content.requiredPoints.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm font-medium">Yêu cầu:</p>
					<ul className="list-disc space-y-1 pl-6 text-sm">
						{content.requiredPoints.map((point, i) => (
							<li key={`pt-${i}`}>{point}</li>
						))}
					</ul>
				</div>
			)}

			<p className="text-sm text-muted-foreground">Tối thiểu {content.minWords} từ</p>

			<textarea
				value={currentText}
				onChange={(e) => onUpdateText(question.id, e.target.value)}
				className="w-full min-h-[300px] rounded-xl border border-border p-4 text-sm focus:border-primary focus:outline-none resize-y"
				placeholder="Viết bài của bạn tại đây..."
			/>

			<p
				className={
					wordCount >= content.minWords ? "text-sm text-green-600" : "text-sm text-muted-foreground"
				}
			>
				{wordCount}/{content.minWords} từ
			</p>
		</div>
	)
})

export const WritingPromptSection = memo(function WritingPromptSection({
	content,
}: {
	content: WritingContent
}) {
	return (
		<div className="space-y-4">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line">{content.prompt}</p>
			</div>

			{content.instructions && content.instructions.length > 0 && (
				<ol className="list-decimal space-y-1 pl-6 text-sm">
					{content.instructions.map((instruction, i) => (
						<li key={`ins-${i}`}>{instruction}</li>
					))}
				</ol>
			)}

			{content.requiredPoints && content.requiredPoints.length > 0 && (
				<div className="space-y-1">
					<p className="text-sm font-medium">Yêu cầu:</p>
					<ul className="list-disc space-y-1 pl-6 text-sm">
						{content.requiredPoints.map((point, i) => (
							<li key={`pt-${i}`}>{point}</li>
						))}
					</ul>
				</div>
			)}

			<p className="text-sm text-muted-foreground">Tối thiểu {content.minWords} từ</p>
		</div>
	)
})
