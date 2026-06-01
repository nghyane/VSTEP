import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { SessionProgressBar } from "#/features/practice/components/SessionProgressBar"
import { SkillStepChips } from "#/features/practice/components/SkillStepChips"
import { speakingExerciseQueryOptions } from "#/features/practice/lib/queries-speaking"
import { saveSpeakingResult } from "#/features/practice/lib/result-storage"
import { SPEAKING_LEVEL_LABELS } from "#/mocks/speaking"
import { Button } from "#/shared/ui/button"
import { ShadowingPanel } from "./ShadowingPanel"
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
			<header>
				<p className="text-xs font-bold uppercase tracking-wide text-skill-speaking">
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

			<SessionProgressBar
				current={session.shadowingDone}
				total={session.total}
				accentClass="bg-skill-speaking"
			/>

			<ShadowingPanel exercise={exercise} session={session} />

			<div aria-hidden className="h-24" />
			<div
				data-session-footer
				className="fixed right-0 bottom-0 left-[var(--dock-left)] z-20 border-t border-t-skill-speaking/30 bg-background px-6 py-3"
			>
				<div className="flex items-center gap-4">
					<div className="shrink-0 text-sm text-muted-foreground">
						<span className="font-bold text-foreground">{session.shadowingDone}</span>/{session.total} câu
					</div>
					<div className="min-w-0 flex-1 overflow-x-auto">
						<div className="flex justify-center">
							<SkillStepChips
								total={session.total}
								answered={session.shadowing.map((s) => s.audioUrl !== null)}
								submitted={submitted}
								accentClass="bg-skill-speaking"
							/>
						</div>
					</div>
					<div className="shrink-0">
						{session.phase === "practicing" ? (
							<Button type="button" onClick={handleSubmit} disabled={!session.canSubmit}>
								Nộp bài
							</Button>
						) : (
							<div className="flex gap-2">
								<Button type="button" variant="outline" onClick={session.reset}>
									<RotateCcw className="size-4" /> Làm lại
								</Button>
								<Button asChild>
									<Link to="/luyen-tap/ky-nang" search={{ skill: "noi", category: "", page: 1 }}>
										Về danh sách
									</Link>
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
