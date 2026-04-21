import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Header } from "#/components/Header"
import { grammarPointsQuery } from "#/features/grammar/queries"

export const Route = createFileRoute("/_app/luyen-tap/ngu-phap/")({
	component: GrammarPage,
})

function GrammarPage() {
	const { data } = useQuery(grammarPointsQuery)

	if (!data) return <Header title="Ngữ pháp" />

	const points = data.data

	return (
		<>
			<Header title="Ngữ pháp" />
			<div className="px-10 pb-12">
				<p className="text-sm text-subtle mb-5">Cấu trúc câu theo level · Luyện tập + VSTEP tips</p>

				{points.length === 0 ? (
					<div className="card p-10 text-center">
						<img src="/mascot/lac-think.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
						<p className="text-sm font-bold text-subtle">Chưa có bài ngữ pháp nào</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{points.map((p) => (
							<Link key={p.id} to="/luyen-tap/ngu-phap/$pointId" params={{ pointId: p.id }} className="card-interactive p-5">
								<h4 className="font-bold text-base text-foreground">{p.name}</h4>
								{p.vietnamese_name && (
									<p className="text-sm text-muted mt-0.5">{p.vietnamese_name}</p>
								)}
								{p.summary && (
									<p className="text-sm text-subtle mt-2 line-clamp-2">{p.summary}</p>
								)}
								<div className="flex flex-wrap gap-1.5 mt-3">
									{p.levels.map((lv) => (
										<span key={lv} className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">{lv}</span>
									))}
									{p.tasks.map((t) => (
										<span key={t} className="text-xs text-muted bg-background px-2 py-0.5 rounded-full">{t}</span>
									))}
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</>
	)
}
