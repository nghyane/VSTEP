import { ChevronLeft, ChevronRight, Loader2, Mic, Square } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "#/components/ui/button"
import type { MockSpeakingPart, SpeakingDoneSet } from "#/lib/mock/exam-session"
import { useVoiceRecorder } from "#/lib/practice/use-voice-recorder"
import { cn } from "#/lib/utils"

// ─── Mock recorder ────────────────────────────────────────────────────────────

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

function loadPersistedRecordings(storageKey: string): Record<string, string> {
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

function MockSpeakingRecorder({
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
		<div className="space-y-3 rounded-xl border bg-muted/10 p-4">
			{/* Status bar */}
			<div
				className={cn(
					"flex h-14 items-center justify-center rounded-lg border",
					phase === "recording"
						? "border-destructive/30 bg-destructive/5"
						: phase === "processing"
							? "border-primary/30 bg-primary/5"
							: "bg-muted/30",
				)}
			>
				{phase === "idle" && (
					<span className="text-sm text-muted-foreground">Bấm "Bắt đầu" để ghi âm</span>
				)}
				{phase === "recording" && (
					<div className="flex items-center gap-3">
						<span className="size-2 animate-pulse rounded-full bg-destructive" />
						<span className="text-sm font-medium text-destructive">
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
					<span className="text-sm text-muted-foreground">
						Đã ghi xong ✓ — bấm "Ghi lại" nếu muốn thử lại
					</span>
				)}
			</div>

			{/* Buttons */}
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
				<p className="text-xs font-medium text-emerald-600">✓ Đã ghi âm thành công</p>
			)}
		</div>
	)
}

// ─── Part content renderers ───────────────────────────────────────────────────

