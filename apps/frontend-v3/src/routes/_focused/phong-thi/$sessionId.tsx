import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Suspense, useEffect, useMemo, useState } from "react"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { DeviceCheckScreen } from "#/features/exam/components/DeviceCheckScreen"
import { ExamRoomHeader } from "#/features/exam/components/ExamRoomHeader"
import { LacCoinMascot } from "#/features/exam/components/LacCoinMascot"
import { ListeningPanel } from "#/features/exam/components/ListeningPanel"
import { ReadingPanel } from "#/features/exam/components/ReadingPanel"
import { ResultBackground } from "#/features/exam/components/ResultBackground"
import { SpeakingPanel } from "#/features/exam/components/SpeakingPanel"
import { WritingPanel } from "#/features/exam/components/WritingPanel"
import { examDetailQuery, examSessionQuery, sessionResultsQuery } from "#/features/exam/queries"
import type { Exam, ExamSessionData, ExamVersion, SkillKey, SubmitSessionResult } from "#/features/exam/types"
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

// ─── Result screen (shown after submit) ──────────────────────────────────────

interface PerfRow {
	label: string
	total: number
	correct: number
	wrong: number
	accuracyPct: number
	pending?: boolean
}

function buildPerfRows(
	version: ExamVersion,
	activeSkills: SkillKey[],
	items: SubmitSessionResult["mcq"]["items"],
): PerfRow[] {
	const correctByItemId = new Map<string, boolean>()
	for (const it of items) correctByItemId.set(it.item_ref_id, it.is_correct)

	const rows: PerfRow[] = []

	if (activeSkills.includes("listening")) {
		// Gộp section cùng `part` (VSTEP Part 1 = 8 announcements × 1 item, vụn vặt nếu hiển thị riêng).
		const byPart = new Map<number, typeof version.listening_sections>()
		for (const sec of version.listening_sections) {
			const arr = byPart.get(sec.part) ?? []
			arr.push(sec)
			byPart.set(sec.part, arr)
		}
		const partsAsc = [...byPart.entries()].sort((a, b) => a[0] - b[0])
		for (const [part, secs] of partsAsc) {
			const allItems = secs.flatMap((s) => s.items)
			const total = allItems.length
			const correct = allItems.reduce((n, it) => n + (correctByItemId.get(it.id) ? 1 : 0), 0)
			rows.push({
				label: `Nghe · Part ${part}`,
				total,
				correct,
				wrong: total - correct,
				accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
			})
		}
	}
	if (activeSkills.includes("reading")) {
		const sorted = [...version.reading_passages].sort(
			(a, b) => a.part - b.part || a.display_order - b.display_order,
		)
		for (const p of sorted) {
			const total = p.items.length
			const correct = p.items.reduce((n, it) => n + (correctByItemId.get(it.id) ? 1 : 0), 0)
			rows.push({
				label: `Đọc · ${p.title}`,
				total,
				correct,
				wrong: total - correct,
				accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
			})
		}
	}
	if (activeSkills.includes("writing")) {
		const n = version.writing_tasks.length
		rows.push({ label: `Viết · ${n} bài`, total: n, correct: 0, wrong: 0, accuracyPct: 0, pending: true })
	}
	if (activeSkills.includes("speaking")) {
		const n = version.speaking_parts.length
		rows.push({ label: `Nói · ${n} phần`, total: n, correct: 0, wrong: 0, accuracyPct: 0, pending: true })
	}
	return rows
}

