import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Skill } from "@/types/api"
import { SKILL_ORDER, skillMeta } from "./skill-meta"

type SortOption = "newest" | "oldest" | "az" | "za"
type StatusFilter = "not_started" | "in_progress" | "completed"

interface ExamFilters {
	search: string
	skills: Set<Skill>
	sort: SortOption
	statuses: Set<StatusFilter>
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "Mới nhất" },
	{ value: "oldest", label: "Cũ nhất" },
	{ value: "az", label: "Từ A → Z" },
	{ value: "za", label: "Từ Z → A" },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
	{ value: "not_started", label: "Bài chưa làm" },
	{ value: "in_progress", label: "Bài đang làm" },
	{ value: "completed", label: "Bài đã làm" },
]

function ExamSidebar({
	filters,
	onFiltersChange,
}: {
	filters: ExamFilters
	onFiltersChange: (filters: ExamFilters) => void
}) {
	const [searchInput, setSearchInput] = useState(filters.search)
	const [showAllSkills, setShowAllSkills] = useState(false)

	const visibleSkills = showAllSkills ? SKILL_ORDER : SKILL_ORDER.slice(0, 4)

	function handleSearch() {
		onFiltersChange({ ...filters, search: searchInput })
	}

	function handleSearchKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") handleSearch()
	}

	function toggleSkill(skill: Skill) {
		const next = new Set(filters.skills)
		if (next.has(skill)) next.delete(skill)
		else next.add(skill)
		onFiltersChange({ ...filters, skills: next })
	}

	function toggleStatus(status: StatusFilter) {
		const next = new Set(filters.statuses)
		if (next.has(status)) next.delete(status)
		else next.add(status)
		onFiltersChange({ ...filters, statuses: next })
	}

	function setSort(sort: SortOption) {
		onFiltersChange({ ...filters, sort })
	}

	return (
		<div className="max-h-full overflow-y-auto rounded-2xl bg-muted/40 shadow-sm">
			<div className="space-y-4 px-3.5 py-3.5">
				{/* Search */}
				<div className="space-y-2">
					<p className="text-sm font-semibold">Tìm kiếm</p>
					<div className="flex gap-2">
						<Input
							placeholder="Nhập từ khóa..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyDown={handleSearchKeyDown}
							className="h-9 bg-background text-sm"
						/>
						<Button
							size="icon"
							variant="secondary"
							className="size-9 shrink-0"
							onClick={handleSearch}
						>
							<HugeiconsIcon icon={Search01Icon} className="size-4" />
						</Button>
					</div>
				</div>

				<div className="h-px bg-border" />

				{/* Filters */}
				<div className="space-y-3">
					<p className="text-sm font-semibold">Bộ lọc</p>

					{/* Status */}
					<div className="space-y-1.5">
						<p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
							Trạng thái
						</p>
						{STATUS_OPTIONS.map(({ value, label }) => (
							<div
								key={value}
								className="flex cursor-pointer items-center justify-between py-0.5"
								onClick={() => toggleStatus(value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") toggleStatus(value)
								}}
								role="checkbox"
								aria-checked={filters.statuses.has(value)}
								tabIndex={0}
							>
								<span className="text-sm">{label}</span>
								<Checkbox
									checked={filters.statuses.has(value)}
									onCheckedChange={() => toggleStatus(value)}
									tabIndex={-1}
								/>
							</div>
						))}
					</div>

					<div className="h-px bg-border" />

					{/* Skill */}
					<div className="space-y-1.5">
						<p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
							Kỹ năng ({SKILL_ORDER.length})
						</p>
						{visibleSkills.map((skill) => (
							<div
								key={skill}
								className="flex cursor-pointer items-center justify-between py-0.5"
								onClick={() => toggleSkill(skill)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") toggleSkill(skill)
								}}
								role="checkbox"
								aria-checked={filters.skills.has(skill)}
								tabIndex={0}
							>
								<span className="text-sm">{skillMeta[skill].label}</span>
								<Checkbox
									checked={filters.skills.has(skill)}
									onCheckedChange={() => toggleSkill(skill)}
									tabIndex={-1}
								/>
							</div>
						))}
						{!showAllSkills && SKILL_ORDER.length > 4 && (
							<button
								type="button"
								onClick={() => setShowAllSkills(true)}
								className="text-sm font-medium text-primary hover:underline"
							>
								Xem Tất Cả
							</button>
						)}
					</div>
				</div>

				<div className="h-px bg-border" />

				{/* Sort */}
				<div className="space-y-1.5">
					<p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
						Sắp xếp theo
					</p>
					{SORT_OPTIONS.map(({ value, label }) => (
						<div
							key={value}
							className="flex cursor-pointer items-center justify-between py-0.5"
							onClick={() => setSort(value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") setSort(value)
							}}
							role="radio"
							aria-checked={filters.sort === value}
							tabIndex={0}
						>
							<span className="text-sm">{label}</span>
							<span
								className={cn(
									"flex size-4 items-center justify-center rounded-full border-2 transition-colors",
									filters.sort === value
										? "border-primary bg-primary"
										: "border-muted-foreground/30",
								)}
							>
								{filters.sort === value && <span className="size-1.5 rounded-full bg-white" />}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export { ExamSidebar }
export type { ExamFilters, SortOption, StatusFilter }
