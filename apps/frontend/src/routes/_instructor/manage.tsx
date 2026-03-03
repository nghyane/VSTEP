import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_instructor/manage")({
	component: InstructorDashboard,
})

function InstructorDashboard() {
	return (
		<div>
			<h1 className="text-2xl font-semibold tracking-tight">Instructor Dashboard</h1>
			<p className="mt-1 text-muted-foreground">Quản lý đề thi và chấm bài</p>
		</div>
	)
}
