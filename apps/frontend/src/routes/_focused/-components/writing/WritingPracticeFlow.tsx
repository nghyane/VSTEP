import { ArrowLeft01Icon, ArrowRight01Icon, PencilEdit02Icon, Tick01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
	useCompletePractice,
	usePracticeSession,
	useStartPractice,
	useSubmission,
	useSubmitPracticeAnswer,
} from "@/hooks/use-practice"
import type {
	PracticeMode,
	PracticeItem,
	PracticeSession,
	PracticeStartResponse,
	WritingContent,
	WritingHints,
	WritingScaffold,
	WritingScaffoldSection,
	WritingScaffoldType,
	WritingTier,
} from "@/types/api"
import { WritingGradingResult } from "./WritingGradingResult"
import { WritingTemplateEditor } from "./WritingTemplateEditor"

function isWritingContent(c: unknown): c is WritingContent {
	return c !== null && typeof c === "object" && "prompt" in (c as Record<string, unknown>)
}

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

const WRITING_PRACTICE_MODE: PracticeMode = "guided"

const SCAFFOLD_META: Record<WritingScaffoldType, { label: string; description: string }> = {
	template: {
		label: "Điền theo khung",
		description: "Hoàn thành các chỗ trống để tạo bài viết.",
	},
	guided: {
		label: "Viết có gợi ý",
		description: "Dùng dàn ý và mẫu câu để tự viết bài.",
	},
	freeform: {
		label: "Tự viết",
		description: "Viết bài hoàn chỉnh mà không cần scaffold.",
	},
}

interface WritingPracticeFlowProps {
	part?: number
	resumeSessionId?: string
}

