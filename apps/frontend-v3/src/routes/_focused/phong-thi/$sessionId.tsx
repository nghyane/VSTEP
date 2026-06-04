import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Suspense, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { DeviceCheckScreen } from "#/features/exam/components/DeviceCheckScreen"
import { ExamRoomHeader } from "#/features/exam/components/ExamRoomHeader"
import { ListeningPanel } from "#/features/exam/components/ListeningPanel"
import { ReadingPanel } from "#/features/exam/components/ReadingPanel"
import { SpeakingPanel } from "#/features/exam/components/SpeakingPanel"
import { SubmittedExamRoom } from "#/features/exam/components/SubmittedExamRoom"
import { WritingPanel } from "#/features/exam/components/WritingPanel"
import { examDetailQuery, examDraftQuery, examSessionQuery } from "#/features/exam/queries"
import type { Exam, ExamDraft, ExamSessionData, ExamVersion, SkillKey } from "#/features/exam/types"
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

// ─── Inner exam room (data loaded) ───────────────────────────────────────────

function ExamRoom({ sessionId, examId }: { sessionId: string; examId: string }) {
	const { data: sessionRes } = useSuspenseQuery(examSessionQuery(sessionId))
	const session = sessionRes.data

	if (session.status !== "active") {
		return <SubmittedExamRoom sessionId={sessionId} examId={examId} />
	}

	return <ActiveExamRoomLoader sessionId={sessionId} examId={examId} session={session} />
}

function ActiveExamRoomLoader({
	sessionId,
	examId,
	session,
}: {
	sessionId: string
	examId: string
	session: ExamSessionData
}) {
	const { data: examRes } = useSuspenseQuery(examDetailQuery(examId))
	const { data: draftRes } = useSuspenseQuery(examDraftQuery(sessionId))
	const { version, exam } = examRes.data

	return (
		<ActiveExamRoom
			sessionId={sessionId}
			session={session}
			exam={exam}
			version={version}
			initialDraft={draftRes.data}
		/>
	)
}

function ActiveExamRoom({
	sessionId,
	session,
	exam,
	version,
	initialDraft,
}: {
	sessionId: string
	session: ExamSessionData
	exam: Exam
	version: ExamVersion
	initialDraft: ExamDraft | null
}) {
	const navigate = useNavigate()
	const [confirmExit, setConfirmExit] = useState(false)

	const listeningItems = version.listening_sections.flatMap((s) => s.items)
	const readingItems = version.reading_passages.flatMap((p) => p.items)

	const remainingSeconds = useExamTimer(session.server_deadline_at)

	const {
		state,
		activeSkills,
		currentSkill,
		isLastSkill,
		nextSkill,
		totalMcq,
		answeredMcq,
		isSubmitting,
		isTimeExpired,
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
		isSubmitted,
	} = useExamSession({
		session,
		listeningItems,
		readingItems,
		writingTasks: version.writing_tasks,
		initialDraft,
		remainingSeconds,
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
	const speakingDone = useMemo(() => new Set(state.speakingAnswers.keys()), [state.speakingAnswers])

	// Cảnh báo khi user cố đóng tab / refresh / bấm back browser trong lúc làm bài.
	useEffect(() => {
		if (state.phase !== "active") return
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
			e.returnValue = ""
		}
		window.addEventListener("beforeunload", handler)
		return () => window.removeEventListener("beforeunload", handler)
	}, [state.phase])

	// Only the CURRENT (last) skill is actionable at submit time — other skills are locked
	const currentSkillPending: { count: number; unit: string } | null = (() => {
		if (currentSkill === "listening") {
			const items = version.listening_sections.flatMap((s) => s.items)
			const unanswered = items.filter((i) => !state.mcqAnswers.has(i.id)).length
			return { count: unanswered, unit: "câu" }
		}
		if (currentSkill === "reading") {
			const items = version.reading_passages.flatMap((p) => p.items)
			const unanswered = items.filter((i) => !state.mcqAnswers.has(i.id)).length
			return { count: unanswered, unit: "câu" }
		}
		if (currentSkill === "writing") {
			const incomplete = version.writing_tasks.filter((t) => {
				const text = state.writingAnswers.get(t.id) ?? ""
				const wc = text.trim().split(/\s+/).filter(Boolean).length
				return wc < t.min_words
			}).length
			return { count: incomplete, unit: "phần viết chưa đủ từ" }
		}
		if (currentSkill === "speaking") {
			return {
				count: version.speaking_parts.length - state.speakingAnswers.size,
				unit: "phần chưa ghi âm",
			}
		}
		return null
	})()

	const submitWarning =
		currentSkillPending && currentSkillPending.count > 0 && currentSkill
			? `Còn ${currentSkillPending.count} ${currentSkillPending.unit} chưa làm ở phần ${SKILL_LABEL[currentSkill]}`
			: undefined

	if (isSubmitted) {
		return <SubmittedExamRoom sessionId={session.id} examId={exam.id} />
	}

	// Hết giờ — hiện overlay thông báo đang nộp bài tự động
	if (isTimeExpired) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
				<div className="flex size-20 items-center justify-center rounded-full bg-warning/10">
					<svg
						viewBox="0 0 24 24"
						className="size-10 text-warning"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12,6 12,12 16,14" />
					</svg>
				</div>
				<div className="text-center">
					<h2 className="text-xl font-bold text-foreground">Hết giờ làm bài</h2>
					<p className="mt-2 text-sm text-muted">Đang nộp bài tự động, vui lòng chờ...</p>
				</div>
				<div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
			</div>
		)
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
			<ExamRoomHeader
				remainingSeconds={remainingSeconds}
				answeredMcq={answeredMcq}
				totalMcq={totalMcq}
				onExit={() => setConfirmExit(true)}
			/>

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
						speakingDone={speakingDone}
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
				description={
					<>
						Các kỹ năng trước đã chốt, không thể quay lại.
						<br />
						Sau khi nộp, bài thi sẽ được chấm và bạn không thể chỉnh sửa đáp án.
					</>
				}
				warning={submitWarning}
				confirmLabel="Nộp bài"
				loadingLabel="Đang nộp…"
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
				warning={
					currentSkillPending && currentSkillPending.count > 0 && currentSkill
						? `Còn ${currentSkillPending.count} ${currentSkillPending.unit} chưa làm ở phần ${SKILL_LABEL[currentSkill]}`
						: undefined
				}
				confirmLabel={`Chuyển sang ${nextSkill ? SKILL_LABEL[nextSkill] : "phần tiếp"}`}
				onConfirm={handleConfirmNext}
				onCancel={handleHideConfirmNext}
			/>

			{/* Exit confirm dialog */}
			<ConfirmDialog
				open={confirmExit}
				title="Thoát phòng thi?"
				description={
					<>
						Tiến trình hiện tại <strong className="text-foreground">sẽ không được lưu</strong>. Bạn sẽ phải
						bắt đầu lại từ đầu nếu quay lại đề này.
					</>
				}
				warning="Đọc kỹ trước khi xác nhận"
				confirmLabel="Thoát"
				cancelLabel="Ở lại"
				countdownSeconds={3}
				destructive
				onConfirm={() => {
					setConfirmExit(false)
					navigate({ to: "/thi-thu" })
				}}
				onCancel={() => setConfirmExit(false)}
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
