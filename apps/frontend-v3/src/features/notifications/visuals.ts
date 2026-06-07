import type { IconName, StaticIconName } from "#/components/Icon"
import type { NotificationType } from "#/features/notifications/types"

export type NotifTone = "coin" | "warning" | "destructive" | "primary" | "info"

export interface NotifVisual {
	iconKind: "static" | "regular"
	iconName: StaticIconName | IconName
	tintClass: string
	tone: NotifTone
	navigateTo?: string
}

const VISUALS: Record<NotificationType, NotifVisual> = {
	topup_completed: {
		iconKind: "static",
		iconName: "coin",
		tintClass: "bg-coin-tint",
		tone: "coin",
		navigateTo: "/dashboard",
	},
	coin_received: {
		iconKind: "static",
		iconName: "chest",
		tintClass: "bg-coin-tint",
		tone: "coin",
		navigateTo: "/dashboard",
	},
	coin_spent: {
		iconKind: "static",
		iconName: "coin",
		tintClass: "bg-coin-tint",
		tone: "coin",
		navigateTo: "/giao-dich-xu",
	},
	assessment_completed: {
		iconKind: "static",
		iconName: "trophy",
		tintClass: "bg-warning-tint",
		tone: "warning",
		navigateTo: "/luyen-tap/ket-qua",
	},
	assessment_failed: {
		iconKind: "regular",
		iconName: "lightning",
		tintClass: "bg-destructive-tint",
		tone: "destructive",
		navigateTo: "/luyen-tap/ket-qua",
	},
	grading_completed: {
		iconKind: "static",
		iconName: "trophy",
		tintClass: "bg-warning-tint",
		tone: "warning",
		navigateTo: "/luyen-tap/ket-qua",
	},
	grading_failed: {
		iconKind: "regular",
		iconName: "lightning",
		tintClass: "bg-destructive-tint",
		tone: "destructive",
		navigateTo: "/luyen-tap/ket-qua",
	},
	course_enrolled: {
		iconKind: "regular",
		iconName: "book",
		tintClass: "bg-primary-tint",
		tone: "primary",
		navigateTo: "/khoa-hoc",
	},
	course_unenrolled: {
		iconKind: "regular",
		iconName: "trash",
		tintClass: "bg-destructive-tint",
		tone: "destructive",
		navigateTo: "/khoa-hoc",
	},
	booking_created: {
		iconKind: "regular",
		iconName: "timer",
		tintClass: "bg-info-tint",
		tone: "info",
		navigateTo: "/khoa-hoc",
	},
	booking_cancelled: {
		iconKind: "regular",
		iconName: "trash",
		tintClass: "bg-destructive-tint",
		tone: "destructive",
		navigateTo: "/khoa-hoc",
	},
	booking_rescheduled: {
		iconKind: "regular",
		iconName: "timer",
		tintClass: "bg-primary-tint",
		tone: "primary",
		navigateTo: "/khoa-hoc",
	},
	booking_meet_url_updated: {
		iconKind: "regular",
		iconName: "timer",
		tintClass: "bg-primary-tint",
		tone: "primary",
		navigateTo: "/khoa-hoc",
	},
	course_session_rescheduled: {
		iconKind: "regular",
		iconName: "book",
		tintClass: "bg-primary-tint",
		tone: "primary",
		navigateTo: "/khoa-hoc",
	},
	course_session_cancelled: {
		iconKind: "regular",
		iconName: "trash",
		tintClass: "bg-destructive-tint",
		tone: "destructive",
		navigateTo: "/khoa-hoc",
	},
	teacher_grading_completed: {
		iconKind: "static",
		iconName: "trophy",
		tintClass: "bg-warning-tint",
		tone: "warning",
		navigateTo: "/luyen-tap/ket-qua",
	},
	study_reminder: {
		iconKind: "regular",
		iconName: "timer",
		tintClass: "bg-warning-tint",
		tone: "warning",
		navigateTo: "/dashboard",
	},
}

const FALLBACK: NotifVisual = {
	iconKind: "static",
	iconName: "coin",
	tintClass: "bg-coin-tint",
	tone: "coin",
}

export function visualForType(type: string | null | undefined): NotifVisual {
	if (!type) return FALLBACK
	if (type in VISUALS) return VISUALS[type as keyof typeof VISUALS]
	return FALLBACK
}
