import type { AssessmentFeedback, Improvement } from "#/features/grading/types"

export function feedbackImprovements(
	feedback: AssessmentFeedback | null | undefined,
): Array<Improvement | string> {
	const improvements = feedback?.improvements ?? []
	if (improvements.length > 0) return improvements

	const evidenceNotes = feedback?.evidenceNotes
	if (!evidenceNotes) return []
	if (Array.isArray(evidenceNotes)) return evidenceNotes

	return Object.values(evidenceNotes).map((entry) => ({
		message: entry.label,
		explanation: entry.detail,
	}))
}
