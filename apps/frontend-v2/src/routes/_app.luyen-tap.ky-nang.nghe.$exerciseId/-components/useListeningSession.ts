// useListeningSession — wrapper mỏng quanh useMcqSession, thêm logic lưu progress listening.

import type { ListeningExercise } from "#/lib/mock/listening"
import { saveListeningProgress } from "#/lib/practice/listening-progress"
import { type McqSession, useMcqSession } from "#/lib/practice/use-mcq-session"
import { recordPracticeCompletion } from "#/lib/streak/streak-rewards"

export function useListeningSession(exercise: ListeningExercise): McqSession {
	return useMcqSession({
		items: exercise.items,
		onComplete: ({ score, total }) => {
			saveListeningProgress(exercise.id, {
				status: "completed",
				score,
				total,
				lastAttemptAt: Date.now(),
			})
			recordPracticeCompletion()
		},
	})
}
