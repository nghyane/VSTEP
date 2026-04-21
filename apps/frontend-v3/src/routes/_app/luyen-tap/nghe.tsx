import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { practiceExercisesQuery } from "#/features/practice/queries"

export const Route = createFileRoute("/_app/luyen-tap/nghe")({
	component: ListeningPage,
})

function ListeningPage() {
	const { data, isLoading } = useQuery(practiceExercisesQuery("listening"))
	const exercises = data?.data ?? []

	return (
		<>
			<Header title="Nghe" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">3 phần · nghe hiểu · bật/tắt hỗ trợ</p>

				{isLoading ? (
					<p className="text-muted">Đang tải...</p>
				) : exercises.length === 0 ? (
					<div className="card p-10 text-center">
						<img src="/mascot/lac-listen.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
						<p className="text-sm font-bold text-subtle">Chưa có bài nghe nào</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{exercises.map((e) => (
							<div key={e.id} className="card-interactive p-5">
								<p className="text-xs font-bold text-info mb-1">Part {e.part}</p>
								<h4 className="font-bold text-base text-foreground">{e.title}</h4>
								{e.description && <p className="text-sm text-subtle mt-1">{e.description}</p>}
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}
