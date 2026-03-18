import {
	BulbIcon,
	Gps01Icon,
	TextIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useExplain, useParaphrase } from "@/hooks/use-ai"
import { useUploadAudio } from "@/hooks/use-uploads"
import { cn } from "@/lib/utils"
import type { SpeakingExam } from "@/routes/_learner/practice/-components/mock-data"
import { type AnyExam, type getAllQuestions, getExamText } from "@/routes/_focused/-components/shared/exercise-shared"
import { SpeakingFeedback } from "@/routes/_focused/-components/speaking/SpeakingFeedback"
import type { Skill } from "@/types/api"

export function SpeakingExerciseSection({
	exam,
	submitted,
	parentExam,
	parentSkill,
	typedSkill,
	questions,
	selectedAnswers,
}: {
	exam: SpeakingExam
	submitted: boolean
	parentExam: AnyExam
	parentSkill: string
	typedSkill: Skill
	questions: ReturnType<typeof getAllQuestions>
	selectedAnswers: Record<number, string>
}) {
	const resultsRef = useRef<HTMLDivElement>(null)
	const [activeAiTool, setActiveAiTool] = useState<"paraphrase" | "explain" | null>(null)
	const paraphrase = useParaphrase()
	const explain = useExplain()
	const uploadAudio = useUploadAudio()
	const [audioFile, setAudioFile] = useState<File | null>(null)
	const [audioUrl, setAudioUrl] = useState<string | null>(null)

	return (
		<div className="flex flex-1 overflow-hidden">
			{/* Left — exercise */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					<div className="space-y-6">
						{exam.parts.map((part) => (
							<div key={part.partNumber} className="space-y-3">
								{part.title && <h3 className="text-sm font-semibold">{part.title}</h3>}
								<div
									className="rounded-xl bg-muted/10 p-4 text-sm leading-relaxed"
									style={{ whiteSpace: "pre-wrap" }}
								>
									{part.instructions}
								</div>
								<p className="text-sm text-muted-foreground">
									Thời gian nói: {part.speakingTime} phút
								</p>
								<div className="space-y-3">
									<input
										type="file"
										accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm,audio/ogg"
										className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
										onChange={(ev) => {
											const file = ev.target.files?.[0]
											if (file) {
												setAudioFile(file)
												setAudioUrl(URL.createObjectURL(file))
											}
										}}
										disabled={submitted}
									/>
									{audioUrl && (
										<audio controls src={audioUrl} className="w-full rounded-lg">
											<track kind="captions" />
										</audio>
									)}
									{audioFile && !submitted && (
										<Button
											size="sm"
											variant="outline"
											className="w-full"
											disabled={uploadAudio.isPending}
											onClick={() => uploadAudio.mutate(audioFile)}
										>
											{uploadAudio.isPending ? "Đang tải lên..." : "Tải lên"}
										</Button>
									)}
									{uploadAudio.isSuccess && (
										<p className="text-xs text-green-600">Đã tải lên thành công</p>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Right — AI tools sidebar (after submit) */}
			{submitted && (
				<aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l lg:block">
					<div ref={resultsRef} className="space-y-4 p-5">
						<SpeakingFeedback />

						{/* AI tools */}
						<div className="space-y-3">
							<p className="text-sm font-semibold">Công cụ AI</p>

							{/* Paraphrasing */}
							<div
								className={cn(
									"rounded-xl p-4 transition-colors",
									activeAiTool === "paraphrase"
										? "bg-sky-500/10 ring-1 ring-sky-500/30"
										: "bg-muted/30",
								)}
							>
								<div className="flex items-start gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
										<HugeiconsIcon icon={TextIcon} className="size-4" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold">Paraphrasing</p>
										<p className="mt-0.5 text-xs text-muted-foreground">
											Tô sáng các cụm từ có thể diễn đạt lại trong bài.
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant={activeAiTool === "paraphrase" ? "default" : "outline"}
									className="mt-3 w-full gap-1.5 rounded-lg text-xs"
									disabled={paraphrase.isPending}
									onClick={() => {
										if (activeAiTool === "paraphrase") {
											setActiveAiTool(null)
											return
										}
										setActiveAiTool("paraphrase")
										const text = getExamText(parentExam, parentSkill)
										if (text) {
											paraphrase.mutate({ text, skill: typedSkill })
										}
									}}
								>
									<HugeiconsIcon icon={Gps01Icon} className="size-3.5" />
									{paraphrase.isPending
										? "Đang phân tích..."
										: activeAiTool === "paraphrase"
											? "Ẩn"
											: "Phân tích"}
								</Button>
							</div>

							{/* Giải thích chi tiết */}
							<div
								className={cn(
									"rounded-xl p-4 transition-colors",
									activeAiTool === "explain"
										? "bg-amber-500/10 ring-1 ring-amber-500/30"
										: "bg-muted/30",
								)}
							>
								<div className="flex items-start gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
										<HugeiconsIcon icon={BulbIcon} className="size-4" />
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold">Giải thích chi tiết</p>
										<p className="mt-0.5 text-xs text-muted-foreground">
											Tô sáng ngữ pháp, từ vựng và chiến lược làm bài.
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant={activeAiTool === "explain" ? "default" : "outline"}
									className="mt-3 w-full gap-1.5 rounded-lg text-xs"
									disabled={explain.isPending}
									onClick={() => {
										if (activeAiTool === "explain") {
											setActiveAiTool(null)
											return
										}
										setActiveAiTool("explain")
										const text = getExamText(parentExam, parentSkill)
										if (text) {
											explain.mutate({
												text,
												skill: typedSkill,
												answers: Object.fromEntries(
													Object.entries(selectedAnswers).map(([k, v]) => [String(k), v]),
												),
												correctAnswers: Object.fromEntries(
													questions.map((q) => [String(q.questionNumber), q.correctAnswer]),
												),
											})
										}
									}}
								>
									<HugeiconsIcon icon={Gps01Icon} className="size-3.5" />
									{explain.isPending
										? "Đang phân tích..."
										: activeAiTool === "explain"
											? "Ẩn"
											: "Phân tích"}
								</Button>
							</div>
						</div>

						{/* AI Results */}
						{paraphrase.data && activeAiTool === "paraphrase" && (
							<div className="space-y-2 rounded-xl bg-sky-50/50 p-4 dark:bg-sky-950/10">
								<p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
									Gợi ý paraphrase
								</p>
								{paraphrase.data.highlights.map((h, i) => (
									<div key={i} className="space-y-0.5 text-sm">
										<p className="font-medium">{h.phrase}</p>
										<p className="text-xs text-muted-foreground">{h.note}</p>
									</div>
								))}
							</div>
						)}

						{explain.data && activeAiTool === "explain" && (
							<div className="space-y-2 rounded-xl bg-amber-50/50 p-4 dark:bg-amber-950/10">
								<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
									Giải thích chi tiết
								</p>
								{explain.data.highlights.map((h, i) => (
									<div key={i} className="space-y-0.5 text-sm">
										<p className="font-medium">
											<span className="mr-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px]">
												{h.category}
											</span>
											{h.phrase}
										</p>
										<p className="text-xs text-muted-foreground">{h.note}</p>
									</div>
								))}
								{explain.data.questionExplanations?.map((qe) => (
									<div key={qe.questionNumber} className="space-y-0.5 border-t pt-2 text-sm">
										<p className="font-medium">
											Câu {qe.questionNumber}: {qe.correctAnswer}
										</p>
										<p className="text-xs text-muted-foreground">{qe.explanation}</p>
									</div>
								))}
							</div>
						)}

						{(paraphrase.isPending || explain.isPending) && (
							<div className="flex items-center justify-center py-4">
								<p className="text-sm text-muted-foreground">Đang phân tích...</p>
							</div>
						)}
					</div>
				</aside>
			)}
		</div>
	)
}
