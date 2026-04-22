import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ExamCard } from "#/features/exam/components/ExamCard"
import { examCostsQuery, examsQuery } from "#/features/exam/queries"
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

function ExamListContent() {
	const { data: examsData } = useSuspenseQuery(examsQuery)
	const { data: costsData } = useQuery(examCostsQuery)

	const exams = examsData.data
	const fullTestCoinCost = costsData?.data.full_test_coin_cost ?? null

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

	const filtered = exams.filter((e) => {
		if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
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
						<ExamCard key={exam.id} exam={exam} fullTestCoinCost={fullTestCoinCost} />
					))}
				</div>
			)}
		</div>
	)
}
