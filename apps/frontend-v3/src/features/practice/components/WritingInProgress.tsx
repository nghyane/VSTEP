import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { getWritingDiagnostics, submitWritingSession } from "#/features/practice/actions"
import { TranslateSelection } from "#/features/practice/components/TranslateSelection"
import { WritingGradingScreen } from "#/features/practice/components/WritingGradingScreen"
import { WritingSamplePanel } from "#/features/practice/components/WritingSamplePanel"
import { WritingWordProgress } from "#/features/practice/components/WritingWordProgress"
import { invalidateProgressQueries } from "#/features/practice/invalidate-progress"
import type {
	WritingPromptDetail,
	WritingRealtimeDiagnostics,
	WritingSubmission,
} from "#/features/practice/types"
import { countWords } from "#/lib/utils"

const DIAGNOSTICS_MIN_CHARS = 20
const DIAGNOSTICS_DEBOUNCE_MS = 1000

interface Props {
	prompt: WritingPromptDetail
	sessionId: string
}

export function WritingInProgress({ prompt, sessionId }: Props) {
	const [text, setText] = useState("")
	const [submission, setSubmission] = useState<WritingSubmission | null>(null)
	const [showSample, setShowSample] = useState(false)
	const queryClient = useQueryClient()
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const wc = countWords(text)
	const hasSample = !!prompt.sample_answer
	const debouncedText = useDebouncedValue(text, DIAGNOSTICS_DEBOUNCE_MS)
	const diagnosticsQuery = useQuery({
		queryKey: ["practice", "writing", "diagnostics", prompt.id, debouncedText],
		queryFn: ({ signal }) => getWritingDiagnostics(prompt.id, debouncedText, signal),
		enabled: debouncedText.trim().length >= DIAGNOSTICS_MIN_CHARS,
		staleTime: 30_000,
	})
	const canRequestDiagnostics = text.trim().length >= DIAGNOSTICS_MIN_CHARS
	const diagnostics = text === debouncedText ? diagnosticsQuery.data?.data : undefined
	const diagnosticsLoading = canRequestDiagnostics && (text !== debouncedText || diagnosticsQuery.isFetching)

	const handleSubmit = () => {
		mutation.mutate()
	}

	const mutation = useMutation({
		mutationFn: () => submitWritingSession(sessionId, text),
		onSuccess: (res) => {
			setSubmission(res.data)
			invalidateProgressQueries(queryClient)
			queryClient.invalidateQueries({ queryKey: ["practice", "writing"] })
		},
	})

	const handleInsertText = useCallback(
		(insert: string) => {
			const ta = textareaRef.current
			if (!ta) return
			const start = ta.selectionStart
			const before = text.slice(0, start)
			const after = text.slice(start)
			const spaceBefore = before.length > 0 && !before.endsWith(" ") && !before.endsWith("\n") ? " " : ""
			const spaceAfter = after.length > 0 && !after.startsWith(" ") && !after.startsWith("\n") ? " " : ""
			const newText = before + spaceBefore + insert + spaceAfter + after
			setText(newText)
			requestAnimationFrame(() => {
				const pos = start + spaceBefore.length + insert.length + spaceAfter.length
				ta.setSelectionRange(pos, pos)
				ta.focus()
			})
		},
		[text],
	)

	if (submission) {
		return <WritingGradingScreen prompt={prompt} submission={submission} responseText={text} />
	}

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-surface px-4 py-2 shrink-0">
				<div className="flex min-w-0 flex-1 items-center gap-2.5">
					<Link to="/luyen-tap/viet" className="p-1 hover:opacity-70 shrink-0">
						<Icon name="back" size="sm" className="text-muted" />
					</Link>
					<span className="text-[10px] font-bold text-skill-writing bg-skill-writing/15 px-1.5 py-0.5 rounded shrink-0">
						Task {prompt.part}
					</span>
					<div className="min-w-0">
						<p className="text-sm font-bold text-foreground truncate">{prompt.title}</p>
					</div>
				</div>
				<WritingRealtimeHeader
					prompt={prompt}
					state={{
						wordCount: wc,
						diagnostics,
						loading: diagnosticsLoading,
						error: diagnosticsQuery.isError,
						errorMessage: diagnosticsQuery.error instanceof Error ? diagnosticsQuery.error.message : null,
					}}
				/>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1">
				<div className="max-w-6xl mx-auto px-6 py-6">
					<div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
						{/* Prompt panel */}
						<div className="card p-6 self-start lg:sticky lg:top-6 space-y-4">
							<div>
								<p className="text-xs font-bold text-skill-writing uppercase tracking-wide mb-2">
									Đề bài — Task {prompt.part}
								</p>
								<TranslateSelection>
									<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
										{prompt.prompt}
									</p>
								</TranslateSelection>
							</div>
							{prompt.required_points.length > 0 && (
								<div>
									<p className="text-xs font-bold text-muted mb-1">Yêu cầu</p>
									<ul className="text-sm text-subtle space-y-1">
										{prompt.required_points.map((p) => (
											<li key={p} className="flex gap-2">
												<span className="text-skill-writing shrink-0">•</span>
												{p}
											</li>
										))}
									</ul>
								</div>
							)}
							{prompt.sentence_starters.length > 0 && (
								<div>
									<p className="text-xs font-bold text-muted mb-1">Gợi ý mở đầu</p>
									<div className="flex flex-wrap gap-1.5">
										{prompt.sentence_starters.map((s) => (
											<button
												key={s}
												type="button"
												onClick={() => handleInsertText(s)}
												className="text-xs bg-background px-2 py-1 rounded-lg text-subtle hover:text-foreground hover:bg-skill-writing/10 transition cursor-pointer"
											>
												{s}
											</button>
										))}
									</div>
								</div>
							)}
							{hasSample && (
								<button
									type="button"
									onClick={() => setShowSample(true)}
									className="text-xs font-bold text-skill-writing hover:underline transition"
								>
									Xem bài mẫu
								</button>
							)}
						</div>

						{/* Editor */}
						<div className="space-y-3">
							<div className="relative">
								<textarea
									ref={textareaRef}
									value={text}
									onChange={(e) => setText(e.target.value)}
									placeholder="Viết bài của bạn ở đây..."
									className="scrollbar-none block w-full min-h-[500px] p-5 pr-8 pb-14 text-sm leading-relaxed text-foreground bg-surface border-2 border-border rounded-xl resize-none overflow-y-auto focus:outline-none focus:border-primary"
								/>
								<TextareaScrollTrack textareaRef={textareaRef} />
							</div>
							<WritingWordProgress count={wc} min={prompt.min_words} max={prompt.max_words} />
							<div className="flex flex-col items-center gap-2">
								{mutation.isError && (
									<p className="text-xs font-bold text-destructive">
										{mutation.error instanceof Error ? mutation.error.message : "Không nộp được bài."}
									</p>
								)}
								<button
									type="button"
									onClick={handleSubmit}
									disabled={mutation.isPending || wc === 0}
									className="btn bg-skill-writing px-8 py-2.5 text-primary-foreground [--btn-shadow:var(--color-skill-writing-dark)] disabled:cursor-not-allowed disabled:opacity-50"
								>
									{mutation.isPending ? "Đang nộp..." : "Nộp bài"}
								</button>
							</div>
						</div>
					</div>
				</div>
			</ScrollArea>

			{/* Sample overlay */}
			{showSample && (
				<WritingSamplePanel
					answer={prompt.sample_answer ?? ""}
					markers={prompt.sample_markers}
					onClose={() => setShowSample(false)}
				/>
			)}
		</div>
	)
}

