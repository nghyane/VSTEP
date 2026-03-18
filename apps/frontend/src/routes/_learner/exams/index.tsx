import { DocumentValidationIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useStartExam } from "@/hooks/use-exam-session"
import { useExams } from "@/hooks/use-exams"
import { cn } from "@/lib/utils"
import type { Exam, Skill } from "@/types/api"
import { ExamDetail } from "./-components/ExamDetail"
import { ExamListItem, getExamSkills } from "./-components/ExamListItem"
import { type ExamFilters, ExamSidebar, type SortOption } from "./-components/ExamSidebar"

export const Route = createFileRoute("/_learner/exams/")({
	component: ExamListPage,
})

function applyFilters(exams: Exam[], filters: ExamFilters): Exam[] {
	let result = exams

	if (filters.search.trim()) {
		const q = filters.search.trim().toLowerCase()
		result = result.filter(
			(e) =>
				e.title?.toLowerCase().includes(q) ||
				e.level.toLowerCase().includes(q) ||
				e.description?.toLowerCase().includes(q),
		)
	}

	if (filters.skills.size > 0) {
		result = result.filter((e) => {
			const examSkills = getExamSkills(e)
			return examSkills.some((s) => filters.skills.has(s))
		})
	}

	return sortExams(result, filters.sort)
}

function sortExams(exams: Exam[], sort: SortOption): Exam[] {
	const sorted = [...exams]
	switch (sort) {
		case "newest":
			return sorted.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			)
		case "oldest":
			return sorted.sort(
				(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
			)
		case "az":
			return sorted.sort((a, b) => (a.title || "").localeCompare(b.title || "", "vi"))
		case "za":
			return sorted.sort((a, b) => (b.title || "").localeCompare(a.title || "", "vi"))
		default:
			return sorted
	}
}

const DEFAULT_FILTERS: ExamFilters = {
	search: "",
	skills: new Set<Skill>(),
	sort: "newest",
	statuses: new Set(),
}

function ExamListPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [filters, setFilters] = useState<ExamFilters>(DEFAULT_FILTERS)
	const navigate = useNavigate()
	const { data, isLoading, error } = useExams()
	const startExam = useStartExam()
	const [startingId, setStartingId] = useState<string | null>(null)

	const exams = data?.data ?? []
	const filteredExams = useMemo(() => applyFilters(exams, filters), [exams, filters])
	const selectedExam = filteredExams.find((e) => e.id === selectedId) ?? null
	const hasSelection = selectedExam !== null

	const handleStart = useCallback(async () => {
		if (!selectedExam) return
		setStartingId(selectedExam.id)
		try {
			const session = await startExam.mutateAsync(selectedExam.id)
			navigate({ to: "/practice/$sessionId", params: { sessionId: session.id } })
		} catch {
			setStartingId(null)
		}
	}, [selectedExam, startExam, navigate])

	const handleDeselect = useCallback(() => setSelectedId(null), [])

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Thi thử</h1>
					<p className="mt-1 text-muted-foreground">Chọn đề thi để xem chi tiết và bắt đầu</p>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-2xl" />
					))}
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Thi thử</h1>
					<p className="mt-1 text-muted-foreground">Chọn đề thi để xem chi tiết và bắt đầu</p>
				</div>
				<div className="rounded-2xl bg-muted/50 p-12 text-center">
					<p className="text-lg font-semibold">Đã xảy ra lỗi</p>
					<p className="mt-1 text-muted-foreground">{error.message}</p>
				</div>
			</div>
		)
	}

	if (exams.length === 0) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">Thi thử</h1>
					<p className="mt-1 text-muted-foreground">Chọn đề thi để xem chi tiết và bắt đầu</p>
				</div>
				<div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 py-16">
					<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<HugeiconsIcon icon={DocumentValidationIcon} className="size-6" />
					</div>
					<p className="text-muted-foreground">Chưa có đề thi thử nào</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Thi thử</h1>
				<p className="mt-1 text-muted-foreground">Chọn đề thi để xem chi tiết và bắt đầu</p>
			</div>

			{/* Desktop layout */}
			<div className="relative hidden h-[calc(100vh-10rem)] lg:flex">
				{/* Sidebar */}
				<div className="w-[260px] shrink-0">
					<ExamSidebar filters={filters} onFiltersChange={setFilters} />
				</div>

				{/* List panel */}
				<div
					className={cn(
						"shrink-0 pl-4 transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
						hasSelection ? "w-[420px]" : "flex-1",
					)}
				>
					<ScrollArea className="h-full pr-2">
						{filteredExams.length > 0 ? (
							<div
								className={cn(
									"transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
									hasSelection
										? "flex flex-col gap-1"
										: "mx-auto grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
								)}
							>
								{filteredExams.map((exam) => (
									<ExamListItem
										key={exam.id}
										exam={exam}
										isSelected={selectedId === exam.id}
										onSelect={() => setSelectedId(exam.id)}
										compact={hasSelection}
									/>
								))}
							</div>
						) : (
							<div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
								Không tìm thấy đề thi phù hợp
							</div>
						)}
					</ScrollArea>
				</div>

				{/* Detail panel */}
				<div
					className={cn(
						"overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
						hasSelection ? "ml-6 flex-1" : "ml-0 w-0",
					)}
				>
					<div
						className={cn(
							"h-full rounded-2xl bg-muted/50 p-6 transition-opacity duration-300",
							hasSelection ? "opacity-100" : "opacity-0",
						)}
					>
						{selectedExam && (
							<ExamDetail
								exam={selectedExam}
								onStart={handleStart}
								isStarting={startingId === selectedExam.id}
								onBack={handleDeselect}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Mobile layout */}
			<div className="lg:hidden">
				<div className="space-y-2">
					{filteredExams.map((exam) => (
						<ExamListItem
							key={exam.id}
							exam={exam}
							isSelected={selectedId === exam.id}
							onSelect={() => setSelectedId(exam.id)}
							compact={false}
						/>
					))}
				</div>

				{selectedExam && (
					<div className="fixed inset-0 z-50 flex flex-col bg-background">
						<div className="flex-1 overflow-y-auto p-5">
							<ExamDetail
								exam={selectedExam}
								onStart={handleStart}
								isStarting={startingId === selectedExam.id}
								onBack={handleDeselect}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
