import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { listeningExercisesQuery } from "#/features/practice/queries"

export const Route = createFileRoute("/_app/luyen-tap/nghe/")({
	component: ListeningPage,
})

function ListeningPage() {
	const { data } = useQuery(listeningExercisesQuery)

	if (!data) return <Header title="Nghe" />

	const exercises = data.data

	return (
		<>
			<Header title="Nghe" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">3 phần · nghe hiểu · bật/tắt hỗ trợ</p>

				{exercises.length === 0 ? (
					<div className="card p-10 text-center">
						<img src="/mascot/lac-listen.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
						<p className="text-sm font-bold text-subtle">Chưa có bài nghe nào</p>
					</div>
				) : (
					<div className="space-y-8">
						{[1, 2, 3].map((part) => {
							const partExercises = exercises.filter((e) => e.part === part)
							if (partExercises.length === 0) return null
							return (
								<section key={part}>
									<h3 className="font-bold text-lg text-foreground mb-3">Part {part}</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{partExercises.map((e) => (
											<Link key={e.id} to="/luyen-tap/nghe/$exerciseId" params={{ exerciseId: e.id }} className="card-interactive p-5">
												<h4 className="font-bold text-base text-foreground">{e.title}</h4>
												{e.description && <p className="text-sm text-subtle mt-1 line-clamp-2">{e.description}</p>}
												{e.estimated_minutes && <p className="text-xs text-muted mt-2">~{e.estimated_minutes} phút</p>}
											</Link>
										))}
									</div>
								</section>
							)
						})}
					</div>
				)}
			</div>
		</>
	)
}
