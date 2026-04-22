import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { ListeningContent } from "#/features/practice/components/ListeningContent"

export const Route = createFileRoute("/_app/luyen-tap/nghe/")({
	component: ListeningPage,
})

function ListeningPage() {
	return (
		<>
			<Header title="Nghe" backTo="/luyen-tap" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">3 phần · nghe hiểu · bật/tắt hỗ trợ</p>
				<ListeningContent />
			</div>
		</>
	)
}
