import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ExerciseCard } from "#/features/practice/components/ExerciseCard"
import {
	type Level,
	SpeakingFilters,
	type StatusFilter,
} from "#/features/practice/components/SpeakingFilters"
import {
	conversationHistoryQuery,
	conversationScenariosQuery,
	shadowingLessonsQuery,
} from "#/features/practice/queries"
import { shadowingProgressQuery } from "#/features/practice/shadowing-progress"
import type { ShadowingLesson } from "#/features/practice/types"

export function SpeakingContent() {
	const { data: scenariosData } = useQuery(conversationScenariosQuery)
	const { data: historyData } = useQuery(conversationHistoryQuery)
	const { data: shadowingData } = useQuery(shadowingProgressQuery)
	const { data: lessonsData } = useQuery(shadowingLessonsQuery)
	const scenarios = scenariosData?.data ?? []
	const shadowingLessons = lessonsData?.data ?? []
	const shadowingProgress = shadowingData?.data ?? {}

	const [level, setLevel] = useState<Level | null>(null)
	const [status, setStatus] = useState<StatusFilter>("Tất cả")

	const completedScenarios = useMemo(() => {
		const set = new Set<string>()
		for (const item of historyData?.data ?? []) set.add(item.scenario.id)
		return set
	}, [historyData])

	const filteredShadowing = useMemo(() => {
		return shadowingLessons.filter((l) => {
			if (level && l.level.toUpperCase() !== level) return false
			if (status === "Tất cả") return true
			const doneCount = new Set((shadowingProgress[l.id] ?? []).map((p) => p.segment_index)).size
			const pct = l.segment_count > 0 ? Math.round((doneCount / l.segment_count) * 100) : 0
			if (status === "Chưa làm") return doneCount === 0
			if (status === "Đang làm") return doneCount > 0 && pct < 100
			return pct >= 100
		})
	}, [shadowingLessons, level, status, shadowingProgress])

	const filteredScenarios = useMemo(() => {
		return scenarios.filter((s) => {
			if (level && s.level.toUpperCase() !== level) return false
			if (status === "Tất cả") return true
			const done = completedScenarios.has(s.id)
			if (status === "Chưa làm") return !done
			return done
		})
	}, [scenarios, level, status, completedScenarios])

	return (
		<div className="space-y-6">
			<SpeakingFilters level={level} status={status} onLevelChange={setLevel} onStatusChange={setStatus} />
			<ShadowingSection lessons={filteredShadowing} progress={shadowingProgress} />
			<ConversationSection scenarios={filteredScenarios} completed={completedScenarios} />
		</div>
	)
}

function ShadowingSection({
	lessons,
	progress,
}: {
	lessons: ShadowingLesson[]
	progress: Record<string, { segment_index: number }[]>
}) {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">Shadowing</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">
				Nghe và nhại theo từng câu. AI đánh giá độ chính xác từng từ.
			</p>
			{lessons.length === 0 ? (
				<div className="card p-6 text-center">
					<p className="text-sm text-subtle">Không có bài nào phù hợp</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{lessons.map((l) => {
						const doneCount = new Set((progress[l.id] ?? []).map((p) => p.segment_index)).size
						const total = l.segment_count
						const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
						return (
							<ExerciseCard
								key={l.id}
								title={l.title}
								description={null}
								level={l.level}
								meta={`${l.segment_count} đoạn · ${l.estimated_minutes ?? "?"} phút`}
								progress={
									doneCount > 0
										? { status: pct >= 100 ? "completed" : "in_progress", score: doneCount, total }
										: undefined
								}
								overlay={
									<Link
										to="/speaking/shadowing/$lessonId"
										params={{ lessonId: l.id }}
										className="absolute inset-0 rounded-(--radius-card)"
									/>
								}
							/>
						)
					})}
				</div>
			)}
		</section>
	)
}

function ConversationSection({
	scenarios,
	completed,
}: {
	scenarios: {
		id: string
		title: string
		description: string
		level: string
		character_name: string
		estimated_minutes: number
	}[]
	completed: Set<string>
}) {
	return (
		<section>
			<h3 className="font-extrabold text-xl text-foreground">Hội thoại AI</h3>
			<p className="text-sm text-subtle mt-0.5 mb-4">
				Roleplay với nhân vật AI. AI phản hồi tự nhiên + chấm từng lượt nói.
			</p>
			{scenarios.length === 0 ? (
				<div className="card p-6 text-center">
					<p className="text-sm text-subtle">Không có bài nào phù hợp</p>
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
							tag={completed.has(s.id) ? "Đã luyện" : undefined}
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
	)
}
