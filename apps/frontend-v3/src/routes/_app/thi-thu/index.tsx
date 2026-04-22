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

const SKILL_FILTER_OPTIONS: { key: SkillKey; label: string }[] = [
	{ key: "listening", label: "Listening" },
	{ key: "reading", label: "Reading" },
	{ key: "writing", label: "Writing" },
	{ key: "speaking", label: "Speaking" },
]

const SKILL_COLORS: Record<SkillKey, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
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
		<div className="flex gap-8 pt-2">
			{/* Sidebar filters */}
			<aside className="w-60 shrink-0 space-y-8">
				{/* Search */}
				<div className="space-y-3">
					<p className="text-xs font-bold tracking-wider text-subtle uppercase">Tìm kiếm</p>
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
							placeholder="Nhập tên đề thi..."
							className="w-full rounded-(--radius-button) border-2 border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-border-focus transition-colors"
						/>
					</div>
				</div>

				{/* Status */}
				<div className="space-y-3">
					<p className="text-xs font-bold tracking-wider text-subtle uppercase">Trạng thái</p>
					<div className="space-y-2.5">
						{STATUS_OPTIONS.map((opt) => (
							<label
								key={opt}
								className="flex cursor-pointer items-center gap-3 text-sm font-medium text-muted hover:text-primary transition-colors"
							>
								<input
									type="radio"
									name="exam-status"
									checked={status === opt}
									onChange={() => setStatus(opt)}
									className="size-4 accent-primary cursor-pointer"
								/>
								{opt}
							</label>
						))}
					</div>
				</div>

				{/* Skills */}
				<div className="space-y-3">
					<p className="text-xs font-bold tracking-wider text-subtle uppercase">Kỹ năng</p>
					<div className="space-y-2.5">
						{SKILL_FILTER_OPTIONS.map(({ key, label }) => {
							const checked = skills.has(key)
							return (
								<label
									key={key}
									className="flex cursor-pointer items-center gap-3 text-sm font-medium text-muted hover:text-primary transition-colors"
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={() => toggleSkill(key)}
										className="size-4 accent-primary cursor-pointer rounded"
									/>
									<span className={cn(checked ? SKILL_COLORS[key] : "")}>{label}</span>
								</label>
							)
						})}
					</div>
				</div>
			</aside>

			{/* Exam grid */}
			<div className="flex-1 min-w-0 space-y-4">
				<p className="text-sm text-subtle">{filtered.length} đề thi</p>
				{filtered.length === 0 ? (
					<p className="text-sm text-subtle py-8 text-center">Không tìm thấy đề thi nào.</p>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{filtered.map((exam) => (
							<ExamCard key={exam.id} exam={exam} fullTestCoinCost={fullTestCoinCost} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}
