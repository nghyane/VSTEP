import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import {
	type WritingAssessmentContext,
	WritingAssessmentError,
	WritingAssessmentLayout,
	WritingAssessmentPending,
} from "#/features/grading/components/WritingAssessmentLayout"
import { useWritingAssessment } from "#/features/grading/use-writing-assessment"
import type { WritingPromptDetail, WritingSubmission } from "#/features/practice/types"

interface Props {
	prompt: WritingPromptDetail
	submission: WritingSubmission
	responseText?: string
}

export function WritingGradingScreen({ prompt, submission, responseText }: Props) {
	const assessment = useWritingAssessment({
		attemptId: submission.attempt_id,
	})
	const context: WritingAssessmentContext = {
		taskLabel: `Task ${prompt.part}`,
		title: prompt.title,
		prompt: prompt.prompt,
		responseText,
		wordCount: submission.word_count,
		submittedAt: submission.submitted_at,
	}

	if (assessment.status === "failed") {
		return (
			<div className="flex flex-col h-screen bg-background">
				<Header prompt={prompt} />
				<ScrollArea className="flex-1">
					<div className="px-6 py-8">
						<WritingAssessmentError message={assessment.error} />
					</div>
				</ScrollArea>
			</div>
		)
	}

	if (assessment.status === "pending" || !assessment.result) {
		return (
			<div className="flex flex-col h-screen bg-background">
				<Header prompt={prompt} />
				<ScrollArea className="flex-1">
					<div className="max-w-5xl mx-auto px-6 py-8">
						<WritingAssessmentPending context={context} progress={assessment.progress} />
					</div>
				</ScrollArea>
			</div>
		)
	}

	return (
		<div className="flex flex-col h-screen bg-background">
			<Header prompt={prompt} />
			<ScrollArea className="flex-1">
				<div className="max-w-5xl mx-auto px-6 py-8">
					<WritingAssessmentLayout
						view={{
							result: assessment.result,
							rubric: assessment.rubric,
							context,
							feedback: {
								cost: assessment.feedbackCost,
								canRequest: assessment.feedbackCanRequest,
								pending: assessment.feedbackPending,
								requested: assessment.feedbackRequested,
								error: assessment.feedbackError,
								generated: assessment.feedbackGenerated,
								onRequest: assessment.requestFeedback,
							},
						}}
					/>
				</div>
			</ScrollArea>
		</div>
	)
}

function Header({ prompt }: { prompt: WritingPromptDetail }) {
	return (
		<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-3 shrink-0">
			<Link to="/luyen-tap/viet" className="p-1 hover:opacity-70 shrink-0">
				<Icon name="back" size="sm" className="text-muted" />
			</Link>
			<span className="text-[10px] font-bold text-skill-writing bg-skill-writing/15 px-1.5 py-0.5 rounded shrink-0">
				Task {prompt.part}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-foreground truncate">{prompt.title}</p>
			</div>
		</div>
	)
}
