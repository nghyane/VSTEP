// MockSpeakingRecorder — UI ghi âm cho speaking exam.

import { Loader2, Mic, Square } from "lucide-react"
import { useCallback, useEffect, useRef } from "react"
import { useVoiceRecorder } from "#/features/practice/lib/use-voice-recorder"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

type RecorderPhase = "idle" | "recording" | "processing" | "done"

function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onloadend = () => {
			if (typeof reader.result === "string") resolve(reader.result)
			else reject(new Error("Không thể đọc audio đã ghi."))
		}
		reader.onerror = () => reject(reader.error ?? new Error("Không thể đọc audio đã ghi."))
		reader.readAsDataURL(blob)
	})
}

export function loadPersistedRecordings(storageKey: string): Record<string, string> {
	if (typeof window === "undefined") return {}
	try {
		const stored = window.sessionStorage.getItem(storageKey)
		if (!stored) return {}
		const parsed = JSON.parse(stored)
		if (!parsed || typeof parsed !== "object") return {}
		return Object.fromEntries(
			Object.entries(parsed).filter(
				(entry): entry is [string, string] =>
					typeof entry[0] === "string" && typeof entry[1] === "string",
			),
		)
	} catch {
		return {}
	}
}

export function MockSpeakingRecorder({
	speakingSeconds,
	alreadyDone,
	audioUrl,
	onDone,
	onRecorded,
}: {
	speakingSeconds: number
	alreadyDone: boolean
	audioUrl: string | null
	onDone: () => void
	onRecorded: (audioUrl: string) => void
}) {
	const recorder = useVoiceRecorder(speakingSeconds)
	const prevStateRef = useRef(recorder.state)

	const fmt = (s: number) => {
		const m = Math.floor(s / 60)
		const sec = s % 60
		return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
	}

	useEffect(() => {
		let cancelled = false
		if (
			prevStateRef.current === "recording" &&
			recorder.state === "stopped" &&
			recorder.audioBlob
		) {
			void blobToDataUrl(recorder.audioBlob).then((dataUrl) => {
				if (cancelled) return
				onRecorded(dataUrl)
				onDone()
			})
		}
		prevStateRef.current = recorder.state
		return () => {
			cancelled = true
		}
	}, [recorder.state, recorder.audioBlob, onDone, onRecorded])

	const phase: RecorderPhase =
		recorder.state === "recording"
			? "recording"
			: recorder.state === "requesting"
				? "processing"
				: audioUrl || alreadyDone || recorder.state === "stopped"
					? "done"
					: "idle"
	const handleStart = useCallback(() => {
		void recorder.start()
	}, [recorder])
	const handleStop = useCallback(() => {
		recorder.stop()
	}, [recorder])
	const handleRetry = useCallback(() => {
		void recorder.start()
	}, [recorder])
	const remainingSeconds = Math.max(0, speakingSeconds - Math.round(recorder.elapsedMs / 1000))

	return (
		<div className="space-y-3 rounded-xl border border-b-2 border-b-border/60 bg-card p-4">
			<div
				className={cn(
					"flex h-14 items-center justify-center rounded-lg border",
					phase === "recording"
						? "border-destructive/40 bg-destructive/5"
						: phase === "processing"
							? "border-primary/30 bg-primary/5"
							: phase === "done"
								? "border-success/30 bg-success/5"
								: "bg-muted/30",
				)}
			>
				{phase === "idle" && (
					<span className="text-sm text-muted-foreground">Bấm "Bắt đầu" để ghi âm</span>
				)}
				{phase === "recording" && (
					<div className="flex items-center gap-3">
						<span className="size-2.5 animate-pulse rounded-full bg-destructive" />
						<span className="text-sm font-semibold text-destructive">
							Đang ghi âm... {fmt(remainingSeconds)}
						</span>
					</div>
				)}
				{phase === "processing" && (
					<div className="flex items-center gap-2">
						<Loader2 className="size-4 animate-spin text-primary" />
						<span className="text-sm text-primary">Đang xử lý...</span>
					</div>
				)}
				{phase === "done" && (
					<div className="flex items-center gap-2">
						<span className="size-2 rounded-full bg-success/50" />
						<span className="text-sm font-medium text-success">
							Đã ghi âm xong — bấm "Ghi lại" nếu muốn thử
						</span>
					</div>
				)}
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				{phase === "idle" && (
					<Button size="sm" onClick={handleStart}>
						<Mic className="size-4" />
						Bắt đầu ghi âm
					</Button>
				)}
				{phase === "recording" && (
					<Button size="sm" variant="destructive" onClick={handleStop}>
						<Square className="size-3.5" />
						Dừng
					</Button>
				)}
				{phase === "done" && (
					<Button size="sm" variant="outline" onClick={handleRetry}>
						<Mic className="size-4 text-destructive" />
						Ghi lại
					</Button>
				)}
			</div>
			{recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
			{audioUrl && (
				<div className="space-y-2 rounded-lg border bg-background p-3">
					<p className="text-xs font-medium text-muted-foreground">Nghe lại bản ghi của bạn</p>
					<audio src={audioUrl} controls className="h-9 w-full">
						<track kind="captions" />
					</audio>
				</div>
			)}
			{phase === "done" && (
				<p className="text-xs font-semibold text-success">Đã ghi âm thành công</p>
			)}
		</div>
	)
}
