export interface PracticeExercise {
	id: string
	title: string
	part: number
	description: string | null
}

export interface PracticeSession {
	id: string
	skill: string
	exercise_id: string
	status: string
	started_at: string
}
