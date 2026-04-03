import { ArrowLeft01Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { AudioRecorder } from "@/components/features/assignments/AudioRecorder"
import { MCQAnswerForm } from "@/components/features/assignments/MCQAnswerForm"
import {
	type AssignmentContent,
	isMCQContent,
	parseContent,
} from "@/components/features/assignments/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAssignment, useSubmitAnswer } from "@/hooks/use-classes"

export const Route = createFileRoute("/_learner/classes_/$classId/do/$assignmentId")({
	component: DoAssignmentPage,
})

const SKILL_LABELS: Record<string, string> = {
	listening: "Listening",
	reading: "Reading",
	writing: "Writing",
	speaking: "Speaking",
}

function formatDate(d: string) {
	return new Date(d).toLocaleString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

function DoAssignmentPage() {
	const { classId, assignmentId } = Route.useParams()
	const navigate = useNavigate()
	const { data: assignment, isLoading, isError } = useAssignment(classId, assignmentId)
	const submitAnswer = useSubmitAnswer()

	const [essayAnswer, setEssayAnswer] = useState("")
	const [mcqAnswers, setMcqAnswers] = useState<number[]>([])
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [initialized, setInitialized] = useState(false)

	// Init MCQ answers when data loads
	if (assignment && !initialized) {
		const parsed = parseContent(assignment.content, assignment.skill)
		if (parsed && isMCQContent(parsed)) {
			setMcqAnswers(new Array(parsed.questions.length).fill(-1))
		}
		setInitialized(true)
	}

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl space-y-6">
				<div className="h-8 w-48 animate-pulse rounded bg-muted" />
				<div className="h-64 animate-pulse rounded-2xl bg-muted" />
			</div>
		)
	}

	if (isError || !assignment) {
		return (
			<div className="mx-auto max-w-3xl space-y-4">
				<Button variant="ghost" size="sm" asChild>
					<Link to="/classes/$classId" params={{ classId }}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Quay lại
					</Link>
				</Button>
				<p className="text-sm text-destructive">Không thể tải bài tập. Vui lòng thử lại.</p>
			</div>
		)
	}

	const asg = assignment
	const parsed = parseContent(asg.content, asg.skill) as AssignmentContent | null

	function canSubmit(): boolean {
		if (asg.skill === "writing") return essayAnswer.trim().length > 0
		if (asg.skill === "speaking") return audioBlob !== null
		if (parsed && isMCQContent(parsed)) return mcqAnswers.every((a) => a >= 0)
		return false
	}

	async function handleSubmit() {
		let answerStr = ""

		if (asg.skill === "writing") {
			answerStr = essayAnswer.trim()
		} else if (asg.skill === "speaking" && audioBlob) {
			answerStr = await new Promise<string>((resolve) => {
				const reader = new FileReader()
				reader.onloadend = () => resolve(reader.result as string)
				reader.readAsDataURL(audioBlob)
			})
		} else if (parsed && isMCQContent(parsed)) {
			answerStr = JSON.stringify({ answers: mcqAnswers })
		}

		if (!answerStr) return

		if (asg.dueDate && new Date(asg.dueDate) < new Date()) {
			const lateMs = Date.now() - new Date(asg.dueDate).getTime()
			const lateMins = Math.ceil(lateMs / 60000)
			if (!confirm(`Bài tập đã quá hạn ${lateMins} phút. Bạn vẫn muốn nộp?`)) return
		}

		submitAnswer.mutate(
			{ classId, assignmentId: asg.id, answer: answerStr },
			{
				onSuccess: () => {
					toast.success("Nộp bài thành công!")
					navigate({ to: "/classes/$classId", params: { classId } })
				},
				onError: (err) => {
					toast.error(err instanceof Error ? err.message : "Không thể nộp bài. Vui lòng thử lại.")
				},
			},
		)
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" className="size-8" asChild>
					<Link to="/classes/$classId" params={{ classId }}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-xl font-bold">{asg.title}</h1>
					{asg.description && <p className="text-sm text-muted-foreground">{asg.description}</p>}
				</div>
			</div>

			{/* Meta */}
			<div className="flex flex-wrap items-center gap-2">
				{asg.skill && (
					<Badge variant="secondary" className="capitalize">
						{SKILL_LABELS[asg.skill] ?? asg.skill}
					</Badge>
				)}
				{asg.dueDate && (
					<div className="flex items-center gap-1 text-xs text-muted-foreground">
						<HugeiconsIcon icon={Calendar03Icon} className="size-3" />
						<span>Hạn nộp: {formatDate(asg.dueDate)}</span>
					</div>
				)}
			</div>

			{/* Content + Answer form */}
			{parsed && (
				<div className="space-y-5 rounded-2xl border border-border bg-background p-6">
					{/* MCQ (listening/reading) */}
					{isMCQContent(parsed) && (
						<MCQAnswerForm content={parsed} answers={mcqAnswers} onChange={setMcqAnswers} />
					)}

					{/* Writing */}
					{asg.skill === "writing" && "prompt" in parsed && (
						<>
							<div className="rounded-lg bg-muted/50 p-4">
								<p className="mb-2 text-xs font-medium text-muted-foreground">Đề bài:</p>
								<p className="whitespace-pre-wrap text-sm leading-relaxed">
									{(parsed as { prompt: string }).prompt}
								</p>
							</div>
							<Textarea
								placeholder="Viết bài luận của bạn..."
								value={essayAnswer}
								onChange={(e) => setEssayAnswer(e.target.value)}
								rows={12}
							/>
						</>
					)}

					{/* Speaking */}
					{asg.skill === "speaking" && "prompt" in parsed && (
						<>
							<div className="rounded-lg bg-muted/50 p-4">
								<p className="mb-2 text-xs font-medium text-muted-foreground">Chủ đề:</p>
								<p className="whitespace-pre-wrap text-sm leading-relaxed">
									{(parsed as { prompt: string }).prompt}
								</p>
							</div>
							{(parsed as { audioUrl?: string }).audioUrl && (
								<div className="rounded-lg bg-muted/50 p-4">
									<p className="mb-2 text-xs font-medium text-muted-foreground">Audio mẫu:</p>
									{/* biome-ignore lint/a11y/useMediaCaption: assignment sample audio */}
									<audio
										controls
										className="w-full"
										src={(parsed as { audioUrl: string }).audioUrl}
									/>
								</div>
							)}
							<AudioRecorder onRecorded={setAudioBlob} />
						</>
					)}
				</div>
			)}

			{/* Actions */}
			<div className="flex items-center justify-end gap-3">
				<Button variant="outline" asChild>
					<Link to="/classes/$classId" params={{ classId }}>
						Huỷ
					</Link>
				</Button>
				<Button onClick={handleSubmit} disabled={!canSubmit() || submitAnswer.isPending}>
					{submitAnswer.isPending ? "Đang nộp..." : "Nộp bài"}
				</Button>
			</div>
		</div>
	)
}
