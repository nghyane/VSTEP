// useReadingSession — wrapper mỏng quanh useMcqSession, lưu reading progress.

import { saveReadingProgress } from "#/lib/practice/reading-progress"
import { type McqSession, useMcqSession } from "#/lib/practice/use-mcq-session"
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
