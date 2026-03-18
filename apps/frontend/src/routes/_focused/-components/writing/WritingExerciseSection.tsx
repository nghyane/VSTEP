import type { WritingExam } from "@/routes/_learner/practice/-components/mock-data"
import {
	WritingAnnotatedPanel,
	WritingAnswerDetail,
} from "@/routes/_focused/-components/writing/WritingAnswerDetail"
import { WritingLevel1Layout } from "@/routes/_focused/-components/writing/WritingLevel1Layout"
import { WritingLevel2Layout } from "@/routes/_focused/-components/writing/WritingLevel2Layout"
import { WritingTemplateEditor } from "@/routes/_focused/-components/writing/WritingTemplateEditor"

export function WritingExerciseSection({
	exam,
	examId,
	writingTexts,
	setWritingTexts,
	submitted,
}: {
	exam: WritingExam
	examId: string
	writingTexts: Record<number, string>
	setWritingTexts: React.Dispatch<React.SetStateAction<Record<number, string>>>
	submitted: boolean
}) {
	const level = exam.level ?? 3

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{!submitted ? (
				level === 1 ? (
					<WritingLevel1Layout tasks={exam.tasks}>
						<WritingTemplateEditor examId={examId} />
					</WritingLevel1Layout>
				) : level === 2 ? (
					<WritingLevel2Layout
						tasks={exam.tasks}
						examId={examId}
						writingTexts={writingTexts}
						setWritingTexts={setWritingTexts}
					/>
				) : (
					<div className="flex-1 overflow-y-auto">
						<div className="mx-auto max-w-3xl space-y-6 p-6">
							<div className="space-y-6">
								{exam.tasks.map((task) => {
									const text = writingTexts[task.taskNumber] ?? ""
									const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
									return (
										<div key={task.taskNumber} className="space-y-4">
											{task.title && (
												<h3 className="text-sm font-semibold">{task.title}</h3>
											)}
											<div
												className="rounded-xl bg-muted/10 p-4 text-sm leading-relaxed"
												style={{ whiteSpace: "pre-wrap" }}
											>
												{task.prompt}
											</div>
											{task.instructions && (
												<p className="text-sm text-muted-foreground">{task.instructions}</p>
											)}
											<textarea
												className="min-h-[250px] w-full rounded-xl border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
												placeholder="Nhập bài viết của bạn..."
												value={text}
												onChange={(ev) =>
													setWritingTexts((prev) => ({
														...prev,
														[task.taskNumber]: ev.target.value,
													}))
												}
											/>
											<p className="text-sm text-muted-foreground">
												{wordCount}/{task.wordLimit} từ
												{wordCount < task.wordLimit && (
													<span className="ml-1 text-orange-500">
														(cần tối thiểu {task.wordLimit} từ)
													</span>
												)}
											</p>
										</div>
									)
								})}
							</div>
						</div>
					</div>
				)
			) : (
				<div className="flex flex-1 overflow-hidden">
					{/* Left — Annotated submitted text */}
					<div className="w-1/2 overflow-y-auto border-r">
						<WritingAnnotatedPanel examId={examId} level={level} />
					</div>
					{/* Right — Grading detail */}
					<div className="flex flex-1 flex-col overflow-hidden">
						<WritingAnswerDetail examId={examId} level={level} />
					</div>
				</div>
			)}
		</div>
	)
}
