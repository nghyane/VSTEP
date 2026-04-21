import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { grammarPointsQuery } from "#/features/grammar/queries"

export const Route = createFileRoute("/_app/luyen-tap/ngu-phap")({
	component: GrammarPage,
})

function GrammarPage() {
	const { data, isLoading } = useQuery(grammarPointsQuery)
	const points = data?.data ?? []

	return (
		<>
			<Header title="Ngữ pháp" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">Cấu trúc câu gắn level A2–C1</p>

				{isLoading ? (
					<p className="text-muted">Đang tải...</p>
				) : points.length === 0 ? (
					<div className="card p-10 text-center">
						<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
						<p className="text-sm font-bold text-subtle">Chưa có bài ngữ pháp nào</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{points.map((p) => (
							<Link key={p.id} to="/luyen-tap/ngu-phap" className="card-interactive p-5">
								<div className="flex items-center justify-between mb-2">
									<h4 className="font-bold text-base text-foreground">{p.name}</h4>
									<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full shrink-0 ml-2">{p.level}</span>
								</div>
								{p.description && <p className="text-sm text-subtle line-clamp-2">{p.description}</p>}
							</Link>
						))}
					</div>
				)}
			</div>
		</>
	)
}