function useDebouncedValue(value: string, delayMs: number): string {
	const [debounced, setDebounced] = useState(value)

	useEffect(() => {
		const timer = window.setTimeout(() => setDebounced(value), delayMs)
		return () => window.clearTimeout(timer)
	}, [value, delayMs])

	return debounced
}

function TextareaScrollTrack({ textareaRef }: { textareaRef: React.RefObject<HTMLTextAreaElement | null> }) {
	const trackRef = useRef<HTMLDivElement>(null)
	const dragStartY = useRef<number | null>(null)
	const dragStartScroll = useRef(0)
	const [thumb, setThumb] = useState({ visible: false, height: 0, top: 0 })

	const update = useCallback(() => {
		const el = textareaRef.current
		const track = trackRef.current
		if (!el) return
		const ratio = el.clientHeight / el.scrollHeight
		const visible = ratio < 1
		if (!visible) {
			setThumb({ visible: false, height: 0, top: 0 })
			return
		}

		const minThumb = 40
		const trackHeight = track?.clientHeight ?? el.clientHeight
		const height = Math.max(minThumb, ratio * trackHeight)
		const scrollable = el.scrollHeight - el.clientHeight
		const top = scrollable > 0 ? (el.scrollTop / scrollable) * (trackHeight - height) : 0
		setThumb({ visible: true, height, top })
	}, [textareaRef])

	useEffect(() => {
		const el = textareaRef.current
		if (!el) return
		update()
		el.addEventListener("scroll", update, { passive: true })
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => {
			el.removeEventListener("scroll", update)
			ro.disconnect()
		}
	}, [textareaRef, update])

	useEffect(() => {
		update()
	})

	const scrollByTrackPosition = useCallback(
		(clientY: number) => {
			const el = textareaRef.current
			const track = trackRef.current
			if (!el || !track) return
			const rect = track.getBoundingClientRect()
			const clickY = clientY - rect.top
			const center = thumb.top + thumb.height / 2
			const scrollable = el.scrollHeight - el.clientHeight
			const thumbScrollable = track.clientHeight - thumb.height
			const ratio = thumbScrollable > 0 ? scrollable / thumbScrollable : 0
			el.scrollTop = Math.max(0, Math.min(scrollable, el.scrollTop + (clickY - center) * ratio))
		},
		[textareaRef, thumb.height, thumb.top],
	)

	function handlePointerMove(e: PointerEvent) {
		const el = textareaRef.current
		if (!el || dragStartY.current === null) return
		const track = trackRef.current
		if (!track) return
		const dy = e.clientY - dragStartY.current
		const scrollable = el.scrollHeight - el.clientHeight
		const thumbScrollable = track.clientHeight - thumb.height
		const ratio = thumbScrollable > 0 ? scrollable / thumbScrollable : 0
		el.scrollTop = Math.max(0, Math.min(scrollable, dragStartScroll.current + dy * ratio))
	}

	function handlePointerUp() {
		dragStartY.current = null
		window.removeEventListener("pointermove", handlePointerMove)
		window.removeEventListener("pointerup", handlePointerUp)
	}

	function handleThumbPointerDown(e: React.PointerEvent<HTMLDivElement>) {
		e.preventDefault()
		dragStartY.current = e.clientY
		dragStartScroll.current = textareaRef.current?.scrollTop ?? 0
		window.addEventListener("pointermove", handlePointerMove)
		window.addEventListener("pointerup", handlePointerUp)
	}

	if (!thumb.visible) return null

	return (
		<div
			ref={trackRef}
			onClick={(e) => scrollByTrackPosition(e.clientY)}
			className="absolute right-3 top-4 bottom-4 w-1 cursor-pointer overflow-hidden rounded-full"
			style={{ userSelect: "none" }}
		>
			<div
				onPointerDown={handleThumbPointerDown}
				className="absolute right-0 left-0 rounded-full bg-border transition-colors hover:bg-placeholder cursor-grab active:cursor-grabbing"
				style={{ height: thumb.height, top: thumb.top }}
			/>
		</div>
	)
}

