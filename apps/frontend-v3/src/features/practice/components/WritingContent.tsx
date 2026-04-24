import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo } from "react"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { writingPromptsQuery } from "#/features/practice/queries"

const PARTS = [
	{
		part: 1,
		label: "Task 1 — Viết thư",
		desc: "Viết thư theo tình huống. AI chấm cấu trúc, ngữ pháp, từ vựng.",
	},
	{
		part: 2,
		label: "Task 2 — Viết luận",
		desc: "Viết luận nghị luận. AI chấm lập luận, mạch lạc, ngôn ngữ.",
	},
]

export function WritingContent() {
	const { data } = useQuery(writingPromptsQuery)
	const prompts = data ? data.data : []

	const grouped = useMemo(() => {
		const map = new Map<number, typeof prompts>()
		for (const p of prompts) {
			const list = map.get(p.part) ?? []
			list.push(p)
			map.set(p.part, list)
		}
		return map
	}, [prompts])

	if (!data) return <p className="text-muted">Đang tải...</p>

	return (
		<div className="space-y-8">
			{PARTS.map(({ part, label, desc }) => {
				const list = grouped.get(part) ?? []
				return (
					<section key={part}>
						<h3 className="font-extrabold text-xl text-foreground">{label}</h3>
						<p className="text-sm text-subtle mt-0.5 mb-4">{desc}</p>
						{list.length === 0 ? (
							<div className="card p-6 text-center">
								<p className="text-sm text-subtle">Sắp ra mắt</p>
							</div>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
								{list.map((p) => (
									<ExerciseCard
										key={p.id}
										title={p.title}
										description={null}
										meta={`${p.min_words}–${p.max_words} từ${p.estimated_minutes ? ` · ${p.estimated_minutes} phút` : ""}`}
										overlay={
											<Link
												to="/writing/$promptId"
												params={{ promptId: p.id }}
												className="absolute inset-0 rounded-(--radius-card)"
											/>
										}
									/>
								))}
							</div>
						)}
					</section>
				)
			})}
		</div>
	)
}
