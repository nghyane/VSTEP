import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { speakingDrillsQuery, speakingTasksQuery } from "#/features/practice/queries"

export function SpeakingContent() {
	const { data: drillsData } = useQuery(speakingDrillsQuery)
	const { data: tasksData } = useQuery(speakingTasksQuery)

	if (!drillsData && !tasksData) return <p className="text-muted">Đang tải...</p>

	const drills = drillsData?.data ?? []
	const tasks = tasksData?.data ?? []

	return (
		<div className="space-y-8">
			<section>
				<h3 className="font-extrabold text-xl text-foreground">Drill phát âm</h3>
				<p className="text-sm text-subtle mt-0.5 mb-4">
					Luyện phát âm từng câu. AI đánh giá pronunciation score.
				</p>
				{drills.length === 0 ? (
					<div className="card p-6 text-center">
						<p className="text-sm text-subtle">Sắp ra mắt</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{drills.map((d) => (
							<ExerciseCard
								key={d.id}
								title={d.title}
								description={null}
								meta={`${d.level}${d.estimated_minutes ? ` · ${d.estimated_minutes} phút` : ""}`}
								overlay={
									<Link
										to="/speaking/drill/$drillId"
										params={{ drillId: d.id }}
										className="absolute inset-0 rounded-(--radius-card)"
									/>
								}
							/>
						))}
					</div>
				)}
			</section>

			<section>
				<h3 className="font-extrabold text-xl text-foreground">VSTEP Speaking</h3>
				<p className="text-sm text-subtle mt-0.5 mb-4">3 phần theo format VSTEP. Ghi âm + AI chấm.</p>
				{tasks.length === 0 ? (
					<div className="card p-6 text-center">
						<p className="text-sm text-subtle">Sắp ra mắt</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{tasks.map((t) => (
							<ExerciseCard
								key={t.id}
								title={t.title}
								description={null}
								meta={`Part ${t.part} · ${t.speaking_seconds}s`}
								overlay={
									<Link
										to="/speaking/task/$taskId"
										params={{ taskId: t.id }}
										className="absolute inset-0 rounded-(--radius-card)"
									/>
								}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	)
}
