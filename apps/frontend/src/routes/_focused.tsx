import { createFileRoute } from "@tanstack/react-router"
import { FocusedLayout } from "@/components/layouts/FocusedLayout"

export const Route = createFileRoute("/_focused")({
	component: FocusedLayout,
})
