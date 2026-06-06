import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useState } from "react"
import { Header } from "#/components/Header"
import { StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ExamModeSelector } from "#/features/exam/components/ExamModeSelector"
import { scoreLabel, statusLabel } from "#/features/exam/components/result/helpers"
import { StartExamPanel } from "#/features/exam/components/StartExamPanel"
import { examOverviewQuery } from "#/features/exam/queries"
import type { ExamOverview, ExamSessionSummary, SkillKey } from "#/features/exam/types"
import { formatDate } from "#/lib/utils"

type ExamMode = "full" | "custom"

export const Route = createFileRoute("/_app/thi-thu/$examId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.fetchQuery({ ...examOverviewQuery(params.examId), staleTime: 0 }),
	component: ExamDetailPage,
})

function ExamDetailPage() {
	const { examId } = Route.useParams()
	const [mode, setMode] = useState<ExamMode>("full")
	const [selected, setSelected] = useState<Set<SkillKey>>(new Set())

	function handleToggleSkill(skill: SkillKey) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
			return next
		})
	}

	return (
		<>
			<Header title="Chi tiết đề thi" backTo="/thi-thu" />
			<Suspense fallback={<Loading />}>
				<ExamDetailContent
					examId={examId}
					mode={mode}
					selected={selected}
					onChangeMode={setMode}
					onToggleSkill={handleToggleSkill}
				/>
			</Suspense>
		</>
	)
}

interface ContentProps {
	examId: string
	mode: ExamMode
	selected: Set<SkillKey>
	onChangeMode: (mode: ExamMode) => void
	onToggleSkill: (skill: SkillKey) => void
}

function getSkillLabel(s: ExamSessionSummary): string {
	if (s.is_full_test || s.selected_skills.length === 4 || s.selected_skills.length === 0) return "4 kỹ năng"
	const map: Record<SkillKey, string> = {
		listening: "Nghe",
		reading: "Đọc",
		writing: "Viết",
		speaking: "Nói",
	}
	return s.selected_skills.map((k) => map[k] ?? k).join(" + ")
}

function computeStats(overview: ExamOverview) {
	const { skill_summaries: summaries } = overview
	const totalMcq = summaries.listening.item_count + summaries.reading.item_count
	const totalFreeResponse = summaries.writing.part_count + summaries.speaking.part_count
	return { totalMcq, totalFreeResponse }
}

function historyResultLabel(session: ExamSessionSummary): string {
	const summary = session.result_summary
	if (!summary) return session.status === "submitted" || session.status === "grading" ? "Đang chấm..." : "—"
	if (summary.score_status === "pending" || summary.score_status === "partial") return "Đang chấm..."
	if (summary.score_status === "failed") return statusLabel(summary.score_status)
	if (summary.skills.some((skill) => skill.status === "pending")) return "Đang chấm..."
	if (summary.skills.some((skill) => skill.status === "failed")) return statusLabel("failed")
	if (!summary.overall.applicable) return customSkillResultLabel(summary.skills)
	if (summary.overall.score_on_10 === null) return statusLabel(summary.score_status)
	return `${scoreLabel(summary.overall.score_on_10)} · ${summary.overall.result_label ?? "Không xét"}`
}

function customSkillResultLabel(skills: NonNullable<ExamSessionSummary["result_summary"]>["skills"]): string {
	const scoredSkills = skills.filter((skill) => skill.score_on_10 !== null)
	if (scoredSkills.length === 0) return "Không xếp bậc"
	return scoredSkills.map((skill) => `${skill.label} ${scoreLabel(skill.score_on_10)}`).join(" · ")
}

function ExamDetailContent({ examId, mode, selected, onChangeMode, onToggleSkill }: ContentProps) {
	const { data } = useSuspenseQuery(examOverviewQuery(examId))
	const overview = data.data

	const historySessions = overview.attempt_state.history
	const { totalMcq, totalFreeResponse } = computeStats(overview)

	return (
		<div className="px-10 pb-12">
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<div className="min-w-0 space-y-8">
					<div className="card space-y-5 p-5">
						<div>
							{overview.exam.tags.length > 0 && (
								<div className="flex flex-wrap items-center gap-2 mb-3">
									{overview.exam.tags.map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-xs font-extrabold text-subtle"
										>
											{tag}
										</span>
									))}
								</div>
							)}
							<h1 className="text-2xl font-extrabold leading-tight text-foreground md:text-3xl">
								{overview.exam.title}
							</h1>
							{overview.exam.source_school && (
								<p className="mt-1 text-sm font-bold text-muted">Nguồn: {overview.exam.source_school}</p>
							)}
						</div>

						<div className="grid grid-cols-3 gap-3">
							<MetaCell icon="timer-md" value={`${overview.exam.total_duration_minutes}`} unit="phút" />
							<MetaCell icon="clipboard-md" value={`${totalMcq}`} unit="câu trắc nghiệm" />
							<MetaCell icon="pencil-md" value={`${totalFreeResponse}`} unit="phần tự luận" />
						</div>

						<ExamModeSelector
							overview={overview}
							mode={mode}
							selected={selected}
							onChangeMode={onChangeMode}
							onToggleSkill={onToggleSkill}
						/>
					</div>

					{historySessions.length > 0 && (
						<div className="space-y-4">
							<h2 className="font-extrabold text-lg text-foreground">
								Lịch sử làm bài ({historySessions.length} lần)
							</h2>
							<div className="card overflow-hidden">
								<div className="flex items-center gap-3 px-5 py-2.5 border-b border-border-light text-xs text-subtle font-medium">
									<span className="w-8 tabular-nums">Lần</span>
									<span className="flex-1">Ngày nộp</span>
									<span className="w-28">Kỹ năng</span>
									<span className="w-28">Kết quả</span>
									<span className="w-24" />
								</div>
								{historySessions.map((s, idx) => {
									const resultLabel = historyResultLabel(s)
									return (
										<div
											key={s.id}
											className="flex items-center gap-3 px-5 py-3 border-b border-border-light last:border-b-0 hover:bg-background/60 transition-colors"
										>
											<span className="w-8 tabular-nums font-medium text-foreground">
												{historySessions.length - idx}
											</span>
											<span className="flex-1 text-subtle tabular-nums whitespace-nowrap">
												{s.submitted_at ? formatDate(s.submitted_at) : "—"}
											</span>
											<span className="w-28 truncate text-muted font-medium">{getSkillLabel(s)}</span>
											<span className="w-28 truncate">
												<span className="font-bold text-primary tabular-nums">{resultLabel}</span>
											</span>
											<span className="w-24 text-right">
												<Link
													to="/phong-thi/$sessionId"
													params={{ sessionId: s.id }}
													className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary-dark"
												>
													Xem kết quả
													<span aria-hidden="true">→</span>
												</Link>
											</span>
										</div>
									)
								})}
							</div>
						</div>
					)}
				</div>

				<div className="min-w-0">
					<StartExamPanel overview={overview} mode={mode} selected={selected} />
				</div>
			</div>
		</div>
	)
}

function MetaCell({
	icon,
	value,
	unit,
}: {
	icon: "timer-md" | "clipboard-md" | "pencil-md"
	value: string
	unit: string
}) {
	return (
		<div className="flex items-center gap-3 rounded-(--radius-card) bg-background px-4 py-3">
			<div className="flex shrink-0 items-center justify-center text-foreground/80">
				<StaticIcon name={icon} size="md" />
			</div>
			<div className="flex flex-col leading-tight">
				<span className="font-extrabold text-foreground tabular-nums text-base">{value}</span>
				<span className="text-xs text-subtle">{unit}</span>
			</div>
		</div>
	)
}
