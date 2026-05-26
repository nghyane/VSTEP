export interface AdminExam {
	id: string
	slug: string
	title: string
	source_school: string | null
	tags: string[] | null
	total_duration_minutes: number
	is_published: boolean
	version_count?: number
	active_version: {
		id: string
		version_number: number
		published_at: string | null
	} | null
	created_at: string
	updated_at: string
}

export interface ListExamsFilters {
	page?: number
	per_page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
}

export interface ExamFormInput {
	slug: string
	title: string
	source_school: string
	tags: string[]
	is_published: boolean
}

// --- Version types ---

export interface ExamVersion {
	id: string
	exam_id: string
	version_number: number
	is_active: boolean
	published_at: string | null
	created_at: string
	listening_sections?: ListeningSection[]
	reading_passages?: ReadingPassage[]
	writing_tasks?: WritingTask[]
	speaking_parts?: SpeakingPart[]
}

export interface ListeningSection {
	id: string
	part: number
	part_title: string | null
	duration_minutes: number | null
	audio_url: string | null
	display_order: number
	items: ListeningItem[]
}

export interface ListeningItem {
	id: string
	stem: string
	options: string[]
	correct_index: number
	display_order: number
}

export interface ReadingPassage {
	id: string
	part: number
	title: string | null
	duration_minutes: number | null
	passage: string
	display_order: number
	items: ReadingItem[]
}

export interface ReadingItem {
	id: string
	stem: string
	options: string[]
	correct_index: number
	display_order: number
}

export interface WritingTask {
	id: string
	part: number
	task_type: "letter" | "essay"
	duration_minutes: number | null
	prompt: string
	min_words: number | null
	instructions: string[] | null
	display_order: number
}

export interface SpeakingPart {
	id: string
	part: number
	type: string
	duration_minutes: number | null
	speaking_seconds: number | null
	content: Record<string, unknown>
	display_order: number
}
