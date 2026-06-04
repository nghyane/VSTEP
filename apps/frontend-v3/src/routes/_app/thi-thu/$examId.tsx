import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useMemo, useState } from "react"
import { Header } from "#/components/Header"
import { StaticIcon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { SkillIcon } from "#/components/SkillIcon"
import { DurationPanel } from "#/features/exam/components/DurationPanel"
import { examDetailQuery, mySessionsQuery } from "#/features/exam/queries"
import { getSkillTotals } from "#/features/exam/section-rows"
import type { ExamDetail, ExamSessionSummary, SkillKey } from "#/features/exam/types"
import { skills } from "#/lib/skills"
import { avgSkillScores, cn, formatDate, formatVstepBand } from "#/lib/utils"

const SKILL_ORDER: SkillKey[] = ["listening", "reading", "writing", "speaking"]

export const Route = createFileRoute("/_app/thi-thu/$examId")({
	loader: ({ context: { queryClient }, params }) =>
		Promise.all([
			queryClient.ensureQueryData(examDetailQuery(params.examId)),
			queryClient.ensureQueryData(mySessionsQuery),
		]),
	component: ExamDetailPage,
})

function ExamDetailPage() {
	const { examId } = Route.useParams()
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
				<ExamDetailContent examId={examId} selected={selected} onToggleSkill={handleToggleSkill} />
			</Suspense>
		</>
	)
}

interface ContentProps {
	examId: string
	selected: Set<SkillKey>
	onToggleSkill: (skill: SkillKey) => void
}

function getSkillLabel(s: ExamSessionSummary): string {
	if (s.is_full_test || s.selected_skills.length === 4) return "Full"
	if (s.selected_skills.length === 0) return "Full"
	const map: Record<string, string> = { listening: "L", reading: "R", writing: "W", speaking: "S" }
	return s.selected_skills.map((k) => map[k] ?? k).join("+")
}

function computeStats(detail: ExamDetail) {
	const { version } = detail
	const totalMcq =
		version.listening_sections.reduce((s, x) => s + x.items.length, 0) +
		version.reading_passages.reduce((s, x) => s + x.items.length, 0)
	const totalFreeResponse = version.writing_tasks.length + version.speaking_parts.length
	return { totalMcq, totalFreeResponse }
}

function ExamDetailContent({ examId, selected, onToggleSkill }: ContentProps) {
	const { data } = useSuspenseQuery(examDetailQuery(examId))
	const { data: sessionsData } = useSuspenseQuery(mySessionsQuery)
	const detail = data.data

	const examSessions = useMemo(() => {
		return sessionsData.data
			.filter((s) => s.exam_id === examId)
			.sort(
				(a, b) =>
					new Date(b.submitted_at ?? b.started_at).getTime() -
					new Date(a.submitted_at ?? a.started_at).getTime(),
			)
	}, [sessionsData, examId])

	const historySessions = examSessions.filter((s) => s.status !== "active")
	const { totalMcq, totalFreeResponse } = computeStats(detail)

	const statusLabel =
		selected.size === 0 ? "Chưa chọn — sẽ làm full test" : `${selected.size} kỹ năng đã chọn`

	return (
		<div className="px-10 pb-12">
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
				<div className="min-w-0 space-y-8">
					<div className="card space-y-5 p-5">
						<div>
							{detail.exam.tags.length > 0 && (
								<div className="flex flex-wrap items-center gap-2 mb-3">
									{detail.exam.tags.map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-xs font-extrabold text-subtle"
										>
											{tag}
										</span>
									))}
								</div>
							)}
							<h1 className="font-display text-2xl leading-tight text-foreground md:text-3xl">
								{detail.exam.title}
							</h1>
							{detail.exam.source_school && (
								<p className="mt-1 text-sm font-bold text-muted">Nguồn: {detail.exam.source_school}</p>
							)}
						</div>

						<div className="grid grid-cols-3 gap-3">
							<MetaCell icon="timer-md" value={`${detail.exam.total_duration_minutes}`} unit="phút" />
							<MetaCell icon="clipboard-md" value={`${totalMcq}`} unit="câu trắc nghiệm" />
							<MetaCell icon="pencil-md" value={`${totalFreeResponse}`} unit="phần tự luận" />
						</div>

						<div className="border-t border-border-light pt-5">
							<div className="flex items-center justify-between gap-4 mb-3">
								<div>
									<span className="text-sm font-extrabold text-foreground">Chọn kỹ năng luyện tập</span>
									<p className="mt-0.5 text-xs text-subtle">Để trống để làm full test.</p>
								</div>
								<span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-bold text-subtle">
									{statusLabel}
								</span>
							</div>

							<div className="divide-y divide-border-light rounded-(--radius-card) border border-border">
								{SKILL_ORDER.map((skill) => {
									const skillDef = skills.find((s) => s.key === skill)
									const isSelected = selected.has(skill)
									const { minutes, countLabel } = getSkillTotals(skill, detail)

									return (
										<label
											key={skill}
											className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
										>
											<input
												type="checkbox"
												className="sr-only"
												checked={isSelected}
												onChange={() => onToggleSkill(skill)}
												aria-label={skillDef?.label}
											/>
											{skillDef && <SkillIcon name={skillDef.pngIcon} size="xs" />}
											<span className="min-w-0 flex-1 text-sm font-bold text-foreground">
												{skillDef?.label}
											</span>
											<span className="shrink-0 text-xs tabular-nums text-subtle">
												{minutes} phút · {countLabel}
											</span>
											<div
												className={cn(
													"flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
													isSelected ? "border-primary bg-primary" : "border-border bg-surface",
												)}
											>
												{isSelected && <CheckMark />}
											</div>
										</label>
									)
								})}
							</div>
						</div>
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
									<span className="w-12">Kỹ năng</span>
									<span className="w-16">Điểm</span>
									<span className="w-24" />
								</div>
								{historySessions.map((s, idx) => {
									const score = avgSkillScores(s.scores)
									const isPending = s.status === "submitted" && score === null
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
											<span className="w-12 text-muted font-medium">{getSkillLabel(s)}</span>
											<span className="w-16">
												{isPending ? (
													<span className="text-xs text-subtle italic">Đang chấm...</span>
												) : score !== null ? (
													<span className="font-bold text-primary tabular-nums">
														{formatVstepBand(score)}
													</span>
												) : (
													<span className="text-xs text-subtle">—</span>
												)}
											</span>
											<span className="w-24 text-right">
												<Link
													to="/phong-thi/$sessionId/chi-tiet"
													params={{ sessionId: s.id }}
													search={{ examId }}
													className="btn btn-secondary text-xs py-1.5 px-3"
												>
													Xem kết quả
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
					<DurationPanel detail={detail} selected={selected} />
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
		<div className="flex items-center gap-2.5 rounded-(--radius-card) bg-background px-4 py-3">
			<StaticIcon name={icon} size="sm" />
			<div className="flex flex-col leading-tight">
				<span className="font-extrabold text-foreground tabular-nums text-base">{value}</span>
				<span className="text-xs text-subtle">{unit}</span>
			</div>
		</div>
	)
}

function CheckMark() {
	return (
		<svg
			viewBox="0 0 12 10"
			className="h-3 w-3 text-white"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="1,5 4.5,8.5 11,1" />
		</svg>
	)
}
