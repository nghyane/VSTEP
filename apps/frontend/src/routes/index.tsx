import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: HomePage,
})

function HomePage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<h1 className="text-2xl font-bold">VSTEP</h1>
		</div>
	)
}
