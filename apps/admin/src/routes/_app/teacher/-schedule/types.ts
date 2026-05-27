import type { TeacherSlotItem } from "#/features/teacher/queries"

export type EventKind = "all" | "class" | "slot"
export type ScheduleEvent = ClassScheduleEvent | SlotScheduleEvent

export interface ClassScheduleEvent {
	id: string
	kind: "class"
	date: string
	start: string
	end: string
	courseId: string | null
	courseTitle: string
	topic: string
	sessionNumber: number
	meetUrl: string | null
}

export interface SlotScheduleEvent {
	id: string
	kind: "slot"
	date: string
	start: string
	end: string
	courseId: string | null
	courseTitle: string
	studentName: string | null
	status: TeacherSlotItem["status"]
	meetUrl: string | null
}
