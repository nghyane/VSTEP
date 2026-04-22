import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { WritingContent } from "#/features/practice/components/WritingContent"

export const Route = createFileRoute("/_app/luyen-tap/viet")({
	component: WritingPage,
})

function WritingPage() {
	return (
		<>
			<Header title="Viết" backTo="/luyen-tap" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">Thư + luận · AI chấm theo rubric Bộ GD</p>
				<WritingContent />
			</div>
		</>
	)
}