function persistSessionToUrl(sessionId: string) {
	const url = new URL(window.location.href)
	url.searchParams.set("session", sessionId)
	window.history.replaceState(null, "", url.toString())
}

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
	const submitMutation = useSubmitPracticeAnswer(session?.id ?? "")

	const {
		data: resumeData,
		isError: resumeFailed,
		isLoading: resumeLoading,
	} = usePracticeSession(resumeSessionId && !session ? resumeSessionId : null)

	useEffect(() => {
		if (hasInitRef.current || session) return
		if (resumeSessionId && resumeLoading) return

		if (resumeData && !resumeData.session.completedAt) {
			hasInitRef.current = true
			const resumedSession = resumeData.session
			setSession(resumedSession)
			setItem(resumeData.currentItem)
			setTier(resumeData.writingTier ?? resumedSession.config.writingTier ?? 3)
			setPhase(resumeData.currentItem ? "writing" : "loading")
			return
		}

		if (!resumeSessionId || resumeFailed || resumeData?.session.completedAt) {
			hasInitRef.current = true
			startMutation.mutate(
				{ skill: "writing", mode: WRITING_PRACTICE_MODE, itemsCount: 1, part },
				{
				onSuccess: (data: PracticeStartResponse) => {
					setSession(data.session)
					setItem(data.currentItem)
					setTier(data.writingTier ?? 3)
					if (!data.currentItem) {
						setError(
							"Hiện chưa có bài tập phù hợp với trình độ của bạn. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
						)
						setPhase("loading")
						return
					}
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
	const scaffold = item?.writingScaffold ?? null
	const scaffoldType = scaffold?.type ?? "freeform"
	const hints = scaffold?.type === "guided" ? (scaffold.payload as WritingHints) : null

	const handleSubmitText = useCallback(
		(text: string, questionId: string) => {
			if (!text.trim()) return
			setWritingText(text)
			setPhase("submitting")

			submitMutation.mutate(
				{ questionId, answer: { text } },
				{
					onSuccess: (data) => {
						setSubmissionId(data.submissionId)
						setPhase("grading")
					},
					onError: (err) => {
						setError(err.message)
						setPhase("writing")
					},
				},
			)
		},
		[submitMutation],
	)

	const handlePracticeAgain = useCallback(() => {
		navigate({
			to: "/exercise",
			search: { skill: "writing", id: "", part: part ? String(part) : "", session: "" },
			replace: true,
		})
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
				<SessionCreatingLoader />
			)}

			{error && (
				<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
					<div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
						<span className="text-xl">⚠️</span>
					</div>
					<div className="space-y-1 text-center">
						<p className="font-semibold text-destructive">Không thể tạo phiên luyện tập</p>
						<p className="text-sm text-muted-foreground">{error}</p>
					</div>
					<Button
						variant="outline"
						onClick={() => {
							setError(null)
							hasInitRef.current = false
							setPhase("loading")
						}}
					>
						Thử lại
					</Button>
				</div>
			)}

			{phase === "writing" && content && session && item && (
				<>
					<div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
						<Badge variant="secondary" className={TIER_META[tier]?.color}>
							{TIER_META[tier]?.label}
						</Badge>
						<Badge variant="outline">{SCAFFOLD_META[scaffoldType].label}</Badge>
						<p className="text-xs text-muted-foreground">{SCAFFOLD_META[scaffoldType].description}</p>
					</div>

					{scaffoldType === "template" ? (
						<TemplateEditorWithApi
							content={content}
							scaffold={scaffold}
							onSubmit={handleSubmitText}
							isSubmitting={submitMutation.isPending}
						/>
					) : (
						<WritingEditor
							content={content}
							hints={scaffoldType === "guided" ? hints : null}
							text={writingText}
							onTextChange={setWritingText}
							onSubmit={(text) => handleSubmitText(text, scaffold?.questionId ?? item.question.id)}
							isSubmitting={submitMutation.isPending}
						/>
					)}
				</>
			)}

			{phase === "submitting" && !error && (
				<div className="flex flex-1 flex-col items-center justify-center gap-5">
					<div className="relative flex items-center justify-center">
						<span className="absolute inline-flex size-14 animate-ping rounded-full bg-primary/20" />
						<div className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10">
							<HugeiconsIcon icon={Tick01Icon} className="size-6 text-primary" />
						</div>
					</div>
					<div className="space-y-1 text-center">
						<p className="font-semibold">Đang nộp bài...</p>
						<p className="text-sm text-muted-foreground">Vui lòng không đóng trang</p>
					</div>
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

interface TemplateEditorWithApiProps {
	content: WritingContent
	scaffold: WritingScaffold | null
	onSubmit: (text: string, questionId: string) => void
	isSubmitting: boolean
}

function TemplateEditorWithApi({ content, scaffold, onSubmit, isSubmitting }: TemplateEditorWithApiProps) {
	const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({})
	const [fallbackText, setFallbackText] = useState("")
	const template =
		scaffold?.type === "template"
			? ((scaffold.payload as { sections: WritingScaffoldSection[] } | null)?.sections ?? null)
			: null
	const hints = scaffold?.type === "guided" ? (scaffold.payload as WritingHints) : null

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
		const questionId = scaffold?.questionId

		if (!text.trim() || !questionId) return

		onSubmit(text, questionId)
	}, [assembleText, onSubmit, scaffold?.questionId])

	if (!template) {
		return (
			<WritingEditor
				content={content}
				hints={hints}
				text={fallbackText}
				onTextChange={setFallbackText}
				onSubmit={(text) => {
					const questionId = scaffold?.questionId
					if (!questionId) return
					onSubmit(text, questionId)
				}}
				isSubmitting={isSubmitting}
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
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Đang nộp..." : "Nộp bài"}
					</Button>
				</div>
			</div>
		</div>
	)
}

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
						{hints.starters.map((starter) => (
							<span
								key={starter}
								className="inline-block rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground"
							>
								{starter}
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

interface WritingEditorProps {
	content: WritingContent
	hints: WritingHints | null
	text: string
	onTextChange: (text: string) => void
	onSubmit: (text: string) => void
	isSubmitting: boolean
}

function WritingEditor({
	content,
	hints,
	text,
	onTextChange,
	onSubmit,
	isSubmitting,
}: WritingEditorProps) {
	const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

	const handleSubmit = useCallback(() => {
		if (!text.trim()) return
		onSubmit(text)
	}, [text, onSubmit])

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
					onChange={(event) => onTextChange(event.target.value)}
				/>
				<div className="mt-3 flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						{wordCount} từ
						{content.minWords > 0 && wordCount < content.minWords && (
							<span className="ml-1 text-orange-500">(cần tối thiểu {content.minWords} từ)</span>
						)}
					</p>
					<Button onClick={handleSubmit} disabled={!text.trim() || isSubmitting}>
						{isSubmitting ? "Đang nộp..." : "Nộp bài"}
					</Button>
				</div>
			</div>
		</div>
	)
}

interface GradingPollerProps {
	submissionId: string
	submittedText: string
	content: WritingContent | null
	tier: WritingTier
	onCompleted: () => void
}

function GradingPoller({ submissionId, submittedText, content, tier, onCompleted }: GradingPollerProps) {
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

// ─────────────────────────────────────────────────────────────
// Session creating loader
// ─────────────────────────────────────────────────────────────

const CREATION_STEPS = [
	"Phân tích trình độ của bạn...",
	"Chọn đề phù hợp...",
	"Chuẩn bị gợi ý và khung bài...",
	"Sắp xong rồi...",
]

function SessionCreatingLoader() {
	const [stepIndex, setStepIndex] = useState(0)

	useEffect(() => {
		const id = setInterval(() => {
			setStepIndex((prev) => (prev < CREATION_STEPS.length - 1 ? prev + 1 : prev))
		}, 1200)
		return () => clearInterval(id)
	}, [])

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
			{/* Animated icon */}
			<div className="relative flex items-center justify-center">
				<span className="absolute inline-flex size-16 animate-ping rounded-full bg-primary/20" />
				<div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10">
					<HugeiconsIcon icon={PencilEdit02Icon} className="size-7 text-primary" />
				</div>
			</div>

			{/* Title + animated step text */}
			<div className="space-y-2 text-center">
				<h3 className="text-base font-semibold">Đang tạo phiên luyện tập</h3>
				<p className="text-sm text-muted-foreground transition-all duration-500">
					{CREATION_STEPS[stepIndex]}
				</p>
			</div>

			{/* Step dots */}
			<div className="flex items-center gap-2">
				{CREATION_STEPS.map((_, i) => (
					<span
						key={i}
						className={cn(
							"size-2 rounded-full transition-all duration-300",
							i <= stepIndex ? "bg-primary scale-110" : "bg-muted",
						)}
					/>
				))}
			</div>

			{/* Skeleton preview — giúp user hình dung layout sắp hiện */}
			<div className="w-full max-w-2xl space-y-3 rounded-2xl border border-dashed border-muted-foreground/20 p-5">
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-5 w-20 rounded-full" />
				</div>
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
				<Skeleton className="mt-2 h-28 w-full rounded-xl" />
			</div>
		</div>
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
