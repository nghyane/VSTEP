import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Suspense, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { ExamRoomHeader } from "#/features/exam/components/ExamRoomHeader"
import { ListeningPanel } from "#/features/exam/components/ListeningPanel"
import { ReadingPanel } from "#/features/exam/components/ReadingPanel"
import { SpeakingPanel } from "#/features/exam/components/SpeakingPanel"
import { SubmittedExamRoom } from "#/features/exam/components/SubmittedExamRoom"
import { WritingPanel } from "#/features/exam/components/WritingPanel"
import { examRoomQuery } from "#/features/exam/queries"
import type { Exam, ExamDraft, ExamSessionData, ExamVersion, SkillKey } from "#/features/exam/types"
import { useExamSession, useExamTimer } from "#/features/exam/use-exam-session"

export const Route = createFileRoute("/_focused/phong-thi/$sessionId")({
	component: PhongThiPage,
	errorComponent: ExamRoomError,
})

function ExamRoomError({ error }: { error: Error }) {
	const isMissingSession = error.message === "ExamSession not found."

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
			<img src="/mascot/lac-sad.png" alt="" className="size-24 object-contain" />
			<h1 className="font-extrabold text-2xl text-foreground">
				{isMissingSession ? "Lượt làm không còn tồn tại" : "Không mở được phòng thi"}
			</h1>
			<p className="max-w-md text-sm text-muted">
				{isMissingSession
					? "Lượt làm này đã hết hạn hoặc không còn khả dụng. Hãy quay lại đề thi để bắt đầu lượt mới."
					: error.message}
			</p>
			<Link to="/thi-thu" className="btn btn-primary mt-2">
				Về đề thi
			</Link>
		</div>
	)
}

// ─── Skill nav constants ──────────────────────────────────────────────────────

const SKILL_LABEL: Record<SkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

// ─── Inner exam room (data loaded) ───────────────────────────────────────────

function ExamRoom({ sessionId }: { sessionId: string }) {
	const { data: roomRes } = useSuspenseQuery(examRoomQuery(sessionId))
	const { session, exam, version, draft, listening_play_summary: listeningPlaySummary } = roomRes.data

	if (session.status !== "active") {
		return <SubmittedExamRoom sessionId={sessionId} />
	}

	return (
		<ActiveExamRoom
			sessionId={sessionId}
			session={session}
			exam={exam}
			version={version}
			initialDraft={draft}
			listeningPlaySummary={listeningPlaySummary}
		/>
	)
}

function ActiveExamRoom({
	sessionId,
	session,
	exam,
	version,
	initialDraft,
	listeningPlaySummary,
}: {
	sessionId: string
	session: ExamSessionData
	exam: Exam
	version: ExamVersion
	initialDraft: ExamDraft | null
	listeningPlaySummary: Array<{ section_id: string; part: number; played: boolean; played_at: string | null }>
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
		isAutoSubmitFailed,
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
		autosaveLabel,
	} = useExamSession({
		session,
		listeningItems,
		readingItems,
		writingTasks: version.writing_tasks,
		initialDraft,
		remainingSeconds,
	})

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
		return <SubmittedExamRoom sessionId={session.id} />
	}

	if (isAutoSubmitFailed) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
				<img src="/mascot/lac-sad.png" alt="" className="size-24 object-contain" />
				<div>
					<h2 className="text-xl font-bold text-foreground">Không nộp bài tự động được</h2>
					<p className="mt-2 max-w-md text-sm text-muted">
						Phòng thi đã hết giờ nhưng máy chủ chưa ghi nhận bài nộp. Hãy tải lại phòng thi để kiểm tra trạng
						thái mới nhất.
					</p>
				</div>
				<button type="button" onClick={() => window.location.reload()} className="btn btn-primary">
					Tải lại phòng thi
				</button>
			</div>
		)
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

	const skillProgress = `${state.skillIdx + 1}/${activeSkills.length}`
	const currentSkillLabel = currentSkill ? SKILL_LABEL[currentSkill] : "Phần thi"
	const footerStatusText =
		submitWarning ?? (isLastSkill ? "Sẵn sàng nộp bài" : `Sẵn sàng chốt ${currentSkillLabel}`)
	const nextLabel = nextSkill ? `Chốt ${currentSkillLabel} và sang ${SKILL_LABEL[nextSkill]}` : "Phần tiếp"
	const footer = {
		skillLabel: currentSkillLabel,
		skillProgress,
		isLastSkill,
		isSubmitting,
		statusText: footerStatusText,
		nextLabel,
		onSubmit: handleShowConfirmSubmit,
		onNext: handleShowConfirmNext,
	}

	return (
		<div className="flex h-screen flex-col bg-background">
			{/* Header */}
			<ExamRoomHeader
				examTitle={exam.title}
				skillLabel={currentSkillLabel}
				skillProgress={skillProgress}
				autosaveLabel={autosaveLabel}
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
						initialPlaySummary={listeningPlaySummary}
						mcqAnswers={state.mcqAnswers}
						onAnswer={handleAnswerMcq}
						footer={footer}
					/>
				)}
				{currentSkill === "reading" && (
					<ReadingPanel
						passages={version.reading_passages}
						mcqAnswers={state.mcqAnswers}
						onAnswer={handleAnswerMcq}
						footer={footer}
					/>
				)}
				{currentSkill === "writing" && (
					<WritingPanel
						tasks={version.writing_tasks}
						writingAnswers={state.writingAnswers}
						onAnswer={handleAnswerWriting}
						footer={footer}
					/>
				)}
				{currentSkill === "speaking" && (
					<SpeakingPanel
						parts={version.speaking_parts}
						speakingDone={speakingDone}
						onMarkDone={handleMarkSpeakingDone}
						onUnmarkDone={handleUnmarkSpeakingDone}
						footer={footer}
					/>
				)}
			</main>

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
				title={`Chốt ${currentSkill ? SKILL_LABEL[currentSkill] : "phần hiện tại"}?`}
				description={
					<>
						Sau khi chuyển sang {nextSkill ? SKILL_LABEL[nextSkill] : "phần tiếp theo"}, bạn sẽ{" "}
						<strong className="text-foreground">không thể quay lại</strong>{" "}
						{currentSkill ? SKILL_LABEL[currentSkill] : ""} để chỉnh sửa.
					</>
				}
				warning={
					currentSkillPending && currentSkillPending.count > 0 && currentSkill
						? `Còn ${currentSkillPending.count} ${currentSkillPending.unit} chưa làm ở phần ${SKILL_LABEL[currentSkill]}`
						: undefined
				}
				confirmLabel={nextSkill ? `Chốt và sang ${SKILL_LABEL[nextSkill]}` : "Chuyển phần"}
				onConfirm={handleConfirmNext}
				onCancel={handleHideConfirmNext}
			/>

			{/* Exit confirm dialog */}
			<ConfirmDialog
				open={confirmExit}
				title="Rời phòng thi?"
				description={<>Bài làm được lưu tự động. Bạn có thể quay lại tiếp tục trước khi hết giờ.</>}
				warning="Đọc kỹ trước khi xác nhận"
				confirmLabel="Rời phòng"
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

	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center">
					<p className="text-muted text-sm">Đang tải phòng thi…</p>
				</div>
			}
		>
			<ExamRoom sessionId={sessionId} />
		</Suspense>
	)
}
