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
	onUnmarkDone: (partId: string) => void
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
					<p className="mb-2.5 text-xs font-extrabold uppercase tracking-wide text-muted">{topic.name}</p>
					<ul className="space-y-2">
						{topic.questions.map((q, i) => (
							<li
								key={i}
								className="flex items-start gap-3 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface px-4 py-3 text-sm"
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
	onUndone: (partId: string) => void
}

function PartRecorder({ part, isDone, onDone, onUndone }: PartRecorderProps) {
	const recorder = useVoiceRecorder(part.speaking_seconds)
	const typeLabel = PART_TYPE_LABEL[part.type] ?? part.type

	const handleFinish = useCallback(() => {
		recorder.stop()
		onDone(part.id)
	}, [recorder, onDone, part.id])

	const handleRedo = useCallback(() => {
		recorder.reset()
		onUndone(part.id)
	}, [recorder, onUndone, part.id])

	const elapsedSec = Math.round(recorder.elapsedMs / 1000)
	const remaining = part.speaking_seconds - elapsedSec

	return (
		<div className="flex flex-1 overflow-hidden">
			{/* Left: scrollable content */}
			<ScrollArea className="w-1/2 border-r border-border">
				<div className="space-y-5 px-7 py-6">
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
				</div>
			</ScrollArea>

			{/* Right: recording panel */}
			<div className="flex w-1/2 flex-col bg-background px-7 py-6">
				<div className="mb-5 flex items-center justify-between">
					<p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-muted">
						<svg
							viewBox="0 0 16 16"
							className="size-3.5 text-skill-speaking"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
							aria-hidden="true"
						>
							<path d="M8 1a2.5 2.5 0 00-2.5 2.5v5a2.5 2.5 0 005 0V3.5A2.5 2.5 0 008 1z" />
							<path d="M3 9a5 5 0 0010 0M8 14v2" />
						</svg>
						Bản ghi âm · Phần {part.part}
					</p>
					<span
						className={cn(
							"rounded-full border-2 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide",
							isDone
								? "border-primary/30 bg-primary-tint text-primary"
								: recorder.state === "recording"
									? "border-destructive/40 bg-destructive-tint text-destructive"
									: recorder.state === "stopped"
										? "border-primary/30 bg-primary-tint text-primary"
										: "border-border bg-surface text-muted",
						)}
					>
						{isDone
							? "Đã xác nhận"
							: recorder.state === "recording"
								? "Đang ghi"
								: recorder.state === "stopped"
									? "Đã ghi xong"
									: recorder.state === "requesting"
										? "Đang xin quyền"
										: recorder.state === "denied"
											? "Từ chối quyền"
											: "Sẵn sàng"}
					</span>
				</div>

				<div className="flex flex-1 items-start justify-center pt-20">
					{isDone ? (
						<div className="w-full max-w-md space-y-3 rounded-(--radius-card) border-2 border-b-4 border-primary/30 bg-primary-tint p-5">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2.5">
									<span className="flex size-8 items-center justify-center rounded-full border-2 border-b-4 border-primary/40 bg-primary text-white">
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
									className="shrink-0 rounded-(--radius-button) border-2 border-b-4 border-primary/30 bg-surface px-3 py-1.5 text-xs font-extrabold text-primary-dark transition-all active:translate-y-[2px] active:border-b-2 hover:border-primary/50"
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
						<div className="w-full max-w-md space-y-5 rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-6">
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
											? "Đang xin quyền microphone…"
											: recorder.state === "denied"
												? "Không có quyền microphone"
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
										className="flex items-center gap-2 rounded-(--radius-button) border-2 border-b-4 border-skill-speaking-dark bg-skill-speaking px-6 py-2.5 text-sm font-extrabold text-white transition-all active:translate-y-[2px] active:border-b-2 hover:brightness-105"
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
										onClick={handleFinish}
										className="flex items-center gap-2 rounded-(--radius-button) border-2 border-b-4 border-destructive/70 bg-destructive px-6 py-2.5 text-sm font-extrabold text-white transition-all active:translate-y-[2px] active:border-b-2 hover:brightness-105"
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
											className="rounded-(--radius-button) border-2 border-b-4 border-border bg-surface px-5 py-2.5 text-sm font-extrabold text-muted transition-all active:translate-y-[2px] active:border-b-2 hover:border-primary/40 hover:text-foreground"
										>
											Ghi lại
										</button>
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
									</>
								)}
							</div>

							{recorder.error && (
								<p className="text-center text-xs font-bold text-destructive">{recorder.error}</p>
							)}
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

			{/* Part tabs */}
			<div className="flex items-center justify-between gap-3 border-t-2 border-border/50 bg-card px-4 py-2.5">
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
										"absolute inset-x-0 bottom-0 h-1 overflow-hidden",
										isActive ? "bg-white/20" : "bg-primary/10",
									)}
								>
									<span
										className={cn(
											"block h-full transition-[width] duration-300",
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
			<div className="z-40 flex h-14 shrink-0 items-center justify-between border-t-2 border-border/50 bg-card px-5">
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