function Part1Content({
	part,
	done,
	audioUrl,
	onDone,
	onRecorded,
}: {
	part: MockSpeakingPart
	done: boolean
	audioUrl: string | null
	onDone: () => void
	onRecorded: (audioUrl: string) => void
}) {
	return (
		<div className="space-y-6">
			{(part.topics ?? []).map((topic) => (
				<div key={topic.name} className="space-y-3">
					<h4 className="font-semibold">{topic.name}</h4>
					<ul className="space-y-2 pl-1">
						{topic.questions.map((q, qi) => (
							<li
								key={`q-${qi}`}
								className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm"
							>
								<span className="shrink-0 font-medium text-primary">{qi + 1}.</span>
								<span>{q}</span>
							</li>
						))}
					</ul>
				</div>
			))}
			<MockSpeakingRecorder
				speakingSeconds={part.speakingSeconds}
				alreadyDone={done}
				audioUrl={audioUrl}
				onDone={onDone}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

function Part2Content({
	part,
	done,
	audioUrl,
	onDone,
	onRecorded,
}: {
	part: MockSpeakingPart
	done: boolean
	audioUrl: string | null
	onDone: () => void
	onRecorded: (audioUrl: string) => void
}) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{part.situation}</p>
			</div>

			{(part.options ?? []).length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-medium">Các lựa chọn:</p>
					<div className="grid gap-2 sm:grid-cols-2">
						{(part.options ?? []).map((opt, i) => (
							<div
								key={`opt-${i}`}
								className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm"
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
									{i + 1}
								</span>
								<span>{opt}</span>
							</div>
						))}
					</div>
				</div>
			)}

			<p className="text-xs text-muted-foreground">
				Thời gian nói:{" "}
				{part.speakingSeconds < 60
					? `${part.speakingSeconds}s`
					: `${Math.floor(part.speakingSeconds / 60)}m`}
			</p>
			<MockSpeakingRecorder
				speakingSeconds={part.speakingSeconds}
				alreadyDone={done}
				audioUrl={audioUrl}
				onDone={onDone}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

function Part3Content({
	part,
	done,
	audioUrl,
	onDone,
	onRecorded,
}: {
	part: MockSpeakingPart
	done: boolean
	audioUrl: string | null
	onDone: () => void
	onRecorded: (audioUrl: string) => void
}) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{part.centralIdea}</p>
			</div>

			{(part.suggestions ?? []).length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-medium">Gợi ý:</p>
					<ul className="space-y-2">
						{(part.suggestions ?? []).map((s, i) => (
							<li
								key={`sug-${i}`}
								className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm"
							>
								<span className="shrink-0 text-primary">•</span>
								<span>{s}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			{part.followUpQuestion && (
				<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
					<p className="text-sm font-medium text-primary">Câu hỏi tiếp theo:</p>
					<p className="mt-1 text-sm">{part.followUpQuestion}</p>
				</div>
			)}

			<p className="text-xs text-muted-foreground">
				Thời gian nói:{" "}
				{part.speakingSeconds < 60
					? `${part.speakingSeconds}s`
					: `${Math.floor(part.speakingSeconds / 60)}m`}
			</p>
			<MockSpeakingRecorder
				speakingSeconds={part.speakingSeconds}
				alreadyDone={done}
				audioUrl={audioUrl}
				onDone={onDone}
				onRecorded={onRecorded}
			/>
		</div>
	)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	parts: MockSpeakingPart[]
	doneParts: SpeakingDoneSet
	storageKey: string
	onPartDone: (partId: string) => void
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function SpeakingExamPanel({ parts, doneParts, storageKey, onPartDone }: Props) {
	const sorted = useMemo(() => [...parts].sort((a, b) => a.part - b.part), [parts])
	const [activeIdx, setActiveIdx] = useState(0)
	const [recordings, setRecordings] = useState<Record<string, string>>(() =>
		loadPersistedRecordings(storageKey),
	)

	useEffect(() => {
		setRecordings(loadPersistedRecordings(storageKey))
	}, [storageKey])

	useEffect(() => {
		if (typeof window === "undefined") return
		window.sessionStorage.setItem(storageKey, JSON.stringify(recordings))
	}, [recordings, storageKey])

	const handlePrev = useCallback(() => setActiveIdx((i) => Math.max(0, i - 1)), [])
	const handleNext = useCallback(
		() => setActiveIdx((i) => Math.min(i + 1, sorted.length - 1)),
		[sorted.length],
	)

	const handleRecorded = useCallback((partId: string, audioUrl: string) => {
		setRecordings((prev) => ({ ...prev, [partId]: audioUrl }))
	}, [])

	const activePart = sorted[activeIdx]
	if (!activePart) return null

	const PART_LABEL: Record<MockSpeakingPart["type"], string> = {
		social: "Social Interaction",
		solution: "Solution Discussion",
		development: "Topic Development",
	}

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					<div className="flex items-center gap-3">
						<Mic className="size-5 text-primary" />
						<h3 className="text-lg font-semibold">Speaking — Part {activePart.part}</h3>
						<span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
							{PART_LABEL[activePart.type]}
						</span>
					</div>

					{activePart.type === "social" && (
						<Part1Content
							part={activePart}
							done={doneParts.has(activePart.id)}
							audioUrl={recordings[activePart.id] ?? null}
							onDone={() => onPartDone(activePart.id)}
							onRecorded={(audioUrl) => handleRecorded(activePart.id, audioUrl)}
						/>
					)}
					{activePart.type === "solution" && (
						<Part2Content
							part={activePart}
							done={doneParts.has(activePart.id)}
							audioUrl={recordings[activePart.id] ?? null}
							onDone={() => onPartDone(activePart.id)}
							onRecorded={(audioUrl) => handleRecorded(activePart.id, audioUrl)}
						/>
					)}
					{activePart.type === "development" && (
						<Part3Content
							part={activePart}
							done={doneParts.has(activePart.id)}
							audioUrl={recordings[activePart.id] ?? null}
							onDone={() => onPartDone(activePart.id)}
							onRecorded={(audioUrl) => handleRecorded(activePart.id, audioUrl)}
						/>
					)}
				</div>
			</div>

			{/* Part tabs + prev/next */}
			{sorted.length > 1 && (
				<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
					{activeIdx > 0 ? (
						<Button size="sm" variant="outline" onClick={handlePrev}>
							<ChevronLeft className="size-4" />
							Part {activeIdx}
						</Button>
					) : (
						<div className="w-24" />
					)}

					<div className="flex items-center gap-1.5">
						{sorted.map((p, i) => {
							const isActive = i === activeIdx
							return (
								<button
									key={p.id}
									type="button"
									onClick={() => setActiveIdx(i)}
									className={cn(
										"flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:bg-muted/80",
									)}
								>
									{doneParts.has(p.id) && <span className="text-emerald-400">✓</span>}
									Part {i + 1}
								</button>
							)
						})}
					</div>

					{activeIdx < sorted.length - 1 ? (
						<Button size="sm" onClick={handleNext}>
							Part {activeIdx + 2}
							<ChevronRight className="size-4" />
						</Button>
					) : (
						<div className="w-24" />
					)}
				</div>
			)}
		</div>
	)
}
