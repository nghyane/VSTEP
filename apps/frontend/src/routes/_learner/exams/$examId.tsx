import {
	ArrowLeft01Icon,
	Book02Icon,
	Clock01Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { useExamDetail, useStartExam } from "@/hooks/use-exam-session"
import { cn } from "@/lib/utils"
import type { Skill } from "@/types/api"

export const Route = createFileRoute("/_learner/exams/$examId")({
	component: ExamDetailPage,
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

function ExamDetailPage() {
	const { examId } = Route.useParams()
	const navigate = useNavigate()
	const { data: exam, isLoading, error } = useExamDetail(examId)
	const startExam = useStartExam()

	if (isLoading) {
		return <p className="py-10 text-center text-muted-foreground">Đang tải...</p>
	}

	if (error || !exam) {
		return (
			<p className="py-10 text-center text-destructive">
				Lỗi: {error?.message ?? "Không tìm thấy bài thi"}
			</p>
		)
	}

	// BE returns sections: [{ skill, questionIds, questionCount, ... }] instead of blueprint
	const sections = ((exam as unknown as Record<string, unknown>).sections ?? []) as {
		skill: Skill
		questionCount: number
		questionIds: string[]
	}[]
	const sectionsBySkill = new Map(sections.map((s) => [s.skill, s]))

	function handleStart() {
		startExam.mutate(examId, {
			onSuccess: (session) => {
				navigate({ to: "/exams/sessions/$sessionId", params: { sessionId: session.id } })
			},
		})
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<Link
				to="/exams"
				search={{ skill: undefined }}
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
				Danh sách bài thi
			</Link>

			<h1 className="text-2xl font-bold">{exam.title || `Đề thi ${exam.level}`}</h1>

			<div className="rounded-2xl bg-muted/30 p-6 space-y-5 shadow-sm">
				{exam.durationMinutes && (
					<div className="flex items-center gap-2 text-sm">
						<HugeiconsIcon icon={Clock01Icon} className="size-4 text-muted-foreground" />
						<span>Thời gian: {exam.durationMinutes} phút</span>
					</div>
				)}

				<div className="grid grid-cols-2 gap-3">
					{SKILL_ORDER.map((skill) => {
						const section = sectionsBySkill.get(skill)
						if (!section || section.questionIds.length === 0) return null
						const meta = skillMeta[skill]
						const count = section.questionCount ?? section.questionIds.length

						return (
							<div
								key={skill}
								className={cn("flex items-center gap-3 rounded-xl p-3", skillColor[skill])}
							>
								<HugeiconsIcon icon={meta.icon} className="size-5" />
								<div>
									<p className="text-sm font-medium">{meta.label}</p>
									<p className="text-xs opacity-80">{count} câu</p>
								</div>
							</div>
						)
					})}
				</div>

				{!exam.isActive && (
					<p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
						Bài thi hiện không khả dụng.
					</p>
				)}
			</div>

			{startExam.error && (
				<p className="text-sm text-destructive">Lỗi: {startExam.error.message}</p>
			)}

			<Button
				size="lg"
				className="w-full rounded-xl"
				disabled={!exam.isActive || startExam.isPending}
				onClick={handleStart}
			>
				{startExam.isPending ? "Đang bắt đầu..." : "Bắt đầu làm bài"}
			</Button>
		</div>
	)
}
