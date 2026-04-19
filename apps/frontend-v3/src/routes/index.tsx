import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
	component: HomePage,
})

function HomePage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-ink-100">
			<div className="text-center">
				<h1 className="font-display text-5xl text-brand">VSTEP</h1>
				<p className="mt-3 text-lg text-ink-500">Frontend v3 · Ready</p>
			</div>
		</div>
	)
}
