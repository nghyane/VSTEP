import { Clock01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useStartExam } from "@/hooks/use-exam-session"
import { useExams } from "@/hooks/use-exams"
import { cn } from "@/lib/utils"
import {
	getBlueprint,
	SKILL_ORDER,
	skillColor,
	skillMeta,
} from "@/routes/_learner/exams/-components/skill-meta"
import type { Exam, Skill } from "@/types/api"

export const Route = createFileRoute("/_learner/exams/")({
	component: ExamListPage,
})

// --- Helpers ---

function getExamSkills(exam: Exam): Skill[] {
	const bp = getBlueprint(exam)
	return SKILL_ORDER.filter((s) => (bp[s]?.questionIds.length ?? 0) > 0)
}

function getTotalQuestions(exam: Exam): number {
	const bp = getBlueprint(exam)
	return SKILL_ORDER.reduce((sum, s) => sum + (bp[s]?.questionIds.length ?? 0), 0)
}

function getDuration(exam: Exam): number | undefined {
	return exam.durationMinutes ?? getBlueprint(exam).durationMinutes
}

// --- Exam list item (left panel) ---

function ExamListItem({
	exam,
	isSelected,
	onSelect,
	compact,
}: {
	exam: Exam
	isSelected: boolean
	onSelect: () => void
	compact: boolean
}) {
	const duration = getDuration(exam)
	const total = getTotalQuestions(exam)
	const skills = getExamSkills(exam)

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex w-full flex-col gap-1.5 rounded-xl border text-left transition-all duration-200",
				compact ? "px-3 py-2.5" : "px-4 py-4",
				isSelected
					? "border-primary bg-primary/5 ring-1 ring-primary/20"
					: "border-transparent hover:bg-muted/50",
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<span
					className={cn("font-medium leading-snug line-clamp-1", compact ? "text-sm" : "text-base")}
				>
					{exam.title || `${exam.level} — Đề thi thử`}
				</span>
				<Badge variant="secondary" className="shrink-0 text-[10px] font-bold">
					{exam.level}
				</Badge>
			</div>
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				{duration && (
					<span className="flex items-center gap-1">
						<HugeiconsIcon icon={Clock01Icon} className="size-3" />
						{duration}p
					</span>
				)}
				{total > 0 && <span>{total} câu</span>}
				<div className="ml-auto flex gap-1">
					{skills.map((s) => (
						<span
							key={s}
							className={cn("rounded-full", compact ? "size-1.5" : "size-2", `bg-skill-${s}`)}
							title={skillMeta[s].label}
						/>
					))}
				</div>
			</div>
		</button>
	)
}

// --- Exam detail (right panel) ---

function ExamDetail({
	exam,
	onStart,
	isStarting,
	onBack,
}: {
	exam: Exam
	onStart: () => void
	isStarting: boolean
	onBack: () => void
}) {
	const bp = getBlueprint(exam)
	const duration = getDuration(exam)
	const total = getTotalQuestions(exam)

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="space-y-3 border-b pb-5">
				<button
					type="button"
					onClick={onBack}
					className="text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					← Quay lại danh sách
				</button>
				<div className="flex items-start justify-between gap-3">
					<h2 className="text-lg font-bold leading-snug">
						{exam.title || `${exam.level} — Đề thi thử`}
					</h2>
					<Badge className="shrink-0 text-xs font-bold">{exam.level}</Badge>
				</div>
				{exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
				<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
					{duration && (
						<span className="flex items-center gap-1.5">
							<HugeiconsIcon icon={Clock01Icon} className="size-4" />
							{duration} phút
						</span>
					)}
					{total > 0 && <span>{total} câu hỏi</span>}
				</div>
			</div>

			{/* Skill breakdown */}
			<div className="flex-1 space-y-3 py-5">
				<p className="text-sm font-medium">Cấu trúc đề</p>
				<div className="grid gap-2 sm:grid-cols-2">
					{SKILL_ORDER.map((skill) => {
						const section = bp[skill]
						const count = section?.questionIds.length ?? 0
						if (count === 0) return null

						return (
							<div
								key={skill}
								className={cn("flex items-center gap-3 rounded-xl px-4 py-3", skillColor[skill])}
							>
								<HugeiconsIcon icon={skillMeta[skill].icon} className="size-5" />
								<span className="text-sm font-medium">{skillMeta[skill].label}</span>
								<span className="ml-auto text-sm font-bold tabular-nums">{count} câu</span>
							</div>
						)
					})}
				</div>
			</div>

			{/* Start button */}
			<Button
				size="lg"
				className="w-full rounded-xl text-base"
				disabled={isStarting}
				onClick={onStart}
			>
				{isStarting ? (
					<>
						<HugeiconsIcon icon={Loading03Icon} className="size-5 animate-spin" />
						Đang khởi tạo...
					</>
				) : (
					"Bắt đầu thi"
				)}
			</Button>
		</div>
	)
}

// --- Page ---

function ExamListPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const navigate = useNavigate()
	const { data, isLoading, error } = useExams()
	const startExam = useStartExam()
	const [startingId, setStartingId] = useState<string | null>(null)

	const exams = data?.data ?? []
	const selectedExam = exams.find((e) => e.id === selectedId) ?? null
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
		return <p className="py-20 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-20 text-center text-destructive">Lỗi: {error.message}</p>
	}

	if (exams.length === 0) {
		return (
			<div className="py-20 text-center">
				<h1 className="text-2xl font-bold">Thi thử</h1>
				<p className="mt-2 text-muted-foreground">Chưa có đề thi thử nào.</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold">Thi thử</h1>
				<p className="mt-1 text-muted-foreground">Chọn đề thi để xem chi tiết và bắt đầu</p>
			</div>

			{/* Desktop layout */}
			<div className="relative hidden h-[calc(100vh-10rem)] lg:flex">
				{/* List panel — always visible, shrinks when detail opens */}
				<div
					className={cn(
						"shrink-0 transition-[width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
						hasSelection ? "w-[340px]" : "w-full",
					)}
				>
					<ScrollArea className="h-full pr-2">
						<div
							className={cn(
								"transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
								hasSelection
									? "flex flex-col gap-1"
									: "mx-auto grid max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-3",
							)}
						>
							{exams.map((exam) => (
								<ExamListItem
									key={exam.id}
									exam={exam}
									isSelected={selectedId === exam.id}
									onSelect={() => setSelectedId(exam.id)}
									compact={hasSelection}
								/>
							))}
						</div>
					</ScrollArea>
				</div>

				{/* Detail panel — positioned right, width animated */}
				<div
					className={cn(
						"overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
						hasSelection ? "ml-6 flex-1" : "ml-0 w-0",
					)}
				>
					<div
						className={cn(
							"h-full rounded-2xl border bg-background p-6 transition-opacity duration-300",
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
				{/* List */}
				<div className="space-y-2">
					{exams.map((exam) => (
						<ExamListItem
							key={exam.id}
							exam={exam}
							isSelected={selectedId === exam.id}
							onSelect={() => setSelectedId(exam.id)}
							compact={false}
						/>
					))}
				</div>

				{/* Fullscreen detail overlay */}
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
