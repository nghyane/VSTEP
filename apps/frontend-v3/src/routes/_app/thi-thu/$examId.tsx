import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useMemo, useState } from "react"
import { Header } from "#/components/Header"
import { Loading } from "#/components/Loading"
import { BottomActionBar } from "#/features/exam/components/BottomActionBar"
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
		<>
			{/* Scrollable content area — flex-1 fills remaining main height, overflow-auto scrolls internally */}
			<div className="px-10 flex-1 overflow-auto">
				<div className="space-y-8">
					<ExamDetailHeader detail={detail} />
					<SectionSelector detail={detail} selected={selected} onToggleSkill={onToggleSkill} />
				</div>

				{historySessions.length > 0 && (
					<div className="mt-12 space-y-4 pb-12">
						<h2 className="font-extrabold text-lg text-foreground">
							Lịch sử làm bài ({historySessions.length} lần)
						</h2>
						<div className="card p-0 overflow-hidden">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border-light text-left text-xs text-subtle font-medium">
										<th className="py-3 px-4">Lần</th>
										<th className="py-3 px-4">Ngày nộp</th>
										<th className="py-3 px-4">Kỹ năng</th>
										<th className="py-3 px-4">Điểm</th>
										<th className="py-3 px-4 text-right" />
									</tr>
								</thead>
								<tbody>
									{historySessions.map((s, idx) => {
										const score = avgSkillScores(s.scores)
										const isPending = s.status === "submitted" && score === null
										return (
											<tr
												key={s.id}
												className="border-b border-border-light last:border-b-0 hover:bg-background/60 transition-colors"
											>
												<td className="py-3 px-4 tabular-nums font-medium text-foreground">
													{historySessions.length - idx}
												</td>
												<td className="py-3 px-4 text-subtle tabular-nums whitespace-nowrap">
													{s.submitted_at ? formatDate(s.submitted_at) : "—"}
												</td>
												<td className="py-3 px-4 text-muted font-medium">{getSkillLabel(s)}</td>
												<td className="py-3 px-4">
													{isPending ? (
														<span className="text-xs text-subtle italic">Đang chấm...</span>
													) : score !== null ? (
														<span className="font-bold text-primary tabular-nums">
															{formatVstepBand(score)}
														</span>
													) : (
														<span className="text-xs text-subtle">—</span>
													)}
												</td>
												<td className="py-3 px-4 text-right">
													<Link
														to="/phong-thi/$sessionId/chi-tiet"
														params={{ sessionId: s.id }}
														search={{ examId }}
														className="btn btn-secondary text-xs py-1.5 px-3"
													>
														Xem kết quả
													</Link>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>

			{/* Sticky bottom bar — sibling to scroll area, always visible at bottom */}
			<BottomActionBar detail={detail} selected={selected} />
		</>
	)
}
