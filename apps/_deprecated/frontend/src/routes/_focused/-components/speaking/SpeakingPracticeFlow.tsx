import { Loading03Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	useCompletePractice,
	usePracticeSession,
	useStartPractice,
	useSubmitPracticeAnswer,
} from "@/hooks/use-practice"
import type {
	PracticeItem,
	PracticeSession,
	PracticeStartResponse,
	SessionQuestion,
	SubmissionAnswer,
} from "@/types/api"
import { SpeakingExamPanel } from "./SpeakingExamPanel"

const SPEAKING_PRACTICE_MODE = "free" as const

function persistSessionToUrl(sessionId: string) {
	const url = new URL(window.location.href)
	url.searchParams.set("session", sessionId)
	window.history.replaceState(null, "", url.toString())
}

function clearSessionFromUrl() {
	const url = new URL(window.location.href)
	url.searchParams.delete("session")
	window.history.replaceState(null, "", url.toString())
}

interface SpeakingPracticeFlowProps {
	part?: number
	resumeSessionId?: string
}

export function SpeakingPracticeFlow({ part, resumeSessionId }: SpeakingPracticeFlowProps) {
	const [session, setSession] = useState<PracticeSession | null>(null)
	const [item, setItem] = useState<PracticeItem | null>(null)
	const [phase, setPhase] = useState<"loading" | "practicing" | "submitting" | "submitted">(
		"loading",
	)
	const [error, setError] = useState<string | null>(null)
	const [answers, setAnswers] = useState<Map<string, SubmissionAnswer>>(new Map())
	const [sessionCompleted, setSessionCompleted] = useState(false)

	const navigate = useNavigate()
	const startMutation = useStartPractice()
	const hasInitRef = useRef(false)
	const submitMutation = useSubmitPracticeAnswer(session?.id ?? "")

	const {
		data: resumeData,
		isError: resumeFailed,
		isLoading: resumeLoading,
	} = usePracticeSession(resumeSessionId && !session ? resumeSessionId : null)

	// Init or resume session
	useEffect(() => {
		if (hasInitRef.current || session) return
		if (resumeSessionId && resumeLoading) return

		if (resumeData && !resumeData.session.completedAt) {
			if (!resumeData.currentItem) {
				clearSessionFromUrl()
				setError("Phiên luyện tập này không còn câu hỏi hợp lệ.")
				setPhase("loading")
				return
			}

			hasInitRef.current = true
			setSession(resumeData.session)
			setItem(resumeData.currentItem)
			setPhase("practicing")
			return
		}

		if (!resumeSessionId || resumeFailed || resumeData?.session.completedAt) {
			hasInitRef.current = true
			if (resumeFailed) clearSessionFromUrl()

			startMutation.mutate(
				{ skill: "speaking", mode: SPEAKING_PRACTICE_MODE, itemsCount: 1, part },
				{
					onSuccess: (data: PracticeStartResponse) => {
						setSession(data.session)
						setItem(data.currentItem)
						if (!data.currentItem) {
							setError("Hiện chưa có bài tập phù hợp. Vui lòng thử lại sau.")
							setPhase("loading")
							return
						}
						setPhase("practicing")
						persistSessionToUrl(data.session.id)
					},
					onError: (err) => {
						setError(err.message)
						setPhase("loading")
					},
				},
			)
		}
	}, [startMutation, part, resumeSessionId, resumeFailed, resumeData, resumeLoading, session])

	// Complete session after submit
	const completeMutation = useCompletePractice(session?.id ?? "")
	useEffect(() => {
		if (phase === "submitted" && session && !sessionCompleted) {
			setSessionCompleted(true)
			completeMutation.mutate()
		}
	}, [phase, session, sessionCompleted, completeMutation])

	const handleUpdateSpeaking = useCallback(
		(questionId: string, audioPath: string, durationSeconds: number) => {
			setAnswers((prev) => {
				const next = new Map(prev)
				next.set(questionId, { audioPath, durationSeconds })
				return next
			})
		},
		[],
	)

	const handleSubmit = useCallback(() => {
		if (!item || answers.size === 0) return
		setPhase("submitting")

		const [questionId, answer] = [...answers.entries()][0]
		const speakingAnswer = answer as { audioPath: string; durationSeconds: number }
		submitMutation.mutate(
			{
				questionId,
				answer: {
					audioPath: speakingAnswer.audioPath,
					durationSeconds: speakingAnswer.durationSeconds,
				},
			},
			{
				onSuccess: () => {
					setPhase("submitted")
				},
				onError: (err) => {
					setError(err.message)
					setPhase("practicing")
				},
			},
		)
	}, [item, answers, submitMutation])

	const handlePracticeAgain = useCallback(() => {
		navigate({
			to: "/exercise",
			search: { skill: "speaking", id: "", part: part ? String(part) : "", level: "", session: "" },
			replace: true,
		})
		setSession(null)
		setItem(null)
		setAnswers(new Map())
		setPhase("loading")
		setError(null)
		setSessionCompleted(false)
		hasInitRef.current = false
	}, [navigate, part])

	// Loading state
	if (phase === "loading" && !error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3">
				<HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Đang tạo phiên luyện tập...</p>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
				<div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
					<span className="text-xl">&#x26A0;&#xFE0F;</span>
				</div>
				<div className="space-y-1 text-center">
					<p className="font-semibold text-destructive">Không thể tạo phiên luyện tập</p>
					<p className="text-sm text-muted-foreground">{error}</p>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						if (resumeSessionId) clearSessionFromUrl()
						setError(null)
						setSession(null)
						setItem(null)
						hasInitRef.current = false
						setPhase("loading")
					}}
				>
					Thử lại
				</Button>
			</div>
		)
	}

	// Submitted state
	if (phase === "submitted") {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
				<div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
					<HugeiconsIcon icon={Mic01Icon} className="size-7 text-emerald-600" />
				</div>
				<div className="space-y-1 text-center">
					<p className="font-semibold">Đã nộp bài nói</p>
					<p className="text-sm text-muted-foreground">
						Bài ghi âm của bạn đã được gửi. Hệ thống sẽ chấm điểm và phản hồi sau.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link to="/practice/speaking">Quay lại</Link>
					</Button>
					<Button onClick={handlePracticeAgain}>Luyện bài khác</Button>
				</div>
			</div>
		)
	}

	// Submitting state
	if (phase === "submitting") {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3">
				<HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Đang nộp bài...</p>
			</div>
		)
	}

	// Practicing state
	if (!item) return null

	const question = item.question
	const questions: SessionQuestion[] = [
		{
			id: question.id,
			part: question.part,
			content: question.content,
			skill: question.skill,
		},
	]

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<SpeakingExamPanel
				questions={questions}
				answers={answers}
				onUpdateSpeaking={handleUpdateSpeaking}
			/>

			{/* Submit bar */}
			<footer className="flex h-14 shrink-0 items-center justify-center gap-3 border-t px-4">
				{answers.size > 0 ? (
					<Button size="lg" className="rounded-xl px-8" onClick={handleSubmit}>
						Nộp bài
					</Button>
				) : (
					<p className="text-sm text-muted-foreground">Ghi âm xong rồi bấm nộp bài</p>
				)}
			</footer>
		</div>
	)
}
