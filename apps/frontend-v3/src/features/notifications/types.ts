export interface Notification {
	id: string
	type: string
	title: string
	body: string | null
	icon_key: string | null
	read_at: string | null
	created_at: string
}

export interface UnreadCount {
	count: number
}

export interface ReadAllResult {
	marked: number
}
