import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { AlertTriangle, CheckCircle2, Clock, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import {
	countAnswered,
	countTotalItems,
	type ExamSkillKey,
	type MCQAnswerMap,
	mockGetExamSession,
	type SpeakingDoneSet,
	type WritingAnswerMap,
} from "#/lib/mock/exam-session"
import { buildResultFromSession, savePhongThiResult } from "#/lib/practice/phong-thi-result"
import { cn } from "#/lib/utils"
import { DeviceCheckScreen } from "./-components/DeviceCheckScreen"
import { ListeningExamPanel } from "./-components/ListeningExamPanel"
import { ReadingExamPanel } from "./-components/ReadingExamPanel"
import { SpeakingExamPanel } from "./-components/SpeakingExamPanel"
import { WritingExamPanel } from "./-components/WritingExamPanel"

interface Search {
	sections?: string
	minutes?: number
	durationMode?: "unlimited"
}

export const Route = createFileRoute("/_focused/phong-thi/$examId/")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		sections: typeof search.sections === "string" ? search.sections : undefined,
		durationMode: search.durationMode === "unlimited" ? "unlimited" : undefined,
		minutes:
			typeof search.minutes === "number"
				? search.minutes
				: typeof search.minutes === "string" && !Number.isNaN(Number(search.minutes))
					? Number(search.minutes)
					: undefined,
	}),
	component: ExamPage,
})

// ─── Skill order & labels ─────────────────────────────────────────────────────

const SKILL_ORDER: ExamSkillKey[] = ["listening", "reading", "writing", "speaking"]

