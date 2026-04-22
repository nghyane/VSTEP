import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { submitDrillAttempt } from "#/features/practice/actions"
import type { SpeakingDrillDetail } from "#/features/practice/types"
import { useVoiceRecorder } from "#/features/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

interface Props {
	drill: SpeakingDrillDetail
	sessionId: string
}

const SPEEDS = [0.75, 1, 1.25] as const
const WPS = 2.25

function speakText(text: string, rate: number): Promise<void> {
	if (!("speechSynthesis" in window)) return Promise.resolve()
	return new Promise((resolve) => {
		const u = new SpeechSynthesisUtterance(text)
		u.rate = rate
		const voices = speechSynthesis.getVoices()
		const en = voices.find((v) => v.lang.startsWith("en-US")) ?? voices.find((v) => v.lang.startsWith("en"))
		if (en) u.voice = en
		u.onend = () => resolve()
		u.onerror = () => resolve()
		speechSynthesis.cancel()
		speechSynthesis.speak(u)
	})
}

function fmt(s: number): string {
	return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

export function SpeakingDrillInProgress({ drill, sessionId }: Props) {
	const sentences = drill.sentences
	const [current, setCurrent] = useState(0)
	const [done, setDone] = useState<Set<number>>(new Set())
	const [playing, setPlaying] = useState(false)
	const [speed, setSpeed] = useState<number>(1)
	const [elapsed, setElapsed] = useState(0)
	const playStart = useRef<number | null>(null)
	const sentence = sentences[current]
	const finished = done.size === sentences.length
	const isDone = done.has(current)

	const recorder = useVoiceRecorder(15)
	const prevRecState = useRef(recorder.state)

	const attemptMutation = useMutation({
		mutationFn: () => submitDrillAttempt(sessionId, sentence.id, "shadowing"),
		onSuccess: () => setDone((prev) => new Set(prev).add(current)),
	})

	useEffect(() => {
		if (prevRecState.current === "recording" && recorder.state === "stopped" && !done.has(current)) {
			attemptMutation.mutate()
		}
		prevRecState.current = recorder.state
	}, [recorder.state, attemptMutation.mutate, current, done])

	const duration = Math.max(1, Math.round(sentence.text.trim().split(/\s+/).length / (WPS * speed)))

	// TTS progress timer
	useEffect(() => {
		if (!playing) {
			playStart.current = null
			setElapsed(0)
			return
		}
		playStart.current = Date.now()
		const id = setInterval(() => {
			if (playStart.current === null) return
			setElapsed(Math.min((Date.now() - playStart.current) / 1000, duration))
		}, 120)
		return () => clearInterval(id)
	}, [playing, duration])

	const handlePlay = useCallback(async () => {
		setPlaying(true)
		await speakText(sentence.text, speed)
		setPlaying(false)
	}, [sentence.text, speed])

	const handleStop = useCallback(() => {
		speechSynthesis.cancel()
		setPlaying(false)
	}, [])

	const handleRecord = useCallback(() => {
		if (recorder.state === "recording") recorder.stop()
		else void recorder.start()
	}, [recorder])

	const prevIdx = useRef(current)
	useEffect(() => {
		if (prevIdx.current !== current) {
			recorder.reset()
			speechSynthesis.cancel()
			setPlaying(false)
			prevIdx.current = current
		}
	}, [current, recorder.reset])

	const isRecording = recorder.state === "recording"
	const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header bar */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/noi" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
					<div
						className="h-full bg-skill-speaking rounded-full transition-all"
						style={{ width: `${(done.size / sentences.length) * 100}%` }}
					/>
				</div>
				<span className="text-xs font-bold text-muted shrink-0">
					{done.size}/{sentences.length}
				</span>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-xl mx-auto px-6 py-8">
					{finished ? (
						<div className="text-center py-12">
							<img src="/mascot/lac-happy.png" alt="" className="w-24 h-24 mx-auto mb-4 object-contain" />
							<p className="font-extrabold text-2xl text-foreground">Hoàn thành!</p>
							<p className="text-sm text-muted mt-2">
								Bạn đã luyện xong {done.size}/{sentences.length} câu
							</p>
							<Link
								to="/luyen-tap/noi"
								className="btn btn-primary mt-6 px-8"
								style={{ background: "var(--color-skill-speaking)" }}
							>
								Về danh sách
							</Link>
						</div>
					) : (
						<div className="card p-0 overflow-hidden">
							{/* Sentence counter */}
							<div className="flex items-center justify-between px-5 pt-4">
								<span className="text-xs font-bold text-muted uppercase tracking-wide">
									Câu {current + 1} / {sentences.length}
								</span>
								{isDone && (
									<span className="text-xs font-bold text-primary bg-primary-tint px-2 py-0.5 rounded-full">
										Hoàn thành
									</span>
								)}
							</div>

							{/* Sentence text — nested card */}
							<div className="mx-5 mt-3 card p-5">
								<p className="text-xs font-bold text-muted uppercase tracking-wide">Câu mẫu</p>
								<p className="mt-2 text-lg font-bold text-foreground leading-relaxed">{sentence.text}</p>
								{sentence.translation && (
									<p className="mt-2 text-sm italic text-subtle">{sentence.translation}</p>
								)}
							</div>

							{/* Audio bar — listen */}
							<div className="mx-5 mt-4 card p-4">
								<div className="flex items-center justify-between mb-3">
									<div className="flex items-center gap-2 text-sm font-bold text-foreground">
										<Icon name="volume" size="xs" className="text-skill-speaking" />
										Nghe câu
									</div>
									<div className="flex gap-1">
										{SPEEDS.map((s) => (
											<button
												key={s}
												type="button"
												onClick={() => setSpeed(s)}
												className={cn(
													"px-2 py-0.5 text-xs font-bold rounded-lg transition",
													speed === s
														? "bg-skill-speaking text-primary-foreground"
														: "text-muted hover:text-foreground",
												)}
											>
												{s}x
											</button>
										))}
									</div>
								</div>
								<div className="flex items-center gap-3">
									<button
										type="button"
										onClick={playing ? handleStop : handlePlay}
										className="w-10 h-10 rounded-full bg-skill-speaking text-primary-foreground flex items-center justify-center shadow-[0_3px_0_oklch(0.45_0.18_280)] active:shadow-[0_1px_0_oklch(0.45_0.18_280)] active:translate-y-[2px] transition shrink-0"
									>
										<Icon name={playing ? "close" : "volume"} size="xs" />
									</button>
									<div className="flex-1 h-2 bg-background rounded-full relative border border-border min-w-0">
										<div
											className="absolute inset-y-0 left-0 bg-skill-speaking rounded-full transition-[width] duration-150"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<span className="text-xs text-muted tabular-nums shrink-0">
										{fmt(elapsed)} / {fmt(duration)}
									</span>
								</div>
							</div>

							{/* Record section */}
							<div className="flex flex-col items-center gap-3 px-5 py-6">
								{isRecording && recorder.analyser ? (
									<>
										<button type="button" onClick={handleRecord} className="cursor-pointer">
											<WaveformBars analyser={recorder.analyser} />
										</button>
										<p className="text-sm font-bold text-skill-speaking tabular-nums">
											{Math.round(recorder.elapsedMs / 1000)}s / 15s
										</p>
										<p className="text-xs text-muted">Bấm vào sóng âm để dừng</p>
									</>
								) : (
									<>
										<button
											type="button"
											onClick={handleRecord}
											className="h-14 min-w-52 rounded-full flex items-center justify-center gap-2 text-base font-bold bg-skill-speaking text-primary-foreground shadow-[0_4px_0] shadow-skill-speaking/40 transition active:translate-y-[2px] active:shadow-[0_2px_0]"
										>
											<Icon name="mic" size="xs" />
											{recorder.audioUrl ? "Ghi lại" : "Bắt đầu nhại"}
										</button>
										<p className="text-xs text-muted text-center">
											{recorder.audioUrl
												? "Bạn có thể ghi lại nếu chưa ưng ý"
												: "Nghe mẫu vài lần, sau đó bấm để nhại theo"}
										</p>
									</>
								)}
								{recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
							</div>

							{/* Playback */}
							{recorder.audioUrl && (
								<div className="mx-5 mb-5 card p-4">
									<p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Bản ghi của bạn</p>
									<audio src={recorder.audioUrl} controls className="w-full h-9">
										<track kind="captions" />
									</audio>
								</div>
							)}

							{/* Next sentence */}
							{isDone && current < sentences.length - 1 && (
								<div className="px-5 pb-5">
									<button
										type="button"
										onClick={() => setCurrent((c) => c + 1)}
										className="btn btn-secondary w-full"
									>
										Câu tiếp theo →
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Footer — sentence nav chips */}
			<div className="flex items-center justify-center gap-2 border-t-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<span className="text-xs font-bold text-muted shrink-0 mr-2">
					{done.size}/{sentences.length} câu
				</span>
				{sentences.map((_, i) => (
					<button
						key={sentences[i].id}
						type="button"
						onClick={() => setCurrent(i)}
						className={cn(
							"w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition shrink-0",
							i === current
								? "border-skill-speaking bg-skill-speaking text-primary-foreground"
								: done.has(i)
									? "border-primary bg-primary-tint text-primary"
									: "border-border bg-surface text-muted",
						)}
					>
						{i + 1}
					</button>
				))}
			</div>
		</div>
	)
}

const BAR_COUNT = 24

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
					const v = bins[i * step] / 255
					const h = Math.max(4, v * 40)
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
		<div ref={barsRef} className="flex items-center justify-center gap-[3px] h-10">
			{Array.from({ length: BAR_COUNT }, (_, i) => (
				<div
					key={i}
					className="w-1 rounded-full bg-skill-speaking transition-[height] duration-75"
					style={{ height: "4px" }}
				/>
			))}
		</div>
	)
}