function ResultScreen({
	result,
	examTitle,
	examId,
	sessionId,
	version,
	activeSkills,
}: {
	result: SubmitSessionResult
	examTitle: string
	examId: string
	sessionId: string
	version: ExamVersion
	activeSkills: SkillKey[]
}) {
	const { score: mcqScore, total: mcqTotal } = result.mcq
	const scoreOn10 = mcqTotal > 0 ? (mcqScore / mcqTotal) * 10 : 0
	const rows = useMemo(
		() => buildPerfRows(version, activeSkills, result.mcq.items),
		[version, activeSkills, result.mcq.items],
	)
	const hasPending = rows.some((r) => r.pending)

	return (
		<div className="relative flex min-h-screen flex-col items-center overflow-hidden">
			<ResultBackground />

			{/* Top-right "Hoàn thành" pill — gamified */}
			<div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
				<Link
					to="/thi-thu"
					className="group inline-flex items-center gap-2.5 rounded-full border-2 border-b-4 border-white/50 bg-white/25 py-2 pl-2 pr-5 text-base font-extrabold text-white shadow-lg backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/35 active:translate-y-0 active:border-b-2"
				>
					<span className="flex size-7 items-center justify-center rounded-full border-2 border-b-[3px] border-coin-dark bg-coin shadow-inner transition-transform group-hover:rotate-12">
						<Icon name="check" size="xs" className="text-white" />
					</span>
					Hoàn thành
				</Link>
			</div>

			<div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-10">
				<h1 className="mb-5 text-xl font-extrabold text-white drop-shadow-sm">Kết quả</h1>

				<div className="w-full max-w-3xl overflow-hidden rounded-(--radius-banner) border-2 border-b-4 border-white/20 bg-white shadow-2xl">
					{/* Top: mascot + congrats */}
					<div className="flex items-center gap-5 px-8 py-6">
						<LacCoinMascot score={scoreOn10} className="w-40 shrink-0 sm:w-52" />

						<div className="min-w-0 flex-1">
							<p className="text-sm text-subtle">Chúc mừng!</p>
							<p className="mt-0.5 text-2xl font-extrabold text-foreground sm:text-3xl">Thí sinh</p>
							<p className="mt-1 text-sm text-muted">
								đã hoàn thành bài kiểm tra <span className="font-bold text-foreground">{examTitle}</span>
							</p>

							<div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
								<ScorePill value={mcqScore} total={mcqTotal} label="Số câu đúng" variant="success" />
								<ScorePill
									value={mcqTotal - mcqScore}
									total={mcqTotal}
									label="Câu trả lời sai"
									variant="danger"
								/>
							</div>
						</div>
					</div>

					<div className="mx-6 h-px bg-border" />

					{/* Performance table */}
					<div className="px-6 py-5">
						<p className="mb-4 text-base font-extrabold text-foreground">Performance</p>
						<ScrollArea
							className="rounded-(--radius-card) border-2 border-b-4 border-border"
							maxHeight={320}
							thumbClassName="w-1.5 bg-placeholder/70 hover:bg-subtle"
						>
							<PerformanceTable rows={rows} />
						</ScrollArea>
						{hasPending && (
							<p className="mt-3 text-xs text-muted">
								Writing và Speaking đang được AI chấm — kết quả sẽ hiển thị sau vài phút.
							</p>
						)}
					</div>

					<div className="flex flex-wrap justify-center gap-3 px-6 pb-7">
						<Link to="/thi-thu" className="btn btn-secondary">
							Về danh sách đề
						</Link>
						{mcqTotal > 0 && (
							<Link
								to="/phong-thi/$sessionId/chi-tiet"
								params={{ sessionId }}
								search={{ examId }}
								className="btn btn-primary"
							>
								Xem chi tiết
								<Icon name="lightning" size="xs" className="text-white" />
							</Link>
						)}
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
		<div className="inline-flex items-baseline gap-2">
			<div
				className={cn(
					"inline-flex items-center rounded-(--radius-button) border-2 border-b-4 px-3 py-1",
					isSuccess ? "border-primary/30 bg-primary-tint" : "border-destructive/30 bg-destructive-tint",
				)}
			>
				<span
					className={cn(
						"text-lg font-extrabold tabular-nums leading-none",
						isSuccess ? "text-primary" : "text-destructive",
					)}
				>
					{value}/{total}
				</span>
			</div>
			<span className="text-xs text-muted">{label}</span>
		</div>
	)
}

