import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { ReadingContent } from "#/features/practice/components/ReadingContent"

export const Route = createFileRoute("/_app/luyen-tap/doc")({
	component: ReadingPage,
})

function ReadingPage() {
	return (
		<>
			<Header title="Đọc" backTo="/luyen-tap" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">4 đoạn văn · đọc hiểu · bật/tắt hỗ trợ</p>
				<ReadingContent />
			</div>
		</>
	)
}
