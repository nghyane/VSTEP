import { Clock01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Exam } from "@/types/api"
import { getDuration, getSkillQuestionCount, getTotalQuestions } from "./ExamListItem"
import { getBlueprint, SKILL_ORDER, skillColor, skillMeta } from "./skill-meta"

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
						const count = getSkillQuestionCount(bp, skill)
						if (count === 0) return null

						return (
							<div
								key={skill}
								className={cn("flex items-center gap-3 rounded-2xl px-4 py-3", skillColor[skill])}
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

export { ExamDetail }
