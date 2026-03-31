import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	useCompletePractice,
	useGenerateTemplate,
	usePracticeSession,
	useStartPractice,
	useSubmission,
	useSubmitPracticeAnswer,
} from "@/hooks/use-practice"
import type {
	PracticeItem,
	PracticeSession,
	PracticeStartResponse,
	WritingContent,
	WritingHints,
	WritingTier,
} from "@/types/api"
import { WritingGradingResult } from "./WritingGradingResult"
import { WritingTemplateEditor } from "./WritingTemplateEditor"

// ═══════════════════════════════════════════════════
// Type guards
// ═══════════════════════════════════════════════════

function isWritingContent(c: unknown): c is WritingContent {
	return c !== null && typeof c === "object" && "prompt" in (c as Record<string, unknown>)
}

// ═══════════════════════════════════════════════════
// Tier labels
// ═══════════════════════════════════════════════════

const TIER_META: Record<number, { label: string; color: string }> = {
	1: {
		label: "Cấp 1 — Trợ nhiệt tình",
		color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	2: {
		label: "Cấp 2 — Gợi ý khung",
		color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	3: {
		label: "Cấp 3 — Thực chiến",
		color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	},
}

// ═══════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════

interface WritingPracticeFlowProps {
	part?: number
	resumeSessionId?: string
}

// ═══════════════════════════════════════════════════
// URL helpers — persist sessionId for resume on refresh
// ═══════════════════════════════════════════════════

function persistSessionToUrl(sessionId: string) {
	const url = new URL(window.location.href)
	url.searchParams.set("session", sessionId)
	window.history.replaceState(null, "", url.toString())
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

export function WritingPracticeFlow({ part, resumeSessionId }: WritingPracticeFlowProps) {
	const [session, setSession] = useState<PracticeSession | null>(null)
	const [item, setItem] = useState<PracticeItem | null>(null)
	const [tier, setTier] = useState<WritingTier>(3)
	const [writingText, setWritingText] = useState("")
	const [submissionId, setSubmissionId] = useState<string | null>(null)
	const [phase, setPhase] = useState<"loading" | "writing" | "submitting" | "grading" | "result">(
		"loading",
	)
	const [error, setError] = useState<string | null>(null)
	const [sessionCompleted, setSessionCompleted] = useState(false)

	const navigate = useNavigate()
	const startMutation = useStartPractice()
	const hasInitRef = useRef(false)

	// Resume existing session
	const {
		data: resumeData,
		isError: resumeFailed,
		isLoading: resumeLoading,
	} = usePracticeSession(resumeSessionId && !session ? resumeSessionId : null)

	// Single init effect: resume or start new
	useEffect(() => {
		if (hasInitRef.current || session) return

		// Still loading resume data — wait
		if (resumeSessionId && resumeLoading) return

		// Resume succeeded and session is still active
		if (resumeData && !resumeData.session.completedAt) {
			hasInitRef.current = true
			const s = resumeData.session
			setSession(s)
			setItem(resumeData.currentItem)
			setTier(resumeData.writingTier ?? (s.config.writingTier as WritingTier) ?? 3)
			setPhase(resumeData.currentItem ? "writing" : "loading")
			return
		}

		// No resume, or resume failed, or session completed — start fresh
		if (!resumeSessionId || resumeFailed || resumeData?.session.completedAt) {
			hasInitRef.current = true
			startMutation.mutate(
				{ skill: "writing", mode: "guided", itemsCount: 1, part },
				{
					onSuccess: (data: PracticeStartResponse) => {
						setSession(data.session)
						setItem(data.currentItem)
						setTier(data.writingTier ?? 3)
						setPhase("writing")
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

	// Auto-complete session when grading finishes
	const completeMutation = useCompletePractice(session?.id ?? "")
	useEffect(() => {
		if (phase === "result" && session && !sessionCompleted) {
			setSessionCompleted(true)
			completeMutation.mutate()
		}
	}, [phase, session, sessionCompleted, completeMutation])

	const content = item
		? isWritingContent(item.question.content)
			? item.question.content
			: null
		: null
	const hints = item?.writingHints ?? null

	const handlePracticeAgain = useCallback(() => {
		navigate({
			to: "/exercise",
			search: { skill: "writing", id: "", part: part ? String(part) : "", session: "" },
			replace: true,
		})
		// Reset state for new session
		setSession(null)
		setItem(null)
		setWritingText("")
		setSubmissionId(null)
		setPhase("loading")
		setError(null)
		setSessionCompleted(false)
		hasInitRef.current = false
	}, [navigate, part])

	return (
		<div className="flex h-full flex-col overflow-hidden">
			{phase === "loading" && !error && (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-sm text-muted-foreground">Đang tạo phiên luyện tập...</p>
				</div>
			)}

			{error && (
				<div className="flex flex-1 flex-col items-center justify-center gap-3">
					<p className="text-sm text-destructive">{error}</p>
					<Button
						variant="outline"
						onClick={() => {
							setError(null)
							hasInitRef.current = false
						}}
					>
						Thử lại
					</Button>
				</div>
			)}

			{phase === "writing" && content && session && item && (
				<>
					{/* Tier badge */}
					<div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
						<Badge variant="secondary" className={TIER_META[tier]?.color}>
							{TIER_META[tier]?.label}
						</Badge>
					</div>

					{tier === 1 ? (
						<TemplateEditorWithApi
							questionId={item.question.id}
							content={content}
							hints={hints}
							sessionId={session.id}
							onSubmitted={(subId, text) => {
								setWritingText(text)
								setSubmissionId(subId)
								setPhase("grading")
							}}
							onSubmitting={() => setPhase("submitting")}
							onError={(msg) => {
								setError(msg)
								setPhase("writing")
							}}
						/>
					) : (
						<WritingEditor
							content={content}
							hints={tier === 2 ? hints : null}
							text={writingText}
							onTextChange={setWritingText}
							sessionId={session.id}
							questionId={item.question.id}
							onSubmitted={(subId) => {
								setSubmissionId(subId)
								setPhase("grading")
							}}
							onSubmitting={() => setPhase("submitting")}
							onError={(msg) => {
								setError(msg)
								setPhase("writing")
							}}
						/>
					)}
				</>
			)}

			{phase === "submitting" && !error && (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-sm text-muted-foreground">Đang nộp bài...</p>
				</div>
			)}

			{(phase === "grading" || phase === "result") && submissionId && (
				<GradingPoller
					submissionId={submissionId}
					submittedText={writingText}
					content={content}
					tier={tier}
					onCompleted={() => setPhase("result")}
				/>
			)}

			{/* Action buttons after grading result */}
			{phase === "result" && (
				<footer className="flex shrink-0 items-center justify-center gap-3 border-t px-4 py-3">
					<Button variant="outline" asChild>
						<Link to="/practice/writing">
							<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
							Quay lại
						</Link>
					</Button>
					<Button onClick={handlePracticeAgain}>
						Luyện bài khác
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				</footer>
			)}
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Level 1 — Template editor with async AI generation
// ═══════════════════════════════════════════════════

interface TemplateEditorWithApiProps {
	questionId: string
	content: WritingContent
	hints: WritingHints | null
	sessionId: string
	onSubmitted: (submissionId: string, assembledText: string) => void
	onSubmitting: () => void
	onError: (msg: string) => void
}

function TemplateEditorWithApi({
	questionId,
	content,
	hints,
	sessionId,
	onSubmitted,
	onSubmitting,
	onError,
}: TemplateEditorWithApiProps) {
	const { data, isLoading, isError } = useGenerateTemplate(questionId)
	const submitMutation = useSubmitPracticeAnswer(sessionId)
	const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({})
	const [fallbackText, setFallbackText] = useState("")

	const template = data?.template ?? null

	const assembleText = useCallback(() => {
		if (!template) return ""
		return template
			.map((section) =>
				section.parts
					.map((part) => {
						if (part.type === "text") return part.content ?? ""
						return filledBlanks[part.id ?? ""] ?? ""
					})
					.join(""),
			)
			.join("\n\n")
	}, [template, filledBlanks])

	const handleSubmit = useCallback(() => {
		const text = assembleText()
		if (!text.trim()) return

		submitMutation.mutate(
			{ questionId, answer: { text } },
			{
				onSuccess: (result) => onSubmitted(result.submissionId, text),
				onError: (err) => onError(err.message),
			},
		)
	}, [assembleText, questionId, submitMutation, onSubmitted, onError])

	if (isLoading) {
		return (
			<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
				<div className="w-full shrink-0 overflow-y-auto border-b p-6 lg:w-[420px] lg:border-b-0 lg:border-r">
					<PromptPanel content={content} hints={hints} />
				</div>
				<div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-40 w-full max-w-md" />
					<Skeleton className="h-40 w-full max-w-md" />
					<p className="text-sm text-muted-foreground">Đang tạo bài mẫu điền từ...</p>
				</div>
			</div>
		)
	}

	// Template generation failed → fallback to freeform textarea with hints
	if (isError || !template) {
		return (
			<WritingEditor
				content={content}
				hints={hints}
				text={fallbackText}
				onTextChange={setFallbackText}
				sessionId={sessionId}
				questionId={questionId}
				onSubmitted={(subId) => onSubmitted(subId, fallbackText)}
				onSubmitting={onSubmitting}
				onError={onError}
			/>
		)
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
			<div className="w-full shrink-0 overflow-y-auto border-b p-6 lg:w-[420px] lg:border-b-0 lg:border-r">
				<PromptPanel content={content} hints={hints} />
			</div>
			<div className="flex flex-1 flex-col overflow-hidden">
				<WritingTemplateEditor
					template={template}
					filledBlanks={filledBlanks}
					onBlankChange={(id, value) => setFilledBlanks((prev) => ({ ...prev, [id]: value }))}
				/>
				<div className="flex shrink-0 items-center justify-end border-t px-5 py-3">
					<Button onClick={handleSubmit} disabled={submitMutation.isPending}>
						{submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
					</Button>
				</div>
			</div>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Shared prompt panel
// ═══════════════════════════════════════════════════

function PromptPanel({ content, hints }: { content: WritingContent; hints: WritingHints | null }) {
	return (
		<div className="space-y-4">
			<div>
				<span className="inline-block rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
					{content.taskType === "letter" ? "Viết thư" : "Viết luận"}
				</span>
			</div>

			<div className="whitespace-pre-wrap rounded-xl bg-muted/30 p-4 text-sm leading-relaxed">
				{content.prompt}
			</div>

			{content.requiredPoints && content.requiredPoints.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-semibold text-muted-foreground">Yêu cầu:</p>
					<ul className="space-y-1 pl-4 text-sm">
						{content.requiredPoints.map((point) => (
							<li key={point} className="list-disc text-muted-foreground">
								{point}
							</li>
						))}
					</ul>
				</div>
			)}

			{hints && (
				<div className="space-y-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
					<p className="text-xs font-semibold text-primary">Gợi ý dàn bài</p>
					<ol className="space-y-1 pl-4 text-sm">
						{hints.outline.map((line) => (
							<li key={line} className="list-decimal text-muted-foreground">
								{line}
							</li>
						))}
					</ol>

					<p className="text-xs font-semibold text-primary">Mẫu câu gợi ý</p>
					<div className="flex flex-wrap gap-1.5">
						{hints.starters.map((s) => (
							<span
								key={s}
								className="inline-block rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground"
							>
								{s}
							</span>
						))}
					</div>

					<p className="text-xs text-muted-foreground">
						Số từ yêu cầu: <strong>{hints.wordCount}</strong>
					</p>
				</div>
			)}
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Level 2 & 3 — Textarea editor
// ═══════════════════════════════════════════════════

interface WritingEditorProps {
	content: WritingContent
	hints: WritingHints | null
	text: string
	onTextChange: (text: string) => void
	sessionId: string
	questionId: string
	onSubmitted: (submissionId: string) => void
	onSubmitting: () => void
	onError: (msg: string) => void
}

function WritingEditor({
	content,
	hints,
	text,
	onTextChange,
	sessionId,
	questionId,
	onSubmitted,
	onSubmitting,
	onError,
}: WritingEditorProps) {
	const submitMutation = useSubmitPracticeAnswer(sessionId)
	const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

	const handleSubmit = useCallback(() => {
		if (!text.trim()) return
		onSubmitting()
		submitMutation.mutate(
			{ questionId, answer: { text } },
			{
				onSuccess: (data) => {
					onSubmitted(data.submissionId)
				},
				onError: (err) => {
					onError(err.message)
				},
			},
		)
	}, [text, questionId, submitMutation, onSubmitted, onSubmitting, onError])

	return (
		<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
			<div className="w-full shrink-0 overflow-y-auto border-b p-6 lg:w-[420px] lg:border-b-0 lg:border-r">
				<PromptPanel content={content} hints={hints} />
			</div>

			<div className="flex flex-1 flex-col p-6">
				<textarea
					className="min-h-[300px] flex-1 resize-none rounded-xl border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
					placeholder="Nhập bài viết của bạn..."
					value={text}
					onChange={(ev) => onTextChange(ev.target.value)}
				/>
				<div className="mt-3 flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{wordCount} từ
						{content.minWords > 0 && wordCount < content.minWords && (
							<span className="ml-1 text-orange-500">(cần tối thiểu {content.minWords} từ)</span>
						)}
					</p>
					<Button onClick={handleSubmit} disabled={!text.trim() || submitMutation.isPending}>
						{submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
					</Button>
				</div>
			</div>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Grading poller
// ═══════════════════════════════════════════════════

interface GradingPollerProps {
	submissionId: string
	submittedText: string
	content: WritingContent | null
	tier: WritingTier
	onCompleted: () => void
}

function GradingPoller({
	submissionId,
	submittedText,
	content,
	tier,
	onCompleted,
}: GradingPollerProps) {
	const { data: submission } = useSubmission(submissionId)
	const notifiedRef = useRef(false)

	const isTerminal =
		submission?.status === "completed" ||
		submission?.status === "review_pending" ||
		submission?.status === "failed"

	useEffect(() => {
		if (isTerminal && !notifiedRef.current) {
			notifiedRef.current = true
			onCompleted()
		}
	}, [isTerminal, onCompleted])

	if (!isTerminal) {
		return <GradingPending />
	}

	return (
		<WritingGradingResult
			submission={submission}
			submittedText={submittedText}
			content={content}
			tier={tier}
		/>
	)
}

function GradingPending() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4">
			<div className="flex items-center gap-3">
				<span className="relative flex size-3">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
					<span className="relative inline-flex size-3 rounded-full bg-amber-500" />
				</span>
				<p className="font-semibold text-amber-700 dark:text-amber-400">Đang chấm bài...</p>
			</div>
			<p className="max-w-sm text-center text-sm text-muted-foreground">
				AI đang phân tích bài viết của bạn. Quá trình này thường mất 30-60 giây.
			</p>
		</div>
	)
}
