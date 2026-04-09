import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: IndexPage,
})

function IndexPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="text-4xl font-bold">VSTEP</h1>
				<p className="mt-2 text-muted-foreground">Exam practice platform</p>
			</div>
		</div>
	)
}
