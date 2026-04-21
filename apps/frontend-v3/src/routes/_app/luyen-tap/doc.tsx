import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { readingExercisesQuery } from "#/features/practice/queries"

export const Route = createFileRoute("/_app/luyen-tap/doc")({
	component: ReadingPage,
})

function ReadingPage() {
	const { data } = useQuery(readingExercisesQuery)

	if (!data) return <Header title="Đọc" />

	const exercises = data.data

	return (
		<>
			<Header title="Đọc" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">4 đoạn văn · đọc hiểu · bật/tắt hỗ trợ</p>

				{exercises.length === 0 ? (
					<div className="card p-10 text-center">
						<img src="/mascot/lac-read.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
						<p className="text-sm font-bold text-subtle">Chưa có bài đọc nào</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{exercises.map((e) => (
							<div key={e.id} className="card-interactive p-5">
								<p className="text-xs font-bold text-skill-reading mb-1">Part {e.part}</p>
								<h4 className="font-bold text-base text-foreground">{e.title}</h4>
								{e.description && <p className="text-sm text-subtle mt-1">{e.description}</p>}
								{e.estimated_minutes && (
									<p className="text-xs text-muted mt-2">~{e.estimated_minutes} phút</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</>
	)
}
