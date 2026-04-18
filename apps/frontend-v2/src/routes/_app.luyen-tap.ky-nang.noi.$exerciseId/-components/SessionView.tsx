import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { speakingExerciseQueryOptions } from "#/features/practice/lib/queries-speaking"
import { saveSpeakingResult } from "#/features/practice/lib/result-storage"
import { SPEAKING_LEVEL_LABELS, type SpeakingExercise } from "#/mocks/speaking"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { useSpeakingSession } from "./useSpeakingSession"

export function SessionView({ exerciseId }: { exerciseId: string }) {
	const { data: exercise } = useSuspenseQuery(speakingExerciseQueryOptions(exerciseId))
	const session = useSpeakingSession(exercise)
	const navigate = useNavigate()
	const submitted = session.phase === "submitted"

	const handleSubmit = () => {
		session.saveSnapshot()
		saveSpeakingResult({
			exerciseId,
			mode: "shadowing",
			dictationAccuracy: 0,
			sentencesDone: session.shadowingDone,
			sentencesTotal: exercise.sentences.length,
			submittedAt: Date.now(),
		})
		toast.success("Đã nộp bài")
		void navigate({ to: "/luyen-tap/ky-nang/noi/$exerciseId/ket-qua", params: { exerciseId } })
	}

	return (
		<div className="mt-4 space-y-6">
			<Header exercise={exercise} />
			<ShadowingPanel exercise={exercise} session={session} />
			<div aria-hidden className="h-24" />
			<div
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 border-t bg-background px-6 py-3"
			>
				<div className="flex items-center gap-4">
					<div className="shrink-0">
						<SpeakingStatusText
							phase={session.phase}
							done={session.shadowingDone}
							total={session.total}
						/>
					</div>
					<div className="min-w-0 flex-1 overflow-x-auto">
						<div className="flex justify-center">
							<SpeakingNavBar
								total={session.total}
								markers={session.shadowing.map((s) => s.audioUrl !== null)}
								submitted={submitted}
								onChange={session.setCurrentIndex}
							/>
						</div>
					</div>
					<div className="shrink-0">
						<SpeakingSubmitAction
							phase={session.phase}
							canSubmit={session.canSubmit}
							onSubmit={handleSubmit}
							onReset={session.reset}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

// ─── Header ────────────────────────────────────────────────────────

function Header({ exercise }: { exercise: SpeakingExercise }) {
	return (
		<header>
			<p className="text-xs font-semibold uppercase tracking-wide text-skill-speaking">
				{SPEAKING_LEVEL_LABELS[exercise.level]}
			</p>
			<div className="mt-1 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">{exercise.title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{exercise.description}</p>
				</div>
				<p className="shrink-0 text-sm text-muted-foreground">
					{exercise.sentences.length} câu · {exercise.estimatedMinutes} phút
				</p>
			</div>
		</header>
	)
}

// ─── Footer: Status text ───────────────────────────────────────────

function SpeakingStatusText({
	phase,
	done,
	total,
}: {
	phase: "practicing" | "submitted"
	done: number
	total: number
}) {
	if (phase === "submitted") {
		return (
			<p className="text-sm text-muted-foreground">
				Kết quả:{" "}
				<strong className="text-foreground">
					{done}/{total}
				</strong>{" "}
				câu đã ghi âm
			</p>
		)
	}
	return (
		<p className="text-sm text-muted-foreground">
			Đã ghi âm{" "}
			<strong className="text-foreground">
				{done}/{total}
			</strong>{" "}
			câu
		</p>
	)
}

// ─── Footer: Nav pills ────────────────────────────────────────────

function SpeakingNavBar({
	total,
	markers,
	submitted,
	onChange,
}: {
	total: number
	markers: readonly boolean[]
	submitted: boolean
	onChange: (i: number) => void
}) {
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{Array.from({ length: total }, (_, i) => {
				const done = markers[i]
				let pillClass = "border-border bg-background text-muted-foreground hover:bg-accent"
				if (submitted) {
					pillClass = done
						? "border-success bg-success/10 text-success"
						: "border-destructive bg-destructive/10 text-destructive"
				} else if (done) {
					pillClass = "border-primary bg-primary text-primary-foreground"
				}
				return (
					<button
						key={i}
						type="button"
						onClick={() => onChange(i)}
						className={cn(
							"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
							pillClass,
						)}
						aria-label={`Câu ${i + 1}`}
					>
						{i + 1}
					</button>
				)
			})}
		</div>
	)
}

// ─── Footer: Submit action ─────────────────────────────────────────

function SpeakingSubmitAction({
	phase,
	canSubmit,
	onSubmit,
	onReset,
}: {
	phase: "practicing" | "submitted"
	canSubmit: boolean
	onSubmit: () => void
	onReset: () => void
}) {
	if (phase === "practicing") {
		return (
			<Button
				type="button"
				size="lg"
				className="rounded-xl px-8"
				onClick={onSubmit}
				disabled={!canSubmit}
			>
				Nộp bài
			</Button>
		)
	}
	return (
		<div className="flex gap-2">
			<Button type="button" variant="outline" onClick={onReset}>
				<RotateCcw className="size-4" />
				Làm lại
			</Button>
			<Button asChild>
				<Link to="/luyen-tap/ky-nang" search={{ skill: "noi", category: "", page: 1 }}>
					Về danh sách đề nói
				</Link>
			</Button>
		</div>
	)
}

import { ShadowingPanel } from "./ShadowingPanel"
