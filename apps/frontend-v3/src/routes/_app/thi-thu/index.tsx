import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useMemo, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { SegmentedTabs } from "#/components/SegmentedTabs"
import { type ActiveSummary, ExamCard, type ExamStatus } from "#/features/exam/components/ExamCard"
import { appConfigQuery, examsQuery, mySessionsQuery } from "#/features/exam/queries"
import type { SkillKey } from "#/features/exam/types"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/thi-thu/")({
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(examsQuery),
	component: ThiThuPage,
})

function ThiThuPage() {
	return (
		<>
			<Header title="Thư viện đề thi" />
			<div className="px-10 pb-12">
				<Suspense fallback={<Loading />}>
					<ExamListContent />
				</Suspense>
			</div>
		</>
	)
}

type StatusFilter = "Tất cả" | "Chưa làm" | "Đang làm dở" | "Đã nộp"

const STATUS_FILTER_ITEMS: { value: StatusFilter; label: string }[] = [
	{ value: "Tất cả", label: "Tất cả" },
	{ value: "Chưa làm", label: "Chưa làm" },
	{ value: "Đang làm dở", label: "Đang làm dở" },
	{ value: "Đã nộp", label: "Đã nộp" },
]

const SKILL_FILTERS: { key: SkillKey; label: string; color: string }[] = [
	{ key: "listening", label: "Listening", color: "text-skill-listening" },
	{ key: "reading", label: "Reading", color: "text-skill-reading" },
	{ key: "writing", label: "Writing", color: "text-skill-writing" },
	{ key: "speaking", label: "Speaking", color: "text-skill-speaking" },
]

const SKILL_ACTIVE_BG: Record<SkillKey, string> = {
	listening: "bg-info-tint border-info",
	reading: "bg-skill-reading/15 border-skill-reading/40",
	writing: "bg-primary-tint border-primary",
	speaking: "bg-warning-tint border-warning",
}

const STATUS_BY_LABEL: Record<StatusFilter, ExamStatus | "all"> = {
	"Tất cả": "all",
	"Chưa làm": "not-started",
	"Đang làm dở": "in-progress",
	"Đã nộp": "submitted",
}

function EmptyExams({ hasFilter, onReset }: { hasFilter: boolean; onReset: () => void }) {
	const mascot = hasFilter ? "/mascot/lac-think.png" : "/mascot/lac-sad.png"
	const title = hasFilter ? "Không tìm thấy đề thi phù hợp" : "Chưa có đề thi nào"
	const message = hasFilter
		? "Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác nhé!"
		: "Đề thi sẽ xuất hiện tại đây ngay khi sẵn sàng. Quay lại sau nha!"
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<img src={mascot} alt="" className="w-36 h-36 object-contain mb-1" />
			<h3 className="font-extrabold text-xl text-foreground mb-2">{title}</h3>
			<p className="text-sm text-muted max-w-sm mb-6">{message}</p>
			{hasFilter && (
				<button type="button" onClick={onReset} className="btn btn-primary px-6 py-2.5 text-sm">
					Xóa bộ lọc
				</button>
			)}
		</div>
	)
}

function ExamListContent() {
	const { data: examsData } = useSuspenseQuery(examsQuery)
	const { data: configData } = useQuery(appConfigQuery)
	const { data: mySessionsData } = useQuery(mySessionsQuery)

	const exams = examsData.data
	const fullTestCoinCost = configData?.data.pricing.exam.full_test_cost_coins ?? null

	const [search, setSearch] = useState("")
	const [status, setStatus] = useState<StatusFilter>("Tất cả")
	const [skills, setSkills] = useState<Set<SkillKey>>(new Set())

	function toggleSkill(skill: SkillKey) {
		setSkills((prev) => {
			const next = new Set(prev)
			if (next.has(skill)) next.delete(skill)
			else next.add(skill)
			return next
		})
	}

	// Per-exam: active session (status=active && deadline > now) wins → "in-progress" + sessionId.
	// Else "submitted" nếu từng nộp/grading/graded. Else "not-started".
	// BE cho phép nhiều session active đồng thời → giữ MỌI active per exam (không singleton).
	const { statusByExamId, activeByExamId } = useMemo(() => {
		const statusMap = new Map<string, ExamStatus>()
		const activeMap = new Map<string, ActiveSummary>()
		const sessions = mySessionsData?.data ?? []
		const now = Date.now()
		for (const s of sessions) {
			if (!s.exam_id) continue
			if (s.status === "active" && new Date(s.server_deadline_at).getTime() > now) {
				if (!activeMap.has(s.exam_id)) {
					activeMap.set(s.exam_id, {
						sessionId: s.id,
						deadlineAt: s.server_deadline_at,
						isFullTest: s.is_full_test,
						selectedSkills: s.selected_skills,
					})
					statusMap.set(s.exam_id, "in-progress")
				}
				continue
			}
			if (
				!statusMap.has(s.exam_id) &&
				(s.status === "submitted" || s.status === "graded" || s.status === "auto_submitted")
			) {
				statusMap.set(s.exam_id, "submitted")
			}
		}
		return { statusByExamId: statusMap, activeByExamId: activeMap }
	}, [mySessionsData])

	const wantedStatus = STATUS_BY_LABEL[status]

	const filtered = exams.filter((e) => {
		if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
		if (wantedStatus !== "all") {
			const s = statusByExamId.get(e.id) ?? "not-started"
			if (s !== wantedStatus) return false
		}
		// Skill filter: VSTEP full-test exams bao trọn 4 kỹ năng nên mọi skill đều match.
		// Giữ UI hoạt động; khi sau này có đề đơn kỹ năng, check exam.tags hoặc mở rộng API.
		if (skills.size > 0) {
			// no-op với dataset hiện tại
		}
		return true
	})

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<div className="relative">
					<Icon
						name="search"
						size="xs"
						className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
					/>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Tìm tên đề thi..."
						className="w-56 rounded-(--radius-button) border-2 border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-border-focus transition-colors"
					/>
				</div>

				{/* Divider */}
				<div className="w-px h-6 bg-border" />

				<SegmentedTabs items={STATUS_FILTER_ITEMS} value={status} onChange={setStatus} />

				{/* Divider */}
				<div className="w-px h-6 bg-border" />

				{/* Skill pills */}
				<div className="flex items-center gap-1.5">
					{SKILL_FILTERS.map(({ key, label, color }) => {
						const active = skills.has(key)
						return (
							<button
								key={key}
								type="button"
								onClick={() => toggleSkill(key)}
								className={cn(
									"px-3 py-1.5 rounded-(--radius-button) text-xs font-bold border-2 transition-colors cursor-pointer",
									active
										? cn(SKILL_ACTIVE_BG[key], color)
										: "bg-surface text-muted border-border hover:border-border-focus",
								)}
							>
								{label}
							</button>
						)
					})}
				</div>
			</div>

			{/* Count */}
			<p className="text-sm text-subtle">{filtered.length} đề thi</p>

			{/* Grid */}
			{filtered.length === 0 ? (
				<EmptyExams
					hasFilter={search.length > 0 || status !== "Tất cả" || skills.size > 0}
					onReset={() => {
						setSearch("")
						setStatus("Tất cả")
						setSkills(new Set())
					}}
				/>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filtered.map((exam) => (
						<ExamCard
							key={exam.id}
							exam={exam}
							fullTestCoinCost={fullTestCoinCost}
							status={statusByExamId.get(exam.id) ?? "not-started"}
							active={activeByExamId.get(exam.id)}
						/>
					))}
				</div>
			)}
		</div>
	)
}
