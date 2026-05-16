export interface StatsData {
	users_total: number
	users_today: number
	users_this_week: number
	exams_total: number
	exams_published: number
	exams_draft: number
	sessions_active: number
	sessions_today: number
	sessions_stuck: number
	grading_pending: number
	grading_failed: number
	grading_done_today: number
	vocab_topics: number
	grammar_points: number
	courses: number
}

export interface AlertItem {
	type: "error" | "warning"
	message: string
}

export interface ActionItem {
	label: string
	badge: number
}

export interface ContentStatusItem {
	type: string
	published: number
	draft: number
}

export interface ActivityItem {
	action: string
	detail: string | null
	happened_at: string
}

export interface RevenueOverview {
	topup: { today: number; week: number; month: number }
	course: { today: number; week: number; month: number }
	total: { today: number; week: number; month: number }
	pending_orders: number
}

export interface RevenueTrendRow {
	date: string
	topup_vnd: number
	course_vnd: number
	total_vnd: number
}

export interface UserGrowthRow {
	date: string
	new_users: number
	new_profiles: number
}

export interface WalletEconomy {
	coins_minted: number
	coins_spent: number
	coins_circulating: number
	topup_orders_paid: number
	topup_orders_pending: number
	topup_orders_failed: number
	top_packages: Array<{ label: string; orders: number; revenue_vnd: number }>
}

export interface PracticeActivityRow {
	date: string
	listening: number
	reading: number
	writing: number
	speaking: number
	vocab: number
	grammar: number
}

export interface GradingThroughputRow {
	date: string
	done: number
	failed: number
	pending: number
}

export interface ProfileSegments {
	total_profiles: number
	active_profiles_7d: number
	by_target_level: Array<{ level: string; count: number }>
	by_entry_level: Array<{ level: string; count: number }>
}

export interface StreakBucket {
	range: string
	count: number
}

export interface PromoStats {
	redemptions_today: number
	redemptions_week: number
	coins_granted_total: number
	top_codes: Array<{ code: string; redemptions: number; coins_total: number }>
}

export interface TopContent {
	listening: Array<{ title: string; sessions: number }>
	reading: Array<{ title: string; sessions: number }>
	writing: Array<{ title: string; sessions: number }>
	vocab: Array<{ title: string; sessions: number }>
	grammar: Array<{ title: string; sessions: number }>
}
