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
	total_duration_minutes: number
	is_published: boolean
}
