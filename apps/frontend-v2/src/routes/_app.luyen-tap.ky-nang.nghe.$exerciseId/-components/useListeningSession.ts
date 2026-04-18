// useListeningSession — wrapper mỏng quanh useMcqSession, thêm logic lưu progress listening.

import { saveListeningProgress } from "#/lib/practice/listening-progress"
import { type McqSession, useMcqSession } from "#/lib/practice/use-mcq-session"
import type { ListeningExercise } from "#/mocks/listening"

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
		},
	})
}
