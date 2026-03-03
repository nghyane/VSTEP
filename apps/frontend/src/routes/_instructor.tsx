import { createFileRoute } from "@tanstack/react-router"
import { InstructorLayout } from "@/components/layouts/InstructorLayout"

export const Route = createFileRoute("/_instructor")({
	component: InstructorLayout,
})
