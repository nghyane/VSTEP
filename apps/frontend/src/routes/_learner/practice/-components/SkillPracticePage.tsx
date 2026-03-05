import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { skillColor, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import type { Skill } from "@/types/api"
import {
	getTopicsForSkill,
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
	const allExams = getExams(skill)
	const topics = getTopicsForSkill(skill)
	const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

	const filteredExams = selectedTopic
		? allExams.filter((exam) => exam.topic === selectedTopic)
		: allExams

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
					<p className="text-sm text-muted-foreground">{allExams.length} bài luyện tập</p>
				</div>
			</div>

			<div className="flex flex-col gap-6 lg:flex-row">
				{/* Sidebar — topic filter */}
				<div className="shrink-0 lg:w-[220px]">
					<p className="mb-2 text-sm font-semibold">Chủ đề</p>

					{/* Mobile: horizontal scroll */}
					<div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
						<button
							type="button"
							className={cn(
								"shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
								selectedTopic === null
									? "bg-foreground text-background"
									: "bg-muted/50 text-muted-foreground hover:bg-muted",
							)}
							onClick={() => setSelectedTopic(null)}
						>
							Tất cả ({allExams.length})
						</button>
						{topics.map((topic) => {
							const count = allExams.filter((e) => e.topic === topic).length
							return (
								<button
									key={topic}
									type="button"
									className={cn(
										"shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
										selectedTopic === topic
											? "bg-foreground text-background"
											: "bg-muted/50 text-muted-foreground hover:bg-muted",
									)}
									onClick={() => setSelectedTopic(topic)}
								>
									{topic} ({count})
								</button>
							)
						})}
					</div>

					{/* Desktop: vertical list */}
					<nav className="hidden space-y-1 lg:block">
						<button
							type="button"
							className={cn(
								"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
								selectedTopic === null
									? "bg-muted/50 font-semibold text-foreground"
									: "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
							)}
							onClick={() => setSelectedTopic(null)}
						>
							<span>Tất cả</span>
							<span className="text-xs text-muted-foreground">{allExams.length}</span>
						</button>
						{topics.map((topic) => {
							const count = allExams.filter((e) => e.topic === topic).length
							return (
								<button
									key={topic}
									type="button"
									className={cn(
										"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
										selectedTopic === topic
											? "bg-muted/50 font-semibold text-foreground"
											: "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
									)}
									onClick={() => setSelectedTopic(topic)}
								>
									<span>{topic}</span>
									<span className="text-xs text-muted-foreground">{count}</span>
								</button>
							)
						})}
					</nav>
				</div>

				{/* Exercise Grid */}
				<div className="flex-1">
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{filteredExams.map((exam) => {
							const qCount = getQuestionCount(exam, skill)
							const unit = skill === "writing" ? "đề" : skill === "speaking" ? "phần" : "câu"
							const desc = getDescription(exam, skill)

							return (
								<div
									key={exam.id}
									className="flex flex-col gap-3 rounded-xl bg-muted/30 p-5 transition-colors hover:bg-muted/50"
								>
									<div className="flex items-start justify-between gap-2">
										<span className="text-sm font-semibold leading-snug">{exam.title}</span>
										<span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
											{exam.topic}
										</span>
									</div>
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

						{filteredExams.length === 0 && (
							<div className="col-span-full py-8 text-center text-sm text-muted-foreground">
								Không có bài luyện tập nào cho chủ đề này.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
