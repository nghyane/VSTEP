import {
	WritingAssessmentError,
	WritingAssessmentLayout,
	WritingAssessmentPending,
} from "#/features/grading/components/WritingAssessmentLayout"
import { useWritingAssessment } from "#/features/grading/use-writing-assessment"

interface Props {
	attemptId: string
}

export function WritingResult({ attemptId }: Props) {
	const assessment = useWritingAssessment({ attemptId })

	if (assessment.status === "failed") {
		return <WritingAssessmentError message={assessment.error} />
	}

	if (assessment.status === "pending" || !assessment.result) {
		return <WritingAssessmentPending progress={assessment.progress} />
	}

	return (
		<WritingAssessmentLayout
			view={{
				result: assessment.result,
				rubric: assessment.rubric,
				context: assessment.context
					? {
							taskLabel: assessment.context.part ? `Task ${assessment.context.part}` : undefined,
							title: assessment.context.title ?? undefined,
							prompt: assessment.context.prompt ?? undefined,
							responseText: assessment.context.response_text ?? undefined,
							wordCount: assessment.context.word_count ?? undefined,
							submittedAt: assessment.context.submitted_at,
						}
					: null,
				feedback: {
					cost: assessment.feedbackCost,
					canRequest: assessment.feedbackCanRequest,
					pending: assessment.feedbackPending,
					requested: assessment.feedbackRequested,
					error: assessment.feedbackError,
					generated: assessment.feedbackGenerated,
					onRequest: assessment.requestFeedback,
				},
				teacherGrading: assessment.teacherGrading,
			}}
		/>
	)
}
