import { queryOptions } from "@tanstack/react-query"
import { type ApiResponse, api } from "#/lib/api"
import type { BookingPageData, BookingSlot } from "./types"

export const bookingPageQuery = (courseId: string) =>
	queryOptions({
		queryKey: ["booking", courseId],
		queryFn: () => api.get(`courses/${courseId}/bookings`).json<ApiResponse<BookingPageData>>(),
		staleTime: 30_000,
	})

interface BookSlotResponse {
	booking_id: string
	slot: BookingSlot
	coins_charged: number
}

export async function bookSlot(courseId: string, slotId: string): Promise<BookSlotResponse> {
	const res = await api
		.post(`courses/${courseId}/bookings`, { json: { slot_id: slotId } })
		.json<ApiResponse<BookSlotResponse>>()
	return res.data
}
