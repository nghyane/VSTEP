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
	booking_created: {
		iconKind: "regular",
		iconName: "timer",
		tintClass: "bg-info-tint",
		tone: "info",
		navigateTo: "/khoa-hoc",
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
	return VISUALS[type as NotificationType] ?? FALLBACK
}
