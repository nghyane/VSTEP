export type SlotStatus = "available" | "booked_other" | "booked_me" | "past"

export interface BookingSlot {
	id: string
	starts_at: string
	duration_minutes: number
	status: SlotStatus
	meet_url: string | null
}

export interface BookingTeacher {
	id: string
	full_name: string
	title: string | null
	bio: string | null
}

export interface BookingPageData {
	teacher: BookingTeacher
	slots: BookingSlot[]
	my_bookings_count: number
}
