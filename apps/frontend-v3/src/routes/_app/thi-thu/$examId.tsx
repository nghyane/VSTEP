import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useMemo, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { DurationPanel } from "#/features/exam/components/DurationPanel"
import { ExamDetailHeader } from "#/features/exam/components/ExamDetailHeader"
import { SectionSelector } from "#/features/exam/components/SectionSelector"
import { examDetailQuery, mySessionsQuery } from "#/features/exam/queries"
import type { ExamSessionSummary, SkillKey } from "#/features/exam/types"
import { avgSkillScores, formatDate, formatVstepBand } from "#/lib/utils"

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
	const map: Record<string, string> = {
		listening: "L",
		reading: "R",
		writing: "W",
		speaking: "S",
	}
	return s.selected_skills.map((k) => map[k] ?? k).join("+")
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

	return (
		<div className="px-10 flex-1 overflow-auto">
			<div className="flex gap-8">
				{/* LEFT: content */}
				<div className="flex-1 min-w-0 space-y-8 pb-12">
					<ExamDetailHeader detail={detail} />
					<SectionSelector detail={detail} selected={selected} onToggleSkill={onToggleSkill} />

					{/* Tip */}
					{selected.size > 0 && selected.size < 4 && (
						<div className="flex items-center gap-2 text-sm text-muted bg-background rounded-(--radius-card) px-4 py-3 border border-border">
							<Icon name="lightning" size="xs" className="shrink-0 text-warning" />
							<span>
								Mẹo: Chọn 1–2 kỹ năng để luyện tập trung vào điểm yếu của bạn. Chọn tất cả 4 kỹ năng để làm
								full test.
							</span>
						</div>
					)}

					{historySessions.length > 0 && (
						<div className="space-y-4">
							<h2 className="font-extrabold text-lg text-foreground">
								Lịch sử làm bài ({historySessions.length} lần)
							</h2>
							<div className="card overflow-hidden">
								{/* Header row */}
								<div className="flex items-center gap-3 px-5 py-2.5 border-b border-border-light text-xs text-subtle font-medium">
									<span className="w-8 tabular-nums">Lần</span>
									<span className="flex-1">Ngày nộp</span>
									<span className="w-12">Kỹ năng</span>
									<span className="w-16">Điểm</span>
									<span className="w-24" />
								</div>
								{/* Data rows */}
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

				{/* RIGHT: duration panel */}
				<div className="w-80 shrink-0">
					<DurationPanel detail={detail} selected={selected} />
				</div>
			</div>
		</div>
	)
}