function PerformanceTable({ rows }: { rows: PerfRow[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="sticky top-0 z-10 border-b-2 border-border bg-background">
						<th className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-subtle">
							Loại câu hỏi
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Tổng
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Đúng
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Sai
						</th>
						<th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide text-subtle">
							Tỷ lệ
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, idx) => (
						<tr
							key={row.label}
							className={cn(
								"border-b border-border-light last:border-0",
								idx % 2 === 1 && "bg-background/40",
							)}
						>
							<td className="px-4 py-3 font-medium text-foreground">{row.label}</td>
							<td className="px-4 py-3 text-center tabular-nums text-muted">{row.total}</td>
							<td className="px-4 py-3 text-center tabular-nums">
								{row.pending ? (
									<span className="text-subtle">—</span>
								) : (
									<span className={cn("font-bold", row.correct > 0 ? "text-primary" : "text-subtle")}>
										{row.correct}
									</span>
								)}
							</td>
							<td className="px-4 py-3 text-center tabular-nums">
								{row.pending ? (
									<span className="text-subtle">—</span>
								) : (
									<span className={row.wrong > 0 ? "text-destructive" : "text-subtle"}>{row.wrong}</span>
								)}
							</td>
							<td className="px-4 py-3 text-center">
								{row.pending ? <PendingBadge /> : <AccuracyBadge pct={row.accuracyPct} />}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function AccuracyBadge({ pct }: { pct: number }) {
	const tone =
		pct >= 70
			? "border-primary/30 bg-primary-tint text-primary"
			: pct >= 40
				? "border-warning/30 bg-warning-tint text-warning"
				: "border-destructive/30 bg-destructive-tint text-destructive"
	return (
		<span
			className={cn(
				"inline-flex items-center justify-center rounded-full border-2 border-b-4 px-2.5 py-0.5 text-xs font-extrabold tabular-nums",
				tone,
			)}
		>
			{pct}%
		</span>
	)
}

function PendingBadge() {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border-2 border-b-4 border-warning/30 bg-warning-tint px-2.5 py-0.5 text-xs font-extrabold text-warning">
			<span className="relative flex size-1.5">
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-60" />
				<span className="relative inline-flex size-1.5 rounded-full bg-warning" />
			</span>
			AI đang chấm
		</span>
	)
}

// ─── Submitted session view (re-render result from server) ───────────────────

function SubmittedResultView({
	sessionId,
	exam,
	version,
	session,
}: {
	sessionId: string
	exam: Exam
	version: ExamVersion
	session: ExamSessionData
}) {
	const { data: resultsRes } = useSuspenseQuery(sessionResultsQuery(sessionId))
	const mcqDetail = resultsRes.data.mcq_detail
	const { score, total } = resultsRes.data.mcq

	const result: SubmitSessionResult = {
		session_id: sessionId,
		status: session.status,
		submitted_at: session.submitted_at ?? "",
		mcq: {
			score,
			total,
			items: mcqDetail.map((d) => ({
				item_ref_type: d.item_ref_type,
				item_ref_id: d.item_ref_id,
				selected_index: d.selected_index ?? -1,
				correct_index: d.correct_index,
				is_correct: d.is_correct,
			})),
		},
		writing_jobs: [],
		speaking_jobs: [],
	}

	return (
		<ResultScreen
			result={result}
			examTitle={exam.title}
			examId={exam.id}
			sessionId={sessionId}
			version={version}
			activeSkills={session.selected_skills}
		/>
	)
}

// ─── Inner exam room (data loaded) ───────────────────────────────────────────

function ExamRoom({ sessionId, examId }: { sessionId: string; examId: string }) {
	const { data: sessionRes } = useSuspenseQuery(examSessionQuery(sessionId))
	const { data: examRes } = useSuspenseQuery(examDetailQuery(examId))

	const session = sessionRes.data
	const { version, exam } = examRes.data

	if (session.status !== "active") {
		return <SubmittedResultView sessionId={sessionId} exam={exam} version={version} session={session} />
	}

	return <ActiveExamRoom sessionId={sessionId} session={session} exam={exam} version={version} />
}

function ActiveExamRoom({
	sessionId,
	session,
	exam,
	version,
}: {
	sessionId: string
	session: ExamSessionData
	exam: Exam
	version: ExamVersion
}) {
	const navigate = useNavigate()
	const [submitResult, setSubmitResult] = useState<SubmitSessionResult | null>(null)
	const [confirmExit, setConfirmExit] = useState(false)

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
		writingTasks: version.writing_tasks,
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

	// Cảnh báo khi user cố đóng tab / refresh / bấm back browser trong lúc làm bài.
	useEffect(() => {
		if (state.phase !== "active" || submitResult) return
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
			e.returnValue = ""
		}
		window.addEventListener("beforeunload", handler)
		return () => window.removeEventListener("beforeunload", handler)
	}, [state.phase, submitResult])

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
				count: version.speaking_parts.length - state.speakingDone.size,
				unit: "phần chưa ghi âm",
			}
		}
		return null
	})()

	const submitWarning =
		currentSkillPending && currentSkillPending.count > 0 && currentSkill
			? `Còn ${currentSkillPending.count} ${currentSkillPending.unit} chưa làm ở phần ${SKILL_LABEL[currentSkill]}`
			: undefined

	if (submitResult) {
		return (
			<ResultScreen
				result={submitResult}
				examTitle={exam.title}
				examId={exam.id}
				sessionId={session.id}
				version={version}
				activeSkills={activeSkills}
			/>
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
