import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_focused/exam")({
	component: ExamPage,
})

function ExamPage() {
	return (
		<div>
			<h1 className="text-xl font-semibold">Listening — Part 1</h1>
			<p className="mt-1 text-muted-foreground">Nghe và chọn đáp án đúng</p>
		</div>
	)
}
