import { ArrowLeft01Icon, ArrowRight01Icon, PencilEdit02Icon, Tick01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "motion/react"
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
				<motion.div
					className="flex flex-1 flex-col items-center justify-center gap-5"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.3 }}
				>
					<div className="relative flex items-center justify-center">
						{[1, 1.6].map((scale, i) => (
							<motion.span
								key={i}
								className="absolute rounded-full bg-primary/10"
								style={{ width: 48, height: 48 }}
								animate={{ scale, opacity: 0.8 - i * 0.4 }}
								transition={{ duration: 1.4, repeat: Infinity, repeatType: "loop", ease: "easeOut", delay: i * 0.25 }}
							/>
						))}
						<motion.div
							className="relative flex size-12 items-center justify-center rounded-xl bg-primary/10"
							animate={{ scale: [1, 1.08, 1] }}
							transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
						>
							<HugeiconsIcon icon={Tick01Icon} className="size-6 text-primary" />
						</motion.div>
					</div>
					<div className="space-y-1 text-center">
						<p className="font-semibold">Đang nộp bài...</p>
						<p className="text-sm text-muted-foreground">Vui lòng không đóng trang</p>
					</div>
				</motion.div>
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
			.map((section) => {
				const parts = section.parts.map((part) =>
					part.type === "text" ? (part.content ?? "") : (filledBlanks[part.id ?? ""] ?? ""),
				)
				return parts.reduce((acc, curr) => {
					if (!acc) return curr
					if (!curr) return acc
					const needsSpace =
						!acc.endsWith(" ") && !curr.startsWith(" ") && !/^[.,;:!?]/.test(curr)
					return acc + (needsSpace ? " " : "") + curr
				}, "")
			})
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

const CREATION_STEPS = [
	{ label: "Phân tích trình độ của bạn", detail: "Đang xem xét lịch sử luyện tập..." },
	{ label: "Chọn đề phù hợp", detail: "Tìm bài viết đúng cấp độ..." },
	{ label: "Chuẩn bị khung bài & gợi ý", detail: "Tạo scaffold cá nhân hoá..." },
	{ label: "Sắp xong rồi!", detail: "Hoàn tất phiên luyện tập..." },
]

function SessionCreatingLoader() {
	const [stepIndex, setStepIndex] = useState(0)

	useEffect(() => {
		const id = setInterval(() => {
			setStepIndex((prev) => (prev < CREATION_STEPS.length - 1 ? prev + 1 : prev))
		}, 1400)
		return () => clearInterval(id)
	}, [])

	return (
		<motion.div
			className="flex flex-1 flex-col items-center justify-center gap-8 px-6"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
		>
			<div className="relative flex items-center justify-center">
				{[1, 1.6, 2.2].map((scale, i) => (
					<motion.span
						key={i}
						className="absolute rounded-full bg-primary/10"
						style={{ width: 56, height: 56 }}
						animate={{ scale, opacity: 1 - i * 0.3 }}
						transition={{
							duration: 1.8,
							repeat: Infinity,
							repeatType: "loop",
							ease: "easeOut",
							delay: i * 0.3,
						}}
					/>
				))}
				<motion.div
					className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10"
					animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
					transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
				>
					<HugeiconsIcon icon={PencilEdit02Icon} className="size-7 text-primary" />
				</motion.div>
			</div>

			<div className="space-y-2 text-center">
				<h3 className="text-base font-semibold">Đang tạo phiên luyện tập</h3>
				<div className="h-9 overflow-hidden">
					<AnimatePresence mode="wait">
						<motion.div
							key={stepIndex}
							initial={{ y: 16, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: -16, opacity: 0 }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
							className="space-y-0.5"
						>
							<p className="text-sm font-medium text-foreground">
								{CREATION_STEPS[stepIndex].label}
							</p>
							<p className="text-xs text-muted-foreground">
								{CREATION_STEPS[stepIndex].detail}
							</p>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>

			<div className="flex items-center gap-2">
				{CREATION_STEPS.map((_, i) => (
					<motion.span
						key={i}
						className={cn("rounded-full bg-muted", i === stepIndex ? "bg-primary" : "")}
						animate={{
							width: i === stepIndex ? 20 : 8,
							height: 8,
						}}
						transition={{ duration: 0.3, ease: "easeInOut" }}
					/>
				))}
			</div>

			<motion.div
				className="w-full max-w-2xl overflow-hidden rounded-2xl border border-dashed border-muted-foreground/20"
				initial={{ opacity: 0, scale: 0.97 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.2, duration: 0.4 }}
			>
				<div className="flex divide-x divide-dashed divide-muted-foreground/20">
					<div className="w-2/5 space-y-3 p-5">
						<Skeleton className="h-5 w-16 rounded-full" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-5/6" />
						<Skeleton className="h-3 w-4/6" />
						<div className="mt-3 space-y-1.5 rounded-xl border border-dashed border-muted-foreground/20 p-3">
							<Skeleton className="h-3 w-20" />
							<Skeleton className="h-3 w-full" />
							<Skeleton className="h-3 w-4/5" />
						</div>
					</div>
					<div className="flex-1 space-y-3 p-5">
						<Skeleton className="h-32 w-full rounded-xl" />
						<div className="flex justify-between">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-8 w-20 rounded-lg" />
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
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