interface RealtimePanelProps {
	prompt: WritingPromptDetail
	state: RealtimePanelState
}

interface RealtimePanelState {
	wordCount: number
	diagnostics: WritingRealtimeDiagnostics | undefined
	loading: boolean
	error: boolean
	errorMessage: string | null
}

function WritingRealtimeHeader({ prompt, state }: RealtimePanelProps) {
	const { diagnostics, loading, error, errorMessage } = state
	const [showLanguageDetails, setShowLanguageDetails] = useState(false)
	const taskCoverage = diagnostics?.diagnostics.task_coverage
	const format = diagnostics?.diagnostics.format
	const summary = diagnostics?.diagnostics.summary
	const annotations = diagnostics?.diagnostics.annotations ?? []
	const serviceStatus = diagnostics?.diagnostics.service_status
	const languageErrorCount = summary?.total_error_count
	const hasLanguageErrorCount = typeof languageErrorCount === "number"
	const languageErrorsChecked = serviceStatus?.language_tool?.checked === true
	const languageErrorsAvailable = serviceStatus?.language_tool?.available !== false
	const languageValue =
		languageErrorsChecked && hasLanguageErrorCount && summary
			? formatLanguageErrorValue(summary)
			: "Chưa kiểm tra"
	const hasTaskCoverage = !!taskCoverage && taskCoverage.required_points > 0
	const taskCoverageValue = taskCoverage
		? `${taskCoverage.covered_points ?? "?"}/${taskCoverage.required_points}`
		: ""
	const missingRequirement = taskCoverage?.requirements.find((requirement) => requirement.met === false)
	const firstReadinessReason = diagnostics?.readiness.reasons[0]?.message
	const statusText = error
		? (errorMessage ?? "Chưa tải được kiểm tra.")
		: !languageErrorsAvailable
			? "Tạm thời chưa kiểm tra lỗi ngôn ngữ."
			: loading
				? "Đang kiểm tra..."
				: missingRequirement
					? `Còn thiếu: ${missingRequirement.text}`
					: (firstReadinessReason ?? diagnostics?.readiness.label ?? "Sẵn sàng")

	return (
		<div className="hidden shrink-0 items-center gap-2 lg:flex">
			<LanguageErrorMetric
				value={languageValue}
				annotations={annotations}
				open={showLanguageDetails}
				onToggle={() => setShowLanguageDetails((v) => !v)}
			/>
			{hasTaskCoverage && <HeaderMetric label="Yêu cầu" value={taskCoverageValue} />}
			<HeaderStatus value={statusText} />
			{prompt.part === 1 && (
				<div className="flex items-center gap-1.5">
					<CheckPill label="Lời chào" checked={formatCheck(format?.has_salutation)} />
					<CheckPill label="Lời kết" checked={formatCheck(format?.has_closing)} />
				</div>
			)}
		</div>
	)
}

