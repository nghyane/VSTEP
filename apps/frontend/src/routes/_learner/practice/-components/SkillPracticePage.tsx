import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { skillColor, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import type { Skill } from "@/types/api"
import {
	LISTENING_EXAMS,
	type ListeningExam,
	READING_EXAMS,
	type ReadingExam,
	SPEAKING_EXAMS,
	type SpeakingExam,
	WRITING_EXAMS,
	type WritingExam,
} from "./mock-data"

type AnyExam = ListeningExam | ReadingExam | WritingExam | SpeakingExam

function getExams(skill: Skill): AnyExam[] {
	switch (skill) {
		case "listening":
			return LISTENING_EXAMS
		case "reading":
			return READING_EXAMS
		case "writing":
			return WRITING_EXAMS
		case "speaking":
			return SPEAKING_EXAMS
	}
}

function getQuestionCount(exam: AnyExam, skill: Skill): number {
	switch (skill) {
		case "listening":
			return (exam as ListeningExam).sections.reduce((sum, s) => sum + s.questions.length, 0)
		case "reading":
			return (exam as ReadingExam).passages.reduce((sum, p) => sum + p.questions.length, 0)
		case "writing":
			return (exam as WritingExam).tasks.length
		case "speaking":
			return (exam as SpeakingExam).parts.length
	}
}

function getDescription(exam: AnyExam, skill: Skill): string {
	switch (skill) {
		case "listening": {
			const e = exam as ListeningExam
			return `${e.sections.length} phần`
		}
		case "reading": {
			const e = exam as ReadingExam
			return `${e.passages.length} đoạn văn`
		}
		case "writing": {
			const e = exam as WritingExam
			const limit = e.tasks[0]?.wordLimit
			return limit ? `Tối thiểu ${limit} từ` : ""
		}
		case "speaking": {
			const e = exam as SpeakingExam
			const time = e.parts.reduce((sum, p) => sum + p.speakingTime, 0)
			return `${time} phút`
		}
	}
}

export function SkillPracticePage({ skill }: { skill: Skill }) {
	const meta = skillMeta[skill]
	const exams = getExams(skill)

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="size-8" asChild>
					<Link to="/practice">
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					</Link>
				</Button>
				<div
					className={cn("flex size-10 items-center justify-center rounded-xl", skillColor[skill])}
				>
					<HugeiconsIcon icon={meta.icon} className="size-5" />
				</div>
				<div>
					<h1 className="text-xl font-bold">{meta.label}</h1>
					<p className="text-sm text-muted-foreground">{exams.length} bài luyện tập</p>
				</div>
			</div>

			{/* Exercise Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{exams.map((exam) => {
					const qCount = getQuestionCount(exam, skill)
					const unit = skill === "writing" ? "đề" : skill === "speaking" ? "phần" : "câu"
					const desc = getDescription(exam, skill)

					return (
						<div
							key={exam.id}
							className="flex flex-col gap-3 rounded-2xl border p-5 transition-colors hover:border-primary/30"
						>
							<span className="text-sm font-semibold leading-snug">{exam.title}</span>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<span>
									{qCount} {unit}
								</span>
								{desc && <span>{desc}</span>}
							</div>
							<Button size="sm" className="mt-auto w-full rounded-xl" asChild>
								<Link to="/exercise" search={{ skill, id: exam.id }}>
									Luyện tập ngay
								</Link>
							</Button>
						</div>
					)
				})}
			</div>
		</div>
	)
}
