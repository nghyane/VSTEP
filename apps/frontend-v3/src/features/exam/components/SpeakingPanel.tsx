import { useCallback, useEffect, useRef, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { uploadExamSpeakingAudio } from "#/features/exam/actions"
import { ExamRoomProgressTabs, ExamRoomSkillBadge } from "#/features/exam/components/ExamRoomChrome"
import { ExamRoomFooter, type ExamRoomFooterAction } from "#/features/exam/components/ExamRoomFooter"
import type { ExamVersionSpeakingPart } from "#/features/exam/types"
import { useVoiceRecorder } from "#/features/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

interface Props {
	parts: ExamVersionSpeakingPart[]
	speakingDone: Set<string>
	onMarkDone: (partId: string, audioKey: string, audioUrl: string, durationSeconds: number) => void
	onUnmarkDone: (partId: string) => void
	footer: ExamRoomFooterAction
}

const PART_TYPE_LABEL: Record<string, string> = {
	social: "Giao tiếp xã hội",
	solution: "Giải quyết vấn đề",
	topic: "Thảo luận chủ đề",
	introduction: "Giới thiệu bản thân",
	picture_description: "Mô tả hình ảnh",
	extended_discussion: "Thảo luận mở rộng",
	interview: "Phỏng vấn",
	task: "Nhiệm vụ nói",
}

// ─── Real waveform from AnalyserNode ─────────────────────────────────────────

const BAR_COUNT = 28

function WaveformBars({ analyser }: { analyser: AnalyserNode }) {
	const barsRef = useRef<HTMLDivElement>(null)
	const rafRef = useRef<number>(0)
	const dataRef = useRef(new Uint8Array(analyser.frequencyBinCount))

	useEffect(() => {
		const draw = () => {
			analyser.getByteFrequencyData(dataRef.current)
			const el = barsRef.current
			if (el) {
				const bins = dataRef.current
				const step = Math.floor(bins.length / BAR_COUNT)
				for (let i = 0; i < BAR_COUNT; i++) {
					const v = (bins[i * step] ?? 0) / 255
					const h = Math.max(4, v * 44)
					const bar = el.children[i] as HTMLElement | undefined
					if (bar) bar.style.height = `${h}px`
				}
			}
			rafRef.current = requestAnimationFrame(draw)
		}
		rafRef.current = requestAnimationFrame(draw)
		return () => cancelAnimationFrame(rafRef.current)
	}, [analyser])

	return (
		<div ref={barsRef} className="flex h-20 items-center justify-center gap-[4px]">
			{Array.from({ length: BAR_COUNT }, (_, i) => (
				<div
					key={i}
					className="w-1.5 rounded-full bg-skill-speaking transition-[height] duration-75"
					style={{ height: "6px" }}
				/>
			))}
		</div>
	)
}

// ─── Content renderers per part type ─────────────────────────────────────────

function SocialContent({ content }: { content: Record<string, unknown> }) {
	const topics = content.topics as Array<{ name: string; questions: string[] }> | undefined
	if (!topics) return null
	return (
		<div className="space-y-5">
			{topics.map((topic) => (
				<div key={topic.name}>
					<p className="mb-2.5 text-xs font-bold text-muted">{topic.name}</p>
					<ul className="space-y-2">
						{topic.questions.map((q, i) => (
							<li
								key={i}
								className="flex items-start gap-3 rounded-(--radius-card) border border-border bg-surface px-4 py-3 text-sm"
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-skill-speaking/15 text-xs font-extrabold text-skill-speaking-dark">
									{i + 1}
								</span>
								<span className="pt-0.5 leading-relaxed text-foreground">{q}</span>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	)
}

function SolutionContent({ content }: { content: Record<string, unknown> }) {
	return (
		<div className="space-y-4">
			<div className="rounded-(--radius-card) border border-border bg-surface p-4">
				<p className="mb-1.5 text-xs font-bold text-muted">Tình huống</p>
				<p className="text-sm leading-relaxed text-foreground">{content.situation as string}</p>
			</div>
			<div>
				<p className="mb-2 text-xs font-bold text-muted">Các phương án</p>
				<ul className="space-y-2">
					{(content.solutions as string[]).map((s, i) => (
						<li
							key={i}
							className="flex gap-2 rounded-(--radius-button) border border-border bg-surface px-3 py-2 text-sm"
						>
							<span className="shrink-0 font-extrabold text-primary">{String.fromCharCode(65 + i)}.</span>
							<span className="text-foreground">{s}</span>
						</li>
					))}
				</ul>
			</div>
			<div className="rounded-(--radius-card) border border-skill-speaking/30 bg-skill-speaking/10 p-4">
				<p className="mb-1 text-xs font-bold text-skill-speaking-dark">Nhiệm vụ</p>
				<p className="text-sm leading-relaxed text-foreground">{content.task as string}</p>
			</div>
		</div>
	)
}

function TopicContent({ content }: { content: Record<string, unknown> }) {
	return (
		<div className="space-y-4">
			<div className="rounded-(--radius-card) border border-border bg-surface p-4">
				<p className="mb-1.5 text-xs font-bold text-muted">Chủ đề</p>
				<p className="text-base font-extrabold text-foreground">{content.topic as string}</p>
			</div>
			<div className="rounded-(--radius-card) border border-border bg-surface p-4">
				<p className="mb-1.5 text-xs font-bold text-muted">Gợi ý</p>
				<p className="text-sm leading-relaxed text-foreground">{content.prompt as string}</p>
			</div>
			{Array.isArray(content.follow_up_questions) && (
				<div>
					<p className="mb-2 text-xs font-bold text-muted">Câu hỏi mở</p>
					<ul className="space-y-2">
						{(content.follow_up_questions as string[]).map((q, i) => (
							<li
								key={i}
								className="flex gap-2 rounded-(--radius-button) border border-border bg-surface px-3 py-2 text-sm"
							>
								<span className="shrink-0 font-extrabold text-muted">{i + 1}.</span>
								<span className="text-foreground">{q}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}

function PartContent({ part }: { part: ExamVersionSpeakingPart }) {
	if (part.type === "social") return <SocialContent content={part.content} />
	if (part.type === "solution") return <SolutionContent content={part.content} />
	if (part.type === "topic") return <TopicContent content={part.content} />
	return (
		<div className="rounded-(--radius-card) border border-border bg-surface p-4">
			<p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
				{JSON.stringify(part.content, null, 2)}
			</p>
		</div>
	)
}

// ─── Recorder per part ────────────────────────────────────────────────────────

interface PartRecorderProps {
	part: ExamVersionSpeakingPart
	isDone: boolean
	onDone: (partId: string, audioKey: string, audioUrl: string, durationSeconds: number) => void
	onUndone: (partId: string) => void
}

function PartRecorder({ part, isDone, onDone, onUndone }: PartRecorderProps) {
	const recorder = useVoiceRecorder(part.speaking_seconds)
	const typeLabel = PART_TYPE_LABEL[part.type] ?? part.type
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const statusLabel = isDone
		? "Đã xác nhận"
		: recorder.state === "recording"
			? "Đang ghi"
			: recorder.state === "stopped"
				? "Đã ghi xong"
				: recorder.state === "requesting"
					? "Đang xin quyền"
					: recorder.state === "denied"
						? "Từ chối quyền"
						: "Sẵn sàng"

	const handleStop = useCallback(() => {
		recorder.stop()
	}, [recorder])

	const handleConfirm = useCallback(async () => {
		if (!recorder.audioBlob) {
			setUploadError("Không tìm thấy bản ghi âm. Vui lòng ghi lại.")
			return
		}
		setIsUploading(true)
		setUploadError(null)
		try {
			const audio = await uploadExamSpeakingAudio(recorder.audioBlob)
			const durationSeconds = Math.max(1, Math.round(recorder.elapsedMs / 1000))
			onDone(part.id, audio.audio_key, audio.audio_url, durationSeconds)
		} catch (error) {
			setUploadError(
				error instanceof Error ? error.message : "Không tải lên được bản ghi âm. Vui lòng thử lại.",
			)
		} finally {
			setIsUploading(false)
		}
	}, [recorder.audioBlob, recorder.elapsedMs, onDone, part.id])

	const handleRedo = useCallback(() => {
		setUploadError(null)
		recorder.reset()
		onUndone(part.id)
	}, [recorder, onUndone, part.id])

	const elapsedSec = Math.round(recorder.elapsedMs / 1000)
	const remaining = part.speaking_seconds - elapsedSec

	return (
		<div className="flex flex-1 overflow-hidden bg-background">
			{/* Left: scrollable content */}
			<ScrollArea className="w-1/2 border-r border-border">
				<div className="space-y-5 px-7 py-6">
					{/* Part header */}
					<div className="flex flex-wrap items-center gap-3">
						<ExamRoomSkillBadge tone="speaking">Phần {part.part}</ExamRoomSkillBadge>
						<span className="text-sm font-semibold text-foreground">{typeLabel}</span>
						<span className="ml-auto text-xs text-muted">
							{part.duration_minutes} phút · {part.speaking_seconds} giây ghi âm
						</span>
					</div>

					{/* Content prompt */}
					<PartContent part={part} />
				</div>
			</ScrollArea>

			{/* Right: recording panel */}
			<div className="flex w-1/2 flex-col px-7 py-6">
				<div className="mb-4 flex items-center justify-between">
					<p className="flex items-center gap-2 text-sm font-extrabold text-foreground">
						<svg
							viewBox="0 0 16 16"
							className="size-4 text-skill-speaking"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							aria-hidden="true"
						>
							<path d="M8 1a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0V3.5A2.5 2.5 0 008 1z" />
							<path d="M3 9a5 5 0 0010 0M8 14v2" />
						</svg>
						Bản ghi âm
					</p>
					<span
						className={cn(
							"rounded-full border px-2.5 py-0.5 text-xs font-bold",
							isDone
								? "border-primary/30 bg-primary-tint text-primary-dark"
								: recorder.state === "recording"
									? "border-destructive/40 bg-destructive-tint text-destructive"
									: recorder.state === "stopped"
										? "border-primary/30 bg-primary-tint text-primary-dark"
										: "border-border bg-surface text-muted",
						)}
					>
						{statusLabel}
					</span>
				</div>

				<div className="flex flex-1 items-center justify-center">
					{isDone ? (
						<div className="w-full max-w-md space-y-3 rounded-(--radius-card) border border-primary/30 bg-primary-tint p-5">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2.5">
									<span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
										<svg
											viewBox="0 0 16 16"
											className="size-4"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											strokeLinecap="round"
											aria-hidden="true"
										>
											<polyline points="2,8 6,12 14,4" />
										</svg>
									</span>
									<span className="text-sm font-extrabold text-primary-dark">
										Phần {part.part} đã hoàn thành
									</span>
								</div>
								<button
									type="button"
									onClick={handleRedo}
									className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs text-primary-dark"
								>
									Ghi lại
								</button>
							</div>
							{recorder.audioUrl && (
								<audio src={recorder.audioUrl} controls className="h-9 w-full">
									<track kind="captions" />
								</audio>
							)}
						</div>
					) : (
						<div className="w-full max-w-md space-y-5 rounded-(--radius-card) border border-border bg-surface p-6">
							{/* Big timer */}
							<div className="flex flex-col items-center gap-1.5">
								<span
									className={cn(
										"font-mono text-4xl font-black tabular-nums transition-colors",
										recorder.state === "recording" && remaining <= 10
											? "text-destructive"
											: recorder.state === "recording"
												? "text-foreground"
												: recorder.state === "stopped"
													? "text-primary-dark"
													: "text-muted/50",
									)}
								>
									{String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:
									{String(elapsedSec % 60).padStart(2, "0")}
								</span>
								<span className="text-xs font-semibold text-muted">
									Tối đa {Math.floor(part.speaking_seconds / 60)}:
									{String(part.speaking_seconds % 60).padStart(2, "0")}
								</span>
							</div>

							{/* Waveform / placeholder */}
							<div className="flex h-20 items-center justify-center rounded-(--radius-button) border-2 border-dashed border-border/60 bg-background/60">
								{recorder.state === "recording" && recorder.analyser ? (
									<WaveformBars analyser={recorder.analyser} />
								) : recorder.state === "stopped" && recorder.audioUrl ? (
									<audio src={recorder.audioUrl} controls className="mx-3 h-9 w-full max-w-sm">
										<track kind="captions" />
									</audio>
								) : (
									<span className="text-xs font-semibold text-subtle">
										{recorder.state === "requesting"
											? "Đang xin quyền micrô…"
											: recorder.state === "denied"
												? "Không có quyền micrô"
												: "Đọc đề bên trái rồi nhấn ghi âm"}
									</span>
								)}
							</div>

							{/* Actions */}
							<div className="flex justify-center gap-3">
								{recorder.state === "idle" && (
									<button
										type="button"
										onClick={recorder.start}
										className="btn bg-skill-speaking px-6 py-2.5 text-sm text-foreground [--btn-shadow:var(--color-skill-speaking-dark)]"
									>
										<span className="relative flex size-3 items-center justify-center">
											<span className="absolute inset-0 animate-ping rounded-full bg-white/50" />
											<span className="relative size-2.5 rounded-full bg-white" />
										</span>
										Bắt đầu ghi
									</button>
								)}
								{recorder.state === "requesting" && (
									<button type="button" disabled className="btn btn-primary opacity-60">
										Đang xử lý…
									</button>
								)}
								{recorder.state === "recording" && (
									<button
										type="button"
										onClick={handleStop}
										className="btn btn-destructive px-6 py-2.5 text-sm"
									>
										<span className="size-2.5 rounded-sm bg-white" />
										Dừng ghi
									</button>
								)}
								{recorder.state === "stopped" && (
									<>
										<button
											type="button"
											onClick={recorder.reset}
											disabled={isUploading}
											className="btn btn-secondary px-5 py-2.5 text-sm text-muted disabled:opacity-60"
										>
											Ghi lại
										</button>
										<button
											type="button"
											onClick={handleConfirm}
											disabled={isUploading}
											className="btn btn-secondary text-primary-dark disabled:opacity-60"
										>
											<svg
												viewBox="0 0 16 16"
												className="size-4"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.5"
												strokeLinecap="round"
												aria-hidden="true"
											>
												<polyline points="2,8 6,12 14,4" />
											</svg>
											{isUploading ? "Đang tải lên…" : "Xác nhận bản ghi"}
										</button>
									</>
								)}
							</div>

							{recorder.error && (
								<p className="text-center text-xs font-bold text-destructive">{recorder.error}</p>
							)}
							{uploadError && <p className="text-center text-xs font-bold text-destructive">{uploadError}</p>}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function SpeakingPanel({ parts, speakingDone, onMarkDone, onUnmarkDone, footer }: Props) {
	const sorted = [...parts].sort((a, b) => a.display_order - b.display_order)
	const [activeIdx, setActiveIdx] = useState(0)
	const active = sorted[activeIdx]
	const activeDone = active ? speakingDone.has(active.id) : false
	const handleNextPart = useCallback(
		() => setActiveIdx((i) => Math.min(i + 1, sorted.length - 1)),
		[sorted.length],
	)
	const hasNextPart = activeIdx < sorted.length - 1
	const activeFooter = hasNextPart
		? {
				...footer,
				isLastSkill: false,
				nextTone: "secondary" as const,
				statusText: activeDone
					? `Phần ${activeIdx + 1} đã xác nhận bản ghi`
					: `Phần ${activeIdx + 1} chưa xác nhận bản ghi`,
				nextLabel: `Tiếp: Phần ${activeIdx + 2}`,
				onNext: handleNextPart,
			}
		: footer

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* PartRecorder owns its own scroll + fixed recording area */}
			{active && (
				<PartRecorder
					key={active.id}
					part={active}
					isDone={speakingDone.has(active.id)}
					onDone={onMarkDone}
					onUndone={onUnmarkDone}
				/>
			)}

			<ExamRoomFooter
				{...activeFooter}
				toneClass="text-skill-speaking"
				context={
					<ExamRoomProgressTabs
						items={sorted.map((part, i) => {
							const done = speakingDone.has(part.id)
							return {
								id: String(i),
								label: `Phần ${i + 1}`,
								meta: done ? "✓" : undefined,
								progressPct: done ? 100 : 0,
							}
						})}
						activeId={String(activeIdx)}
						onChange={(id) => setActiveIdx(Number(id))}
					/>
				}
			/>
		</div>
	)
}
