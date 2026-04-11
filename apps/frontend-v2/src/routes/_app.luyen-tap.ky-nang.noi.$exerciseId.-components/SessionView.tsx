import { useSuspenseQuery } from "@tanstack/react-query"
import { Mic } from "lucide-react"
import { SupportModeSwitch } from "#/components/common/SupportModeSwitch"
import { Button } from "#/components/ui/button"
import { SPEAKING_PART_LABELS, type SpeakingExercise } from "#/lib/mock/speaking"
import { useSupportMode } from "#/lib/practice/use-support-mode"
import { speakingExerciseQueryOptions } from "#/lib/queries/speaking"
import { DoneView } from "./DoneView"
import { RecordPanel } from "./RecordPanel"
import { SpeakingSupportPanel } from "./SpeakingSupportPanel"
import { useSpeakingSession } from "./useSpeakingSession"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const { data: exercise } = useSuspenseQuery(speakingExerciseQueryOptions(exerciseId))
	const session = useSpeakingSession(exercise)
	const supportMode = useSupportMode()

	return (
		<div className="mt-4 space-y-6 pb-2">
			<SessionHeader exercise={exercise} />

			<PromptCard prompt={exercise.prompt} />

			{supportMode && session.phase !== "done" && (
				<SpeakingSupportPanel talkingPoints={exercise.talkingPoints} />
			)}

			<PhaseBody exercise={exercise} session={session} />
		</div>
	)
}

function SessionHeader({ exercise }: { exercise: SpeakingExercise }) {
	return (
		<header>
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-skill-speaking">
					{SPEAKING_PART_LABELS[exercise.part]}
				</p>
				<SupportModeSwitch />
			</div>
			<div className="mt-1 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">{exercise.title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{exercise.description}</p>
				</div>
				<p className="shrink-0 text-sm text-muted-foreground">
					{exercise.prepSeconds}s chuẩn bị · {exercise.speakSeconds}s nói
				</p>
			</div>
		</header>
	)
}

function PromptCard({ prompt }: { prompt: string }) {
	return (
		<div className="rounded-2xl border bg-muted/30 p-5">
			<h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Đề bài
			</h2>
			<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{prompt}</p>
		</div>
	)
}

// ─── Phase branches ────────────────────────────────────────────────

function PhaseBody({
	exercise,
	session,
}: {
	exercise: SpeakingExercise
	session: ReturnType<typeof useSpeakingSession>
}) {
	if (session.phase === "ready") return <ReadyPanel onStart={session.startPrep} />
	if (session.phase === "prep") {
		return <PrepPanel remainingSec={session.prepRemainingSec} onSkip={session.skipToSpeaking} />
	}
	if (session.phase === "speaking") {
		return (
			<RecordPanel
				recorder={session.recorder}
				maxSeconds={exercise.speakSeconds}
				onStop={session.finish}
			/>
		)
	}
	return (
		<DoneView
			exercise={exercise}
			userAudioUrl={session.recorder.audioUrl}
			recordedSeconds={Math.round(session.recorder.elapsedMs / 1000)}
			onReset={session.reset}
		/>
	)
}

function ReadyPanel({ onStart }: { onStart: () => void }) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center shadow-sm">
			<Mic className="size-12 text-skill-speaking" />
			<p className="text-base font-semibold">Sẵn sàng luyện nói?</p>
			<p className="max-w-md text-sm text-muted-foreground">
				Bấm bắt đầu để vào phần chuẩn bị. Sau khi hết giờ chuẩn bị, mic sẽ tự bật để bạn nói.
			</p>
			<Button type="button" size="lg" className="rounded-xl px-8" onClick={onStart}>
				Bắt đầu chuẩn bị
			</Button>
		</div>
	)
}

function PrepPanel({ remainingSec, onSkip }: { remainingSec: number; onSkip: () => void }) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center shadow-sm">
			<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Thời gian chuẩn bị
			</p>
			<p className="text-6xl font-bold tabular-nums text-skill-speaking">
				{formatTime(remainingSec)}
			</p>
			<p className="max-w-md text-sm text-muted-foreground">
				Ghi chú nhanh các ý chính bạn sẽ nói. Hết giờ, micro sẽ tự động bật.
			</p>
			<Button type="button" variant="outline" onClick={onSkip}>
				Bỏ qua, bắt đầu nói ngay
			</Button>
		</div>
	)
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${String(s).padStart(2, "0")}`
}
