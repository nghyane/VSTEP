import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import { mockShadowingLessons } from "#/features/practice/mock-shadowing"
import { conversationScenariosQuery } from "#/features/practice/queries"

export function SpeakingContent() {
	const { data: scenariosData } = useQuery(conversationScenariosQuery)
	const scenarios = scenariosData?.data ?? []

	return (
		<div className="space-y-8">
			<section>
				<h3 className="font-extrabold text-xl text-foreground">Shadowing</h3>
				<p className="text-sm text-subtle mt-0.5 mb-4">
					Nghe và nhại theo từng câu. AI đánh giá độ chính xác từng từ.
				</p>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{mockShadowingLessons.map((l) => (
						<ExerciseCard
							key={l.id}
							title={l.title}
							description={null}
							level={l.level}
							meta={`${l.segment_count} đoạn · ${l.estimated_minutes ?? "?"} phút`}
							overlay={
								<Link
									to="/speaking/shadowing/$lessonId"
									params={{ lessonId: l.id }}
									className="absolute inset-0 rounded-(--radius-card)"
								/>
							}
						/>
					))}
				</div>
			</section>

			<section>
				<h3 className="font-extrabold text-xl text-foreground">Hội thoại AI</h3>
				<p className="text-sm text-subtle mt-0.5 mb-4">
					Roleplay với nhân vật AI. AI phản hồi tự nhiên + chấm từng lượt nói.
				</p>
				{scenarios.length === 0 ? (
					<div className="card p-6 text-center">
						<p className="text-sm text-subtle">Đang tải...</p>
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{scenarios.map((s) => (
							<ExerciseCard
								key={s.id}
								title={s.title}
								description={s.description}
								level={s.level}
								meta={`${s.character_name} · ${s.estimated_minutes} phút`}
								overlay={
									<Link
										to="/speaking/conversation/$scenarioId"
										params={{ scenarioId: s.id }}
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