function LanguageErrorMetric({
	value,
	annotations,
	open,
	onToggle,
}: {
	value: string
	annotations: WritingRealtimeDiagnostics["diagnostics"]["annotations"]
	open: boolean
	onToggle: () => void
}) {
	const hasDetails = annotations.length > 0

	return (
		<div className="relative">
			<button
				type="button"
				onClick={hasDetails ? onToggle : undefined}
				className="flex h-12 min-w-28 flex-col justify-center rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-3 py-1.5 text-left disabled:cursor-default"
				disabled={!hasDetails}
				title={hasDetails ? "Xem chi tiết lỗi" : undefined}
			>
				<p className="text-[10px] font-bold uppercase leading-4 text-subtle">Lỗi ngôn ngữ</p>
				<p className="text-sm font-extrabold leading-5 text-foreground">{value}</p>
			</button>
			{open && hasDetails && (
				<div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-3 shadow-lg">
					<p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-foreground">Chi tiết lỗi</p>
					<div className="space-y-2">
						{annotations.slice(0, 5).map((annotation) => (
							<div key={`${annotation.rule_id}-${annotation.start}`} className="rounded-lg bg-background p-2">
								<p className="text-[10px] font-bold uppercase tracking-wide text-subtle">Đoạn cần xem lại</p>
								<p className="mt-1 text-xs font-bold text-foreground line-clamp-2">“{annotation.text}”</p>
								{annotation.suggestions.length > 0 && (
									<p className="mt-1 text-xs text-subtle">
										Gợi ý: {annotation.suggestions.slice(0, 3).join(", ")}
									</p>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex h-12 min-w-24 flex-col justify-center rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-3 py-1.5">
			<p className="text-[10px] font-bold uppercase leading-4 text-subtle">{label}</p>
			<p className="text-sm font-extrabold leading-5 text-foreground">{value}</p>
		</div>
	)
}

function HeaderStatus({ value }: { value: string }) {
	return (
		<div className="hidden h-12 max-w-56 items-center rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-3 xl:flex">
			<p className="truncate text-xs font-bold text-foreground" title={value}>
				{value}
			</p>
		</div>
	)
}

function formatLanguageErrorValue(summary: WritingRealtimeDiagnostics["diagnostics"]["summary"]): string {
	const total = summary.total_error_count ?? 0
	if (total === 0) return "0"

	const parts: string[] = []
	if ((summary.grammar_error_count ?? 0) > 0) parts.push(`${summary.grammar_error_count} ngữ pháp`)
	if ((summary.spelling_error_count ?? 0) > 0) parts.push(`${summary.spelling_error_count} chính tả`)
	if ((summary.punctuation_error_count ?? 0) > 0) parts.push(`${summary.punctuation_error_count} dấu câu`)

	return parts.length > 0 ? parts.join(", ") : `${total} lỗi`
}

function CheckPill({ label, checked }: { label: string; checked: boolean | null }) {
	const marker = checked === null ? "?" : checked ? "✓" : "○"
	const markerClass = checked === null ? "text-muted" : "text-foreground"

	return (
		<div className="flex h-12 items-center gap-1.5 rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-2.5 text-xs font-bold">
			<span className={markerClass}>{marker}</span>
			<span className="text-foreground">{label}</span>
		</div>
	)
}

function formatCheck(value: boolean | null | undefined): boolean | null {
	return value === undefined ? null : value
}
