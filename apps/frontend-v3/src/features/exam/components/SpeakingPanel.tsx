import { useCallback, useEffect, useRef, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import type { ExamVersionSpeakingPart } from "#/features/exam/types"
import { useVoiceRecorder } from "#/features/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

interface FooterAction {
	skillLabel: string
	skillProgress: string
	isLastSkill: boolean
	isSubmitting: boolean
	onSubmit: () => void
	onNext: () => void
}

interface Props {
	parts: ExamVersionSpeakingPart[]
	speakingDone: Set<string>
	onMarkDone: (partId: string) => void
	footer: FooterAction
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
		<div ref={barsRef} className="flex h-11 items-center justify-center gap-[3px]">
			{Array.from({ length: BAR_COUNT }, (_, i) => (
				<div
					key={i}
					className="w-1 rounded-full bg-primary transition-[height] duration-75"
					style={{ height: "4px" }}
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
		<div className="space-y-4">
			{topics.map((topic) => (
				<div key={topic.name}>
					<p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">{topic.name}</p>
					<ul className="space-y-2">
						{topic.questions.map((q, i) => (
							<li
								key={i}
								className="flex gap-2 rounded-(--radius-card) border-2 border-border bg-surface p-3 text-sm"
							>
								<span className="shrink-0 font-extrabold text-primary">{i + 1}.</span>
								<span className="text-foreground">{q}</span>
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
			<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-4">
				<p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Tình huống</p>
				<p className="text-sm leading-relaxed text-foreground">{content.situation as string}</p>
			</div>
			<div>
				<p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Các phương án</p>
				<ul className="space-y-2">
					{(content.solutions as string[]).map((s, i) => (
						<li
							key={i}
							className="flex gap-2 rounded-(--radius-button) border-2 border-border bg-surface px-3 py-2 text-sm"
						>
							<span className="shrink-0 font-extrabold text-primary">{String.fromCharCode(65 + i)}.</span>
							<span className="text-foreground">{s}</span>
						</li>
					))}
				</ul>
			</div>
			<div className="rounded-(--radius-card) border-2 border-b-4 border-primary/20 bg-primary-tint p-4">
				<p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-primary">Nhiệm vụ</p>
				<p className="text-sm leading-relaxed text-foreground">{content.task as string}</p>
			</div>
		</div>
	)
}

function TopicContent({ content }: { content: Record<string, unknown> }) {
	return (
		<div className="space-y-4">
			<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-4">
				<p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Chủ đề</p>
				<p className="text-base font-extrabold text-foreground">{content.topic as string}</p>
			</div>
			<div className="rounded-(--radius-card) border-2 border-border bg-surface p-4">
				<p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">Gợi ý</p>
				<p className="text-sm leading-relaxed text-foreground">{content.prompt as string}</p>
			</div>
			{Array.isArray(content.follow_up_questions) && (
				<div>
					<p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Câu hỏi mở</p>
					<ul className="space-y-2">
						{(content.follow_up_questions as string[]).map((q, i) => (
							<li
								key={i}
								className="flex gap-2 rounded-(--radius-button) border-2 border-border bg-surface px-3 py-2 text-sm"
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
		<div className="rounded-(--radius-card) border-2 border-border bg-surface p-4">
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
	onDone: (partId: string) => void
}

function PartRecorder({ part, isDone, onDone }: PartRecorderProps) {
	const recorder = useVoiceRecorder(part.speaking_seconds)
	const typeLabel = PART_TYPE_LABEL[part.type] ?? part.type

	const handleFinish = useCallback(() => {
		recorder.stop()
		onDone(part.id)
	}, [recorder, onDone, part.id])

	const elapsedSec = Math.round(recorder.elapsedMs / 1000)
	const remaining = part.speaking_seconds - elapsedSec

	return (
		<div className="space-y-5">
			{/* Part header */}
			<div className="flex flex-wrap items-center gap-3">
				<span className="rounded-full border-2 border-b-4 border-skill-speaking/30 bg-skill-speaking/10 px-3 py-1 text-xs font-extrabold text-skill-speaking">
					Phần {part.part}
				</span>
				<span className="text-sm font-semibold text-foreground">{typeLabel}</span>
				<span className="ml-auto text-xs text-muted">
					{part.duration_minutes} phút · {part.speaking_seconds}s ghi âm
				</span>
			</div>

			{/* Content prompt */}
			<PartContent part={part} />

			{/* Recording card */}
			<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-5 space-y-4">
				{/* Status */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{recorder.state === "idle" && <span className="text-sm text-muted">Đọc đề rồi nhấn ghi âm</span>}
						{recorder.state === "requesting" && (
							<span className="text-sm text-muted">Đang xin quyền microphone...</span>
						)}
						{recorder.state === "recording" && (
							<>
								<span className="size-2.5 animate-pulse rounded-full bg-destructive" />
								<span className="text-sm font-extrabold text-destructive">Đang ghi âm</span>
							</>
						)}
						{recorder.state === "stopped" && (
							<>
								<svg
									viewBox="0 0 16 16"
									className="size-4 text-primary"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									aria-hidden="true"
								>
									<polyline points="2,8 6,12 14,4" />
								</svg>
								<span className="text-sm font-extrabold text-primary">Đã ghi xong</span>
							</>
						)}
						{recorder.state === "denied" && (
							<span className="text-sm font-bold text-destructive">Không có quyền microphone</span>
						)}
					</div>

					{/* Countdown */}
					{recorder.state === "recording" && (
						<span
							className={cn(
								"font-mono text-sm font-extrabold tabular-nums",
								remaining <= 10 ? "text-destructive" : "text-muted",
							)}
						>
							{elapsedSec}s / {part.speaking_seconds}s
						</span>
					)}
				</div>

				{/* Real waveform when recording */}
				{recorder.state === "recording" && recorder.analyser && (
					<div className="flex items-center justify-center py-1">
						<WaveformBars analyser={recorder.analyser} />
					</div>
				)}

				{/* Playback */}
				{recorder.audioUrl && recorder.state === "stopped" && (
					<div>
						<p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-muted">Bản ghi của bạn</p>
						<audio src={recorder.audioUrl} controls className="w-full h-9">
							<track kind="captions" />
						</audio>
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-center gap-3">
					{recorder.state === "idle" && (
						<button type="button" onClick={recorder.start} className="btn btn-primary">
							<svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true">
								<circle cx="8" cy="8" r="4" />
								<circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
							</svg>
							Bắt đầu ghi
						</button>
					)}
					{recorder.state === "requesting" && (
						<button type="button" disabled className="btn btn-primary opacity-60">
							Đang xử lý...
						</button>
					)}
					{recorder.state === "recording" && (
						<button
							type="button"
							onClick={handleFinish}
							className="flex items-center gap-2 rounded-(--radius-button) border-2 border-b-4 border-destructive/70 bg-destructive px-5 py-2 text-sm font-bold text-white transition-all active:translate-y-[2px] active:border-b-2 hover:opacity-90"
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
								className="rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-5 py-2 text-sm font-bold text-muted transition-all active:translate-y-[2px] active:border-b-2 hover:border-primary/40 hover:text-foreground"
							>
								Ghi lại
							</button>
							{!isDone && (
								<button type="button" onClick={handleFinish} className="btn btn-primary">
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
									Xác nhận
								</button>
							)}
						</>
					)}
				</div>

				{recorder.error && <p className="text-sm text-destructive">{recorder.error}</p>}
			</div>

			{/* Done banner */}
			{isDone && (
				<div className="flex items-center gap-2 rounded-(--radius-button) border-2 border-b-4 border-primary/30 bg-primary-tint px-4 py-3">
					<svg
						viewBox="0 0 16 16"
						className="size-4 shrink-0 text-primary"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.5"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<polyline points="2,8 6,12 14,4" />
					</svg>
					<span className="text-sm font-extrabold text-primary">Phần {part.part} đã hoàn thành</span>
				</div>
			)}
		</div>
	)
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function SpeakingPanel({ parts, speakingDone, onMarkDone, footer }: Props) {
	const sorted = [...parts].sort((a, b) => a.display_order - b.display_order)
	const [activeIdx, setActiveIdx] = useState(0)
	const active = sorted[activeIdx]

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<ScrollArea className="flex-1 bg-background">
				<div className="mx-auto max-w-lg px-5 py-6">
					{active && (
						<PartRecorder
							key={active.id}
							part={active}
							isDone={speakingDone.has(active.id)}
							onDone={onMarkDone}
						/>
					)}
				</div>
			</ScrollArea>

			{/* Part tabs */}
			<div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
				<div className="flex items-center gap-2">
					<svg
						viewBox="0 0 16 16"
						className="size-4 shrink-0 text-skill-speaking"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						aria-hidden="true"
					>
						<path d="M8 1a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0V3.5A2.5 2.5 0 008 1z" />
						<path d="M3 9a5 5 0 0010 0M8 14v2" />
					</svg>
					<span className="text-sm font-extrabold text-foreground">Phần {activeIdx + 1}</span>
				</div>

				<div className="flex items-center gap-1.5">
					{sorted.map((p, i) => {
						const isActive = i === activeIdx
						const done = speakingDone.has(p.id)
						return (
							<button
								key={p.id}
								type="button"
								onClick={() => setActiveIdx(i)}
								className={cn(
									"relative overflow-hidden rounded-(--radius-button) border-2 border-b-4 px-3 pb-2.5 pt-1.5 text-xs font-extrabold transition-all active:translate-y-[2px] active:border-b-2",
									isActive
										? "border-primary/70 bg-primary text-white"
										: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
								)}
							>
								<span className="inline-flex items-center gap-1.5">
									Phần {i + 1}
									{done && <span className="text-[10px]">✓</span>}
								</span>
								<span
									className={cn(
										"absolute inset-x-1 bottom-0.5 h-0.5 overflow-hidden rounded-full",
										isActive ? "bg-white/30" : done ? "bg-primary/30" : "bg-border",
									)}
								>
									<span
										className={cn(
											"block h-full rounded-full",
											isActive ? "bg-white" : done ? "bg-primary" : "",
										)}
										style={{ width: done ? "100%" : "0%" }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				<div className="w-20">
					<p className="text-right text-xs text-muted">
						{speakingDone.size}/{sorted.length} xong
					</p>
				</div>
			</div>

			{/* Global footer */}
			<div className="z-40 flex h-14 shrink-0 items-center justify-between border-t border-border bg-card px-5">
				<div className="w-24">
					<p className="text-xs text-muted">
						{speakingDone.size}/{sorted.length} hoàn thành
					</p>
				</div>
				<p className="text-sm font-extrabold text-skill-speaking">
					{footer.skillLabel}
					<span className="ml-1 text-xs font-normal text-muted">({footer.skillProgress})</span>
				</p>
				{footer.isLastSkill ? (
					<button
						type="button"
						onClick={footer.onSubmit}
						disabled={footer.isSubmitting}
						className="btn btn-primary disabled:opacity-60"
					>
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="2,8 6,12 14,4" />
						</svg>
						Nộp bài
					</button>
				) : (
					<button type="button" onClick={footer.onNext} className="btn btn-secondary">
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
			</div>
		</div>
	)
}