const SKILL_LABEL: Record<ExamSkillKey, string> = {
	listening: "Nghe",
	reading: "Đọc",
	writing: "Viết",
	speaking: "Nói",
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useCountdown(
	durationMinutes: number,
	started: boolean,
	isUnlimited: boolean,
): number | null {
	const [remaining, setRemaining] = useState<number | null>(
		isUnlimited ? null : durationMinutes * 60,
	)

	useEffect(() => {
		setRemaining(isUnlimited ? null : durationMinutes * 60)
	}, [durationMinutes, isUnlimited])

	useEffect(() => {
		if (!started || isUnlimited) return
		const id = setInterval(
			() => setRemaining((r) => (r === null ? durationMinutes * 60 : Math.max(0, r - 1))),
			1000,
		)
		return () => clearInterval(id)
	}, [durationMinutes, started, isUnlimited])

	return remaining
}

function formatTime(seconds: number | null): string {
	if (seconds === null) return "∞"
	if (seconds <= 0) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function parseSelectedSectionIds(sections?: string): string[] {
	if (!sections) return []
	return sections
		.split(",")
		.map((sectionId) => sectionId.trim())
		.filter(Boolean)
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ExamPage() {
	const { examId } = Route.useParams()
	const { sections, minutes, durationMode } = Route.useSearch()
	const navigate = useNavigate()
	const selectedSectionIds = parseSelectedSectionIds(sections)
	const speakingRecordingStorageKey = `focused-exam:speaking:${examId}:${sections ?? "full"}`
	const isUnlimited = durationMode === "unlimited"
	const session = mockGetExamSession(Number(examId), {
		sectionIds: selectedSectionIds,
		durationMinutes: minutes ?? null,
	})

	// Determine which skills are present in this session
	const activeSkills = SKILL_ORDER.filter((sk) => {
		if (sk === "listening") return session.listening.length > 0
		if (sk === "reading") return session.reading.length > 0
		if (sk === "writing") return session.writing.length > 0
		if (sk === "speaking") return session.speaking.length > 0
		return false
	})

	// ─── State ────────────────────────────────────────────────────────────────
	const [deviceChecked, setDeviceChecked] = useState(false)
	const [currentSkillIdx, setCurrentSkillIdx] = useState(0)
	const [confirming, setConfirming] = useState(false)
	const [confirmingNext, setConfirmingNext] = useState(false)

	// Answer state
	const [mcqAnswers, setMcqAnswers] = useState<MCQAnswerMap>(new Map())
	const [writingAnswers, setWritingAnswers] = useState<WritingAnswerMap>(new Map())
	const [speakingDone, setSpeakingDone] = useState<SpeakingDoneSet>(new Set())

	const remaining = useCountdown(session.durationMinutes, deviceChecked, isUnlimited)

	// Block navigation while exam is active
	useEffect(() => {
		if (!deviceChecked) return
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
		}
		window.addEventListener("beforeunload", handler)
		return () => window.removeEventListener("beforeunload", handler)
	}, [deviceChecked])

	// ─── Handlers ─────────────────────────────────────────────────────────────

	const handleMCQAnswer = useCallback((sectionId: string, itemIndex: number, letter: string) => {
		setMcqAnswers((prev) => {
			const next = new Map(prev)
			const existing = next.get(sectionId) ?? {}
			next.set(sectionId, { ...existing, [String(itemIndex + 1)]: letter })
			return next
		})
	}, [])

	const handleWritingAnswer = useCallback((taskId: string, text: string) => {
		setWritingAnswers((prev) => {
			const next = new Map(prev)
			next.set(taskId, text)
			return next
		})
	}, [])

	const handleSpeakingDone = useCallback((partId: string) => {
		setSpeakingDone((prev) => new Set([...prev, partId]))
	}, [])

	const handleConfirmNext = useCallback(() => {
		setConfirmingNext(false)
		setCurrentSkillIdx((i) => Math.min(activeSkills.length - 1, i + 1))
	}, [activeSkills.length])

	const handleSubmit = useCallback(() => {
		setConfirming(false)
		savePhongThiResult(buildResultFromSession(examId, session, mcqAnswers, writingAnswers, speakingDone))
		navigate({ to: "/phong-thi/$examId/ket-qua", params: { examId } })
	}, [navigate, examId, session, mcqAnswers, writingAnswers, speakingDone])

	// ─── Derived values ───────────────────────────────────────────────────────

	const currentSkill = activeSkills[currentSkillIdx] ?? activeSkills[0]
	const isLastSkill = currentSkillIdx >= activeSkills.length - 1
	const totalItems = countTotalItems(session)
	const answeredItems = countAnswered(session, mcqAnswers, writingAnswers, speakingDone)
	const nextSkill = activeSkills[currentSkillIdx + 1]

	// ─── DeviceCheckScreen ────────────────────────────────────────────────────

	if (!deviceChecked) {
		return (
			<DeviceCheckScreen
				session={session}
				isUnlimited={isUnlimited}
				onStart={() => setDeviceChecked(true)}
			/>
		)
	}

	// ─── Exam shell ───────────────────────────────────────────────────────────

	return (
		<div className="flex h-screen flex-col">
			{/* Header */}
			<header className="z-40 flex h-12 shrink-0 items-center justify-between border-b-2 bg-card px-4 shadow-sm">
				<div className="flex items-center gap-2">
					<div
						className={cn(
							"flex items-center gap-1.5 rounded-full px-3 py-1",
							remaining !== null && remaining <= 300
								? "bg-destructive/10 text-destructive"
								: "bg-muted",
						)}
					>
						<Clock className="size-3.5" />
						<span className="text-sm font-semibold tabular-nums">{formatTime(remaining)}</span>
					</div>
				</div>

				<div className="flex items-center gap-1 text-sm">
					<span className="font-bold tabular-nums text-foreground">{answeredItems}</span>
					<span className="text-muted-foreground">/{totalItems} đã trả lời</span>
				</div>

				<Button variant="ghost" size="sm" asChild>
					<Link to="/thi-thu">
						<X className="size-4" />
						<span className="hidden sm:inline">Thoát</span>
					</Link>
				</Button>
			</header>

			{/* Body — skill panel */}
			{currentSkill === "listening" && (
				<ListeningExamPanel
					sections={session.listening}
					answers={mcqAnswers}
					onAnswer={handleMCQAnswer}
				/>
			)}
			{currentSkill === "reading" && (
				<ReadingExamPanel
					passages={session.reading}
					answers={mcqAnswers}
					onAnswer={handleMCQAnswer}
				/>
			)}
			{currentSkill === "writing" && (
				<WritingExamPanel
					tasks={session.writing}
					answers={writingAnswers}
					onAnswer={handleWritingAnswer}
				/>
			)}
			{currentSkill === "speaking" && (
				<SpeakingExamPanel
					parts={session.speaking}
					doneParts={speakingDone}
					storageKey={speakingRecordingStorageKey}
					onPartDone={handleSpeakingDone}
				/>
			)}

			{/* Footer */}
			<footer className="z-40 flex h-12 shrink-0 items-center justify-between border-t-2 bg-card px-4">
				<div className="w-24" />

				{currentSkill && (
					<div className="flex items-center gap-1">
						<span className="text-sm font-semibold">{SKILL_LABEL[currentSkill]}</span>
						<span className="text-xs text-muted-foreground">
							({currentSkillIdx + 1}/{activeSkills.length})
						</span>
					</div>
				)}

				{isLastSkill ? (
					<Button size="sm" onClick={() => setConfirming(true)}>
						<CheckCircle2 className="size-4" />
						Nộp bài
					</Button>
				) : (
					<Button variant="outline" size="sm" onClick={() => setConfirmingNext(true)}>
						<span className="hidden sm:inline">Phần tiếp</span>→
					</Button>
				)}
			</footer>

			{/* Confirm submit dialog */}
			<Dialog open={confirming} onOpenChange={setConfirming}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Bạn có chắc muốn nộp bài?</DialogTitle>
						<DialogDescription>Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.</DialogDescription>
					</DialogHeader>
					{answeredItems < totalItems && (
						<p className="text-sm text-amber-600">
							⚠ Bạn chưa trả lời hết ({totalItems - answeredItems} câu còn trống)
						</p>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setConfirming(false)}>
							Hủy
						</Button>
						<Button onClick={handleSubmit}>
							<CheckCircle2 className="size-4" />
							Nộp bài
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirm next skill dialog */}
			<Dialog open={confirmingNext} onOpenChange={setConfirmingNext}>
				<DialogContent>
					<DialogHeader className="items-center text-center">
						<div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10">
							<AlertTriangle className="size-7 text-amber-500" />
						</div>
						<DialogTitle>Chuyển sang phần {nextSkill ? SKILL_LABEL[nextSkill] : ""}?</DialogTitle>
						<DialogDescription className="text-balance text-center">
							Sau khi chuyển, bạn sẽ{" "}
							<span className="font-semibold text-foreground">không thể quay lại</span> phần{" "}
							{currentSkill ? SKILL_LABEL[currentSkill] : ""} để chỉnh sửa câu trả lời.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2 sm:justify-center">
						<Button variant="outline" onClick={() => setConfirmingNext(false)}>
							Ở lại
						</Button>
						<Button onClick={handleConfirmNext}>Chuyển phần →</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
