import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { submitVstepSpeaking } from "#/features/practice/actions"
import { TranslateSelection } from "#/features/practice/components/TranslateSelection"
import type { SpeakingTaskDetail } from "#/features/practice/types"
import { useVoiceRecorder } from "#/features/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

interface Props {
	task: SpeakingTaskDetail
	sessionId: string
}

function fmt(s: number): string {
	return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

export function VstepSpeakingInProgress({ task, sessionId }: Props) {
	const [submissionId, setSubmissionId] = useState<string | null>(null)
	const recorder = useVoiceRecorder(task.speaking_seconds)
	const [countdown, setCountdown] = useState(task.speaking_seconds)
	const startTime = useRef<number | null>(null)

	// Countdown while recording
	useEffect(() => {
		if (recorder.state !== "recording") {
			setCountdown(task.speaking_seconds)
			startTime.current = null
			return
		}
		startTime.current = Date.now()
		const id = setInterval(() => {
			if (startTime.current === null) return
			const elapsed = (Date.now() - startTime.current) / 1000
			setCountdown(Math.max(0, task.speaking_seconds - elapsed))
		}, 100)
		return () => clearInterval(id)
	}, [recorder.state, task.speaking_seconds])

	const submitMutation = useMutation({
		mutationFn: () => {
			const duration = Math.round(recorder.elapsedMs / 1000)
			return submitVstepSpeaking(sessionId, recorder.audioUrl ?? "", duration)
		},
		onSuccess: (res) => setSubmissionId(res.data.submission_id),
	})

	const handleRecord = useCallback(() => {
		if (recorder.state === "recording") recorder.stop()
		else void recorder.start()
	}, [recorder])

	const isRecording = recorder.state === "recording"

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Header */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/noi" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-bold text-foreground truncate">{task.title}</p>
				</div>
				<span className="text-xs font-bold text-skill-speaking shrink-0">Part {task.part}</span>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-xl mx-auto px-6 py-8">
					{submissionId ? (
						<div className="text-center py-12">
							<img src="/mascot/lac-happy.png" alt="" className="w-24 h-24 mx-auto mb-4 object-contain" />
							<p className="font-extrabold text-2xl text-foreground">Đã nộp bài!</p>
							<p className="text-sm text-muted mt-2">AI đang chấm bài nói của bạn</p>
							<div className="flex items-center justify-center gap-3 mt-6">
								<Link
									to="/grading/speaking/$submissionId"
									params={{ submissionId }}
									className="btn px-8 text-primary-foreground"
									style={
										{
											background: "var(--color-skill-speaking)",
											"--btn-shadow": "var(--color-skill-speaking-dark)",
										} as React.CSSProperties
									}
								>
									Xem kết quả
								</Link>
								<Link
									to="/luyen-tap/noi"
									className="py-2 px-5 font-bold text-sm rounded-(--radius-button) border-2 border-border text-muted uppercase"
								>
									Về danh sách
								</Link>
							</div>
						</div>
					) : (
						<div className="space-y-5">
							{/* Task prompt */}
							<div className="card p-6">
								<p className="text-xs font-bold text-skill-speaking bg-skill-speaking/10 px-2.5 py-1 rounded-full inline-block mb-3">
									Part {task.part} · {task.task_type}
								</p>
								<TranslateSelection>
									{task.content.topics.map((topic) => (
										<div key={topic.name} className="mb-3 last:mb-0">
											<p className="text-sm font-bold text-foreground mb-1">{topic.name}</p>
											<ul className="space-y-1">
												{topic.questions.map((q) => (
													<li key={q} className="text-sm text-subtle flex gap-2">
														<span className="text-skill-speaking shrink-0">•</span>
														{q}
													</li>
												))}
											</ul>
										</div>
									))}
								</TranslateSelection>
							</div>

							{/* Timer + Record */}
							<div className="card p-6 flex flex-col items-center gap-4">
								<div className="text-center">
									<p className="text-xs font-bold text-muted mb-1">Thời gian còn lại</p>
									<p
										className={cn(
											"text-3xl font-extrabold tabular-nums",
											isRecording && countdown < 10 ? "text-warning" : "text-skill-speaking",
										)}
									>
										{fmt(countdown)}
									</p>
								</div>

								{isRecording && recorder.analyser ? (
									<>
										<button type="button" onClick={handleRecord} className="cursor-pointer">
											<WaveformBars analyser={recorder.analyser} />
										</button>
										<p className="text-xs text-muted">Bấm vào sóng âm để dừng</p>
									</>
								) : (
									<>
										<button
											type="button"
											onClick={handleRecord}
											disabled={!!recorder.audioUrl}
											className="h-14 min-w-52 rounded-full flex items-center justify-center gap-2 text-base font-bold bg-skill-speaking text-primary-foreground shadow-[0_4px_0_var(--color-skill-speaking-dark)] transition active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-skill-speaking-dark)] disabled:opacity-50"
										>
											<Icon name="mic" size="xs" />
											{recorder.audioUrl ? "Đã ghi xong" : "Bắt đầu nói"}
										</button>
										<p className="text-xs text-muted">
											{recorder.audioUrl
												? "Nghe lại bản ghi bên dưới rồi nộp bài"
												: "Đọc đề bài, chuẩn bị rồi bấm để ghi âm"}
										</p>
									</>
								)}
								{recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
							</div>

							{/* Playback + Submit */}
							{recorder.audioUrl && (
								<div className="space-y-4">
									<div className="card p-4">
										<p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">
											Bản ghi của bạn
										</p>
										<audio src={recorder.audioUrl} controls className="w-full h-9">
											<track kind="captions" />
										</audio>
									</div>
									<button
										type="button"
										onClick={() => submitMutation.mutate()}
										disabled={submitMutation.isPending}
										className="w-full h-12 rounded-(--radius-button) font-bold text-sm text-primary-foreground bg-skill-speaking shadow-[0_3px_0_var(--color-skill-speaking-dark)] active:shadow-[0_1px_0_var(--color-skill-speaking-dark)] active:translate-y-[2px] transition disabled:opacity-50 uppercase"
									>
										{submitMutation.isPending ? "Đang nộp..." : "Nộp bài"}
									</button>
								</div>
							)}
						</div>
					)}
				</div>
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
