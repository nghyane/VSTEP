import {
	Book02Icon,
	Clock01Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { useExams } from "@/hooks/use-exams"
import { cn } from "@/lib/utils"
import type { Exam, ExamBlueprint, Skill } from "@/types/api"

export const Route = createFileRoute("/_learner/exams/")({
	component: ExamListPage,
})

const skillMeta: Record<Skill, { label: string; icon: IconSvgElement }> = {
	listening: { label: "Listening", icon: HeadphonesIcon },
	reading: { label: "Reading", icon: Book02Icon },
	writing: { label: "Writing", icon: PencilEdit02Icon },
	speaking: { label: "Speaking", icon: Mic01Icon },
}

const skillColor: Record<Skill, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

const SKILL_ORDER: Skill[] = ["listening", "reading", "writing", "speaking"]

function getBlueprint(exam: Exam): ExamBlueprint {
	return exam.blueprint as ExamBlueprint
}

function SkillBreakdown({ exam }: { exam: Exam }) {
	const bp = getBlueprint(exam)

	return (
		<div className="flex flex-wrap gap-2">
			{SKILL_ORDER.map((skill) => {
				const section = bp[skill]
				if (!section || section.questionIds.length === 0) return null
				const meta = skillMeta[skill]

				return (
					<span
						key={skill}
						className={cn(
							"inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium",
							skillColor[skill],
						)}
					>
						<HugeiconsIcon icon={meta.icon} className="size-3.5" />
						{section.questionIds.length} câu
					</span>
				)
			})}
		</div>
	)
}

function ExamCard({ exam }: { exam: Exam }) {
	const bp = getBlueprint(exam)

	return (
		<div className="flex flex-col gap-4 rounded-xl bg-muted/30 p-5">
			<div className="flex items-center justify-between">
				<span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
					{exam.level}
				</span>
				{bp.durationMinutes && (
					<span className="flex items-center gap-1 text-xs text-muted-foreground">
						<HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
						{bp.durationMinutes} phút
					</span>
				)}
			</div>

			<SkillBreakdown exam={exam} />

			<Button asChild className="mt-auto w-full rounded-xl">
				<Link to="/exams/$examId" params={{ examId: exam.id }}>
					Bắt đầu
				</Link>
			</Button>
		</div>
	)
}

function ExamListPage() {
	const { data, isLoading, error } = useExams()

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error) {
		return <p className="py-10 text-center text-destructive">Lỗi: {error.message}</p>
	}

	const exams = data?.data ?? []

	if (exams.length === 0) {
		return (
			<div className="py-10 text-center">
				<p className="text-muted-foreground">Chưa có bài thi nào.</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Bài thi</h1>
				<p className="mt-1 text-muted-foreground">Chọn đề thi để bắt đầu luyện tập</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{exams.map((exam) => (
					<ExamCard key={exam.id} exam={exam} />
				))}
			</div>
		</div>
	)
}
