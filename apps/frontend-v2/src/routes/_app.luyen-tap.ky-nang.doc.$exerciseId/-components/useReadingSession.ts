// useReadingSession — wrapper mỏng quanh useMcqSession, lưu reading progress.

import type { ReadingExercise } from "#/lib/mock/reading"
import { saveReadingProgress } from "#/lib/practice/reading-progress"
import { type McqSession, useMcqSession } from "#/lib/practice/use-mcq-session"
import { recordPracticeCompletion } from "#/lib/streak/streak-rewards"

export function useReadingSession(exercise: ReadingExercise): McqSession {
	return useMcqSession({
		items: exercise.items,
		onComplete: ({ score, total }) => {
			saveReadingProgress(exercise.id, {
				status: "completed",
				score,
				total,
				lastAttemptAt: Date.now(),
			})
			recordPracticeCompletion()
		},
	})
}
