import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useMemo, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ExamCard, type ExamStatus } from "#/features/exam/components/ExamCard"
import { ResumeExamBanner } from "#/features/exam/components/ResumeExamBanner"
import { activeExamSessionQuery, appConfigQuery, examsQuery, mySessionsQuery } from "#/features/exam/queries"
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

const STATUS_OPTIONS = ["Tất cả", "Chưa làm", "Đang làm dở", "Đã nộp"] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]

const SKILL_FILTERS: { key: SkillKey; label: string; color: string }[] = [
	{ key: "listening", label: "Listening", color: "text-skill-listening" },
	{ key: "reading", label: "Reading", color: "text-skill-reading" },
	{ key: "writing", label: "Writing", color: "text-skill-writing" },
	{ key: "speaking", label: "Speaking", color: "text-skill-speaking" },
]

const SKILL_ACTIVE_BG: Record<SkillKey, string> = {
	listening: "bg-info-tint border-info",
	reading: "bg-[#f3eeff] border-[#7850c8]",
	writing: "bg-primary-tint border-primary",
	speaking: "bg-warning-tint border-warning",
}

const STATUS_BY_LABEL: Record<StatusFilter, ExamStatus | "all"> = {
	"Tất cả": "all",
	"Chưa làm": "not-started",
	"Đang làm dở": "in-progress",
	"Đã nộp": "submitted",
}

function ExamListContent() {
	const { data: examsData } = useSuspenseQuery(examsQuery)
	const { data: configData } = useQuery(appConfigQuery)
	const { data: mySessionsData } = useQuery(mySessionsQuery)
	const { data: activeData } = useQuery(activeExamSessionQuery)

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

	// Derive per-exam status. Active session (singleton) wins; else "submitted" if any
	// past session was submitted/graded/auto_submitted; else "not-started".
	const statusByExamId = useMemo(() => {
		const map = new Map<string, ExamStatus>()
		const sessions = mySessionsData?.data ?? []
		for (const s of sessions) {
			if (!s.exam_id) continue
			const current = map.get(s.exam_id)
			if (current === "in-progress") continue
			if (s.status === "submitted" || s.status === "graded" || s.status === "auto_submitted") {
				if (!current) map.set(s.exam_id, "submitted")
			}
		}
		const active = activeData?.data
		if (active?.exam_id) map.set(active.exam_id, "in-progress")
		return map
	}, [mySessionsData, activeData])

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
			<ResumeExamBanner />

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

				{/* Status pills */}
				<div className="flex items-center gap-1.5">
					{STATUS_OPTIONS.map((opt) => (
						<button
							key={opt}
							type="button"
							onClick={() => setStatus(opt)}
							className={cn(
								"px-3 py-1.5 rounded-(--radius-button) text-xs font-bold border-2 transition-colors cursor-pointer",
								status === opt
									? "bg-primary text-primary-foreground border-primary"
									: "bg-surface text-muted border-border hover:border-border-focus hover:text-foreground",
							)}
						>
							{opt}
						</button>
					))}
				</div>

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
				<p className="text-sm text-subtle py-8 text-center">Không tìm thấy đề thi nào.</p>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filtered.map((exam) => (
						<ExamCard
							key={exam.id}
							exam={exam}
							fullTestCoinCost={fullTestCoinCost}
							status={statusByExamId.get(exam.id) ?? "not-started"}
						/>
					))}
				</div>
			)}
		</div>
	)
}
