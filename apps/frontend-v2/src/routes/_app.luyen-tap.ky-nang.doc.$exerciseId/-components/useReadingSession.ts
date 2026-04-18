// useReadingSession — wrapper mỏng quanh useMcqSession, lưu reading progress.

import { saveReadingProgress } from "#/features/practice/lib/reading-progress"
import { type McqSession, useMcqSession } from "#/features/practice/lib/use-mcq-session"
import type { ReadingExercise } from "#/mocks/reading"

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
		},
	})
}
