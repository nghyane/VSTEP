import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { type ReactNode, Suspense, useMemo, useState } from "react"
import { DeviceCheckScreen } from "#/features/exam/components/DeviceCheckScreen"
import { ExamRoomHeader } from "#/features/exam/components/ExamRoomHeader"
import { LacCoinMascot } from "#/features/exam/components/LacCoinMascot"
import { ListeningPanel } from "#/features/exam/components/ListeningPanel"
import { ReadingPanel } from "#/features/exam/components/ReadingPanel"
import { ResultBackground } from "#/features/exam/components/ResultBackground"
import { SpeakingPanel } from "#/features/exam/components/SpeakingPanel"
import { WritingPanel } from "#/features/exam/components/WritingPanel"
import { examDetailQuery, examSessionQuery } from "#/features/exam/queries"
import type { SkillKey, SubmitSessionResult } from "#/features/exam/types"
import { useExamSession, useExamTimer } from "#/features/exam/use-exam-session"
import { cn } from "#/lib/utils"

// ─── Route definition ─────────────────────────────────────────────────────────

interface Search {
	examId: string
}

export const Route = createFileRoute("/_focused/phong-thi/$sessionId")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		examId: typeof search.examId === "string" ? search.examId : "",
	}),
	component: PhongThiPage,
})

// ─── Skill nav constants ──────────────────────────────────────────────────────

const SKILL_LABEL: Record<SkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

const SKILL_COLOR: Record<SkillKey, string> = {
	listening: "text-skill-listening",
	reading: "text-skill-reading",
	writing: "text-skill-writing",
	speaking: "text-skill-speaking",
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
	open: boolean
	title: string
	description: ReactNode
	warning?: string
	confirmLabel: string
	onConfirm: () => void
	onCancel: () => void
	isLoading?: boolean
}

function ConfirmDialog({
	open,
	title,
	description,
	warning,
	confirmLabel,
	onConfirm,
	onCancel,
	isLoading,
}: ConfirmDialogProps) {
	if (!open) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-6">
			<button
				type="button"
				aria-label="Đóng"
				onClick={onCancel}
				className="absolute inset-0 bg-foreground/45 backdrop-blur-sm"
			/>
			<div className="relative w-full max-w-sm rounded-(--radius-card) border-2 border-b-4 border-border bg-card p-6 shadow-[0_12px_28px_rgb(0_0_0_/_0.12)] animate-[slideIn_0.18s_ease-out]">
				{/* Close */}
				<button
					type="button"
					onClick={onCancel}
					className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground"
					aria-label="Đóng"
				>
					<svg
						viewBox="0 0 16 16"
						className="size-4"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M3 3l10 10M13 3L3 13" />
					</svg>
				</button>

				{/* Icon — raised warning chip */}
				<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border-2 border-b-4 border-warning/30 bg-warning-tint">
					<svg
						viewBox="0 0 24 24"
						className="size-7 text-warning"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
				</div>

				<h2 className="mb-1.5 text-center text-lg font-extrabold text-foreground">{title}</h2>
				<p className="mb-5 text-center text-sm leading-relaxed text-muted">{description}</p>

				{warning && (
					<div className="mb-5 flex items-center justify-center gap-2 rounded-(--radius-button) border-2 border-warning/30 bg-warning-tint px-3 py-2 text-center text-xs font-extrabold text-warning">
						<span
							aria-hidden="true"
							className="flex size-4 shrink-0 items-center justify-center rounded-full bg-warning text-[10px] font-black text-white"
						>
							!
						</span>
						{warning}
					</div>
				)}

				<div className="flex gap-2.5">
					<button
						type="button"
						onClick={onCancel}
						className="flex-1 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-4 py-2.5 text-sm font-extrabold text-foreground transition-all hover:border-primary/40 active:translate-y-[2px] active:border-b-2"
					>
						Ở lại
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isLoading}
						className="btn btn-primary flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isLoading ? "Đang nộp…" : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Result screen (shown after submit) ──────────────────────────────────────

