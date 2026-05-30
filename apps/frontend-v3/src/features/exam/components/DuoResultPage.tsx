import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { useState } from "react"
import { MascotCelebration } from "#/features/exam/components/MascotCelebration"
import { McqGrid } from "#/features/exam/components/McqGrid"
import { SkillScoreCards } from "#/features/exam/components/SkillScoreCards"
import type { ExamResultUi, SpeakingSection, WritingSection } from "#/features/exam/use-exam-result-ui"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import type { RubricCriteriaMeta } from "#/features/grading/types"

export function DuoResultPage({ ui }: { ui: ExamResultUi }) {
	const {
		examTitle,
		overallBand,
		level,
		scores,
		activeSkills,
		hasPending,
		mcqParts,
		writingSections,
		speakingSections,
		writingRubric,
		speakingRubric,
	} = ui

	return (
		<div className="flex min-h-screen flex-col items-center bg-white">
			<div className="w-full flex justify-end px-4 pt-4 sm:px-6 sm:pt-6">
				<Link
					to="/thi-thu"
					className="inline-flex items-center gap-2 rounded-(--radius-button) border-2 border-border bg-surface px-4 py-2 text-sm font-bold text-subtle transition hover:text-foreground"
				>
					✕ Đóng
				</Link>
			</div>

			<div className="mt-6">
				<MascotCelebration examTitle={examTitle} overallBand={overallBand} level={level} />
			</div>

			<div className="mt-6">
				<SkillScoreCards scores={scores} activeSkills={activeSkills} />
			</div>

			{hasPending && (
				<div className="mt-3 flex items-center gap-2 rounded-full bg-warning-tint px-4 py-2 text-xs font-bold text-warning">
					<span className="size-2 animate-pulse rounded-full bg-warning" />
					AI đang chấm — kết quả tự cập nhật
				</div>
			)}

			<div className="mt-8 w-full max-w-xl px-4 pb-12">
				{mcqParts.map((p) => (
					<SkillRow key={p.id} label={p.label} summary={`${p.correct}/${p.total} đúng`}>
						<McqGrid items={p.items} detailMap={p.detailMap} />
					</SkillRow>
				))}
				{writingSections.map((s) => (
					<SkillRow
						key={s.id}
						label={s.label}
						summary={s.overallBand !== null ? `Band ${s.overallBand.toFixed(1)}` : ""}
						pending={s.overallBand === null}
					>
						{s.overallBand !== null && <WritingDetail section={s} rubric={writingRubric} />}
					</SkillRow>
				))}
				{speakingSections.map((s) => (
					<SkillRow
						key={s.id}
						label={s.label}
						summary={s.overallBand !== null ? `Band ${s.overallBand.toFixed(1)}` : ""}
						pending={s.overallBand === null}
					>
						{s.overallBand !== null && <SpeakingDetail section={s} rubric={speakingRubric} />}
					</SkillRow>
				))}
			</div>

			<div className="w-full max-w-xl px-4 pb-10">
				<Link to="/thi-thu" className="btn btn-primary w-full py-3.5 text-base font-extrabold">
					Hoàn thành
				</Link>
			</div>
		</div>
	)
}

interface SkillRowProps {
	label: string
	summary: string
	pending?: boolean
	children: ReactNode
}

function SkillRow({ label, summary, pending, children }: SkillRowProps) {
	const [open, setOpen] = useState(false)

	return (
		<div className="mb-4 overflow-hidden rounded-(--radius-card) border-2 border-border bg-surface">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-background"
			>
				<div className="min-w-0 flex-1">
					<span className="text-sm font-extrabold text-foreground">{label}</span>
					<span className="ml-2 text-xs text-subtle">{summary}</span>
				</div>
				<div className="ml-3 flex shrink-0 items-center gap-2">
					{pending && <span className="text-[10px] font-bold text-warning">đang chấm</span>}
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						className="text-subtle transition-transform"
						style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
						aria-hidden="true"
					>
						<path
							d="M3 4.5L6 7.5L9 4.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</button>
			{open && <div className="border-t-2 border-border px-4 py-4">{children}</div>}
		</div>
	)
}

function WritingDetail({ section, rubric }: { section: WritingSection; rubric?: RubricCriteriaMeta[] }) {
	const meta = (rubric ?? []) as RubricCriteriaMeta[]
	return (
		<div className="space-y-4">
			{section.criterionScores && (
				<div className="space-y-2">
					{section.criterionScores.map((criterion) => (
						<RubricBar
							key={criterion.key}
							label={meta.find((c) => c.key === criterion.key)?.label ?? criterion.key}
							score={criterion.score}
							max={meta.find((c) => c.key === criterion.key)?.max ?? 10}
							color="var(--color-skill-writing)"
						/>
					))}
				</div>
			)}
			{section.feedback && (
				<FeedbackSection
					strengths={section.feedback.strengths ?? []}
					improvements={section.feedback.improvements ?? section.feedback.evidenceNotes ?? []}
				/>
			)}
			{section.feedback?.rewrites && section.feedback.rewrites.length > 0 && (
				<RewriteSection rewrites={section.feedback.rewrites} />
			)}
			{section.text && (
				<div className="mt-3 rounded-lg border-2 border-border bg-background p-3">
					<p className="mb-1 text-[10px] font-bold uppercase text-subtle">Bài làm ({section.wordCount} từ)</p>
					<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{section.text}</p>
				</div>
			)}
		</div>
	)
}

function SpeakingDetail({ section, rubric }: { section: SpeakingSection; rubric?: RubricCriteriaMeta[] }) {
	const meta = (rubric ?? []) as RubricCriteriaMeta[]
	return (
		<div className="space-y-4">
			{section.audioUrl && (
				<audio src={section.audioUrl} controls className="w-full">
					<track kind="captions" />
				</audio>
			)}
			{section.transcript && (
				<div className="rounded-lg border-2 border-border bg-background p-3">
					<p className="mb-1 text-[10px] font-bold uppercase text-subtle">Transcript</p>
					<p className="text-sm leading-relaxed text-foreground">{section.transcript}</p>
				</div>
			)}
			{section.criterionScores && (
				<div className="space-y-2">
					{section.criterionScores.map((criterion) => (
						<RubricBar
							key={criterion.key}
							label={meta.find((c) => c.key === criterion.key)?.label ?? criterion.key}
							score={criterion.score}
							max={meta.find((c) => c.key === criterion.key)?.max ?? 10}
							color="var(--color-skill-speaking)"
						/>
					))}
				</div>
			)}
			{section.feedback && (
				<FeedbackSection
					strengths={section.feedback.strengths ?? []}
					improvements={section.feedback.improvements ?? section.feedback.evidenceNotes ?? []}
				/>
			)}
		</div>
	)
}