function ResultScreen({ result, examTitle }: { result: SubmitSessionResult; examTitle: string }) {
	const pct = result.mcq_total > 0 ? Math.round((result.mcq_score / result.mcq_total) * 100) : 0
	const scoreOn10 = result.mcq_total > 0 ? ((result.mcq_score / result.mcq_total) * 10).toFixed(1) : "0.0"

	return (
		<div className="relative flex min-h-screen flex-col items-center overflow-hidden">
			<ResultBackground />

			{/* Content */}
			<div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
				{/* Card */}
				<div className="w-full max-w-3xl overflow-hidden rounded-(--radius-banner) border-2 border-b-4 border-white/20 bg-white shadow-2xl">
					{/* Top: mascot + congrats */}
					<div className="flex items-center gap-5 px-7 py-6">
						<LacCoinMascot scoreLabel={scoreOn10} className="w-36 shrink-0 sm:w-44" />

						<div className="min-w-0 flex-1">
							<p className="text-xs font-extrabold uppercase tracking-widest text-primary">Chúc mừng!</p>
							<h1 className="mt-1 text-2xl font-extrabold text-foreground">Nộp bài thành công</h1>
							<p className="mt-1 text-sm text-muted">{examTitle}</p>

							{/* Score pills */}
							<div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
								<ScorePill
									value={result.mcq_score}
									total={result.mcq_total}
									label="câu đúng"
									variant="success"
								/>
								<ScorePill
									value={result.mcq_total - result.mcq_score}
									total={result.mcq_total}
									label="câu sai"
									variant="danger"
								/>
							</div>
						</div>
					</div>

					<div className="mx-6 h-px bg-border" />

					{/* MCQ progress */}
					<div className="px-7 py-5 space-y-3">
						<div className="flex items-center justify-between text-sm">
							<span className="font-extrabold text-foreground">Nghe + Đọc (MCQ)</span>
							<span className="font-extrabold tabular-nums text-foreground">{pct}%</span>
						</div>
						<div className="h-3 w-full overflow-hidden rounded-full bg-border">
							<div
								className="h-full rounded-full bg-primary transition-all duration-700"
								style={{ width: `${pct}%` }}
							/>
						</div>
						<p className="text-xs text-muted">
							Writing và Speaking đang được AI chấm — kết quả sẽ hiển thị sau vài phút.
						</p>
					</div>

					<div className="mx-6 h-px bg-border" />

					{/* Actions */}
					<div className="flex justify-center gap-3 px-7 py-5">
						<Link to="/thi-thu" className="btn btn-secondary">
							Về danh sách đề
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

function ScorePill({
	value,
	total,
	label,
	variant,
}: {
	value: number
	total: number
	label: string
	variant: "success" | "danger"
}) {
	const isSuccess = variant === "success"
	return (
		<div className="inline-flex items-baseline gap-1.5">
			<div
				className={
					isSuccess
						? "inline-flex items-center rounded-(--radius-button) border-2 border-b-4 border-primary/30 bg-primary-tint px-2.5 py-1"
						: "inline-flex items-center rounded-(--radius-button) border-2 border-b-4 border-destructive/30 bg-destructive-tint px-2.5 py-1"
				}
			>
				<span
					className={`text-base font-extrabold tabular-nums leading-none ${isSuccess ? "text-primary" : "text-destructive"}`}
				>
					{value}/{total}
				</span>
			</div>
			<span className="text-xs text-muted">{label}</span>
		</div>
	)
}

// ─── Inner exam room (data loaded) ───────────────────────────────────────────

function ExamRoom({ sessionId, examId }: { sessionId: string; examId: string }) {
	const [submitResult, setSubmitResult] = useState<SubmitSessionResult | null>(null)
	const { data: sessionRes } = useSuspenseQuery(examSessionQuery(sessionId))
	const { data: examRes } = useSuspenseQuery(examDetailQuery(examId))

	const session = sessionRes.data
	const { version, exam } = examRes.data

	const listeningItems = version.listening_sections.flatMap((s) => s.items)
	const readingItems = version.reading_passages.flatMap((p) => p.items)

	const handleSubmitted = (result: SubmitSessionResult) => {
		setSubmitResult(result)
	}

	const {
		state,
		activeSkills,
		currentSkill,
		isLastSkill,
		nextSkill,
		totalMcq,
		answeredMcq,
		isSubmitting,
		handleStartExam,
		handleAnswerMcq,
		handleAnswerWriting,
		handleMarkSpeakingDone,
		handleUnmarkSpeakingDone,
		handleConfirmNext,
		handleShowConfirmNext,
		handleHideConfirmNext,
		handleShowConfirmSubmit,
		handleHideConfirmSubmit,
		handleSubmit,
	} = useExamSession({
		session,
		listeningItems,
		readingItems,
		onSubmitted: handleSubmitted,
	})

	const skillDurationMinutes = useMemo<Record<SkillKey, number>>(
		() => ({
			listening: version.listening_sections.reduce((sum, s) => sum + s.duration_minutes, 0),
			reading: version.reading_passages.reduce((sum, p) => sum + p.duration_minutes, 0),
			writing: version.writing_tasks.reduce((sum, t) => sum + t.duration_minutes, 0),
			speaking: version.speaking_parts.reduce((sum, p) => sum + p.duration_minutes, 0),
		}),
		[version],
	)

	const totalDurationMinutes = activeSkills.reduce((sum, sk) => sum + skillDurationMinutes[sk], 0)

	const remainingSeconds = useExamTimer(session.server_deadline_at)

	if (submitResult) {
		return <ResultScreen result={submitResult} examTitle={exam.title} />
	}

	// Device check phase — hiển thị trước khi vào phòng thi
	if (state.phase === "device-check") {
		return (
			<DeviceCheckScreen
				examTitle={exam.title}
				activeSkills={activeSkills}
				skillDurationMinutes={skillDurationMinutes}
				totalDurationMinutes={totalDurationMinutes}
				onStart={handleStartExam}
			/>
		)
	}

	const skillProgress = `${state.skillIdx + 1}/${activeSkills.length}`

	return (
		<div className="flex h-screen flex-col bg-background">
			{/* Header */}
			<ExamRoomHeader remainingSeconds={remainingSeconds} answeredMcq={answeredMcq} totalMcq={totalMcq} />

			{/* Skill panel */}
			<main className="flex flex-1 flex-col overflow-hidden">
				{currentSkill === "listening" && (
					<ListeningPanel
						sections={version.listening_sections}
						sessionId={sessionId}
						mcqAnswers={state.mcqAnswers}
						onAnswer={handleAnswerMcq}
						footer={{
							skillLabel: SKILL_LABEL.listening,
							skillProgress,
							isLastSkill,
							isSubmitting,
							onSubmit: handleShowConfirmSubmit,
							onNext: handleShowConfirmNext,
						}}
					/>
				)}
				{currentSkill === "reading" && (
					<ReadingPanel
						passages={version.reading_passages}
						mcqAnswers={state.mcqAnswers}
						onAnswer={handleAnswerMcq}
						footer={{
							skillLabel: SKILL_LABEL.reading,
							skillProgress,
							isLastSkill,
							isSubmitting,
							onSubmit: handleShowConfirmSubmit,
							onNext: handleShowConfirmNext,
						}}
					/>
				)}
				{currentSkill === "writing" && (
					<WritingPanel
						tasks={version.writing_tasks}
						writingAnswers={state.writingAnswers}
						onAnswer={handleAnswerWriting}
						footer={{
							skillLabel: SKILL_LABEL.writing,
							skillProgress,
							isLastSkill,
							isSubmitting,
							onSubmit: handleShowConfirmSubmit,
							onNext: handleShowConfirmNext,
						}}
					/>
				)}
				{currentSkill === "speaking" && (
					<SpeakingPanel
						parts={version.speaking_parts}
						speakingDone={state.speakingDone}
						onMarkDone={handleMarkSpeakingDone}
						onUnmarkDone={handleUnmarkSpeakingDone}
						footer={{
							skillLabel: SKILL_LABEL.speaking,
							skillProgress,
							isLastSkill,
							isSubmitting,
							onSubmit: handleShowConfirmSubmit,
							onNext: handleShowConfirmNext,
						}}
					/>
				)}
			</main>

			{/* Footer — ẩn khi tất cả skill đã nhúng footer riêng */}
			{currentSkill !== "listening" &&
				currentSkill !== "reading" &&
				currentSkill !== "writing" &&
				currentSkill !== "speaking" && (
					<footer className="z-40 flex h-14 shrink-0 items-center justify-between border-t border-border bg-card px-5">
						<div className="w-24" />

						{/* Current skill indicator */}
						{currentSkill && (
							<p className={cn("text-sm font-bold", SKILL_COLOR[currentSkill])}>
								{SKILL_LABEL[currentSkill]}
								<span className="ml-1 text-xs font-normal text-muted">({skillProgress})</span>
							</p>
						)}

						{/* Action button */}
						{isLastSkill ? (
							<button
								type="button"
								onClick={handleShowConfirmSubmit}
								disabled={isSubmitting}
								className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
							>
								<svg
									viewBox="0 0 16 16"
									className="size-4"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<polyline points="2,8 6,12 14,4" />
								</svg>
								Nộp bài
							</button>
						) : (
							<button
								type="button"
								onClick={handleShowConfirmNext}
								className="flex items-center gap-2 rounded-xl border-2 border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
							>
								Phần tiếp
								<svg
									viewBox="0 0 16 16"
									className="size-4"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M6 3l5 5-5 5" />
								</svg>
							</button>
						)}
					</footer>
				)}

			{/* Submit confirm dialog */}
			<ConfirmDialog
				open={state.confirmSubmit}
				title="Nộp bài?"
				description="Sau khi nộp, bạn không thể chỉnh sửa câu trả lời."
				warning={answeredMcq < totalMcq ? `⚠ Còn ${totalMcq - answeredMcq} câu chưa trả lời` : undefined}
				confirmLabel="Nộp bài"
				onConfirm={handleSubmit}
				onCancel={handleHideConfirmSubmit}
				isLoading={isSubmitting}
			/>

			{/* Next skill confirm dialog */}
			<ConfirmDialog
				open={state.confirmNextSkill}
				title={`Chuyển sang ${nextSkill ? SKILL_LABEL[nextSkill] : "phần tiếp"}?`}
				description={
					<>
						Sau khi chuyển, bạn sẽ <strong className="text-foreground">không thể quay lại</strong> phần{" "}
						{currentSkill ? SKILL_LABEL[currentSkill] : ""} để chỉnh sửa.
					</>
				}
				confirmLabel={`Chuyển sang ${nextSkill ? SKILL_LABEL[nextSkill] : "phần tiếp"}`}
				onConfirm={handleConfirmNext}
				onCancel={handleHideConfirmNext}
			/>
		</div>
	)
}

// ─── Page (with Suspense) ─────────────────────────────────────────────────────

function PhongThiPage() {
	const { sessionId } = Route.useParams()
	const { examId } = Route.useSearch()

	if (!examId) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
				<p className="text-foreground font-semibold">Không tìm thấy thông tin bài thi.</p>
				<a href="/thi-thu" className="text-sm text-primary hover:underline">
					Quay lại danh sách đề
				</a>
			</div>
		)
	}

	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center">
					<p className="text-muted text-sm">Đang tải phòng thi...</p>
				</div>
			}
		>
			<ExamRoom sessionId={sessionId} examId={examId} />
		</Suspense>
	)
}
