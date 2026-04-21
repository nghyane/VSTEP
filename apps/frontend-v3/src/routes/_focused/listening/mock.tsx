import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Icon } from "#/components/Icon"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_focused/listening/mock")({
	component: ListeningMock,
})

const MOCK_QUESTIONS = [
	{ id: "1", question: "Where does the person want to go?", options: ["The bank", "The post office", "The hospital", "The school"] },
	{ id: "2", question: "How far is it?", options: ["10 minutes", "5 minutes", "15 minutes", "20 minutes"] },
	{ id: "3", question: "What should the person do at the traffic light?", options: ["Turn left", "Turn right", "Go straight", "Make a U-turn"] },
]

function ListeningMock() {
	const [answers, setAnswers] = useState<Record<string, number>>({})
	const [submitted, setSubmitted] = useState(false)
	const [showSub, setShowSub] = useState(false)
	const correctMap: Record<string, number> = { "1": 1, "2": 0, "3": 2 }
	const answeredCount = Object.keys(answers).length
	const score = Object.entries(answers).filter(([id, a]) => a === correctMap[id]).length

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* ─── Header ─── */}
			<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-2.5 shrink-0">
				<Link to="/luyen-tap/nghe" className="p-1 hover:opacity-70 shrink-0">
					<Icon name="close" size="xs" className="text-muted" />
				</Link>
				<div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
					<div className="h-full bg-skill-listening rounded-full transition-all" style={{ width: `${(answeredCount / MOCK_QUESTIONS.length) * 100}%` }} />
				</div>
				<span className="text-xs font-bold text-muted shrink-0">{answeredCount}/{MOCK_QUESTIONS.length}</span>
			</div>

			{/* ─── Subtitle (sticky khi CC bật) ─── */}
			{showSub && (
				<div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-2.5 shrink-0">
					<p className="text-sm text-foreground leading-relaxed max-w-3xl mx-auto">
						<span className="bg-info-tint text-skill-listening font-bold px-0.5 rounded">Excuse me,</span>{" "}
						can you tell me how to get to the <strong>post office</strong>? Sure, go straight for about <strong>10 minutes</strong>, then turn right at the traffic light.
					</p>
				</div>
			)}

			{/* ─── Scrollable content ─── */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

					{/* Audio player */}
					<div className="card p-4">
						<p className="text-xs font-bold text-skill-listening uppercase tracking-wide mb-3">Part 1 · Nghe hiểu ngắn</p>
						<h2 className="font-bold text-lg text-foreground mb-1">Hỏi đường đến bưu điện</h2>
						<p className="text-sm text-muted mb-4">Nghe đoạn hội thoại và trả lời câu hỏi</p>

						{/* Play controls */}
						<div className="flex items-center gap-3">
							<button type="button" className="w-10 h-10 rounded-full bg-skill-listening text-primary-foreground flex items-center justify-center shadow-[0_3px_0_oklch(0.45_0.15_240)] active:shadow-[0_1px_0_oklch(0.45_0.15_240)] active:translate-y-[2px] transition shrink-0">
								<Icon name="volume" size="xs" />
							</button>
							<div className="flex-1 h-2 bg-background rounded-full relative border border-border">
								<div className="absolute inset-y-0 left-0 bg-skill-listening rounded-full w-0" />
							</div>
							<span className="text-xs text-muted tabular-nums">3:45</span>
							<button type="button" className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-muted hover:text-foreground transition shrink-0" aria-label="Nghe lại">
								<Icon name="back" size="xs" />
							</button>
							<button
								type="button"
								onClick={() => setShowSub((v) => !v)}
								className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition shrink-0", showSub ? "border-skill-listening bg-info-tint text-skill-listening" : "border-border text-muted")}
							>
								CC
							</button>
						</div>
					</div>

					{/* Celebration (if submitted) */}
					{submitted && (
						<div className="card p-6 text-center">
							<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto mb-3 object-contain" />
							<p className="font-extrabold text-2xl text-foreground">{score}/{MOCK_QUESTIONS.length}</p>
							<p className="text-sm text-muted mt-1">câu đúng</p>
							<div className="flex justify-center gap-3 mt-4">
								<button type="button" onClick={() => { setAnswers({}); setSubmitted(false) }} className="btn btn-secondary text-primary px-5 py-2">Làm lại</button>
								<Link to="/luyen-tap/nghe" className="btn btn-primary px-5 py-2">Về danh sách</Link>
							</div>
						</div>
					)}

					{/* Questions */}
					{MOCK_QUESTIONS.map((q, qi) => {
						const selected = answers[q.id]
						const correct = correctMap[q.id]
						const isWrong = submitted && selected !== undefined && selected !== correct

						return (
							<div key={q.id} id={`q-${qi}`}>
								<p className="text-sm font-medium text-foreground mb-3">
									<span className="text-skill-listening font-bold mr-1.5">{qi + 1}.</span>
									{q.question}
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{q.options.map((opt, oi) => {
										const letter = String.fromCharCode(65 + oi)
										const isSelected = oi === selected
										const isCorrect = submitted && oi === correct
										const isWrongSelected = submitted && isSelected && oi !== correct

										let optClass = "border-border hover:border-skill-listening/40"
										let badgeClass = "bg-background text-muted"

										if (isCorrect) {
											optClass = "border-primary border-b-primary-dark bg-primary-tint"
											badgeClass = "bg-primary text-primary-foreground"
										} else if (isWrongSelected) {
											optClass = "border-destructive border-b-destructive bg-destructive-tint"
											badgeClass = "bg-destructive text-primary-foreground"
										} else if (isSelected && !submitted) {
											optClass = "border-skill-listening border-b-skill-listening bg-info-tint"
											badgeClass = "bg-skill-listening text-primary-foreground"
										}

										return (
											<button
												key={opt}
												type="button"
												disabled={submitted}
												onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
												className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-b-4 text-left text-sm font-medium transition active:translate-y-[2px] active:border-b-2", optClass)}
											>
												<span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", badgeClass)}>{letter}</span>
												<span>{opt}</span>
											</button>
										)
									})}
								</div>
								{submitted && isWrong && (
									<div className="mt-2 rounded-lg border border-destructive/20 bg-destructive-tint px-3 py-2">
										<p className="text-xs font-bold text-destructive mb-0.5">Giải thích</p>
										<p className="text-sm text-foreground">Đáp án đúng là {String.fromCharCode(65 + correct)}.</p>
									</div>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* ─── Footer (sticky) ─── */}
			<div className="flex items-center gap-2 border-t-2 border-border bg-surface px-4 py-2.5 shrink-0">
				{MOCK_QUESTIONS.map((q, qi) => {
					const isAnswered = answers[q.id] !== undefined
					const isCorrect = submitted && answers[q.id] === correctMap[q.id]
					const isWrong = submitted && isAnswered && answers[q.id] !== correctMap[q.id]

					let style = "border-border bg-surface text-muted"
					if (isCorrect) style = "border-primary bg-primary-tint text-primary"
					else if (isWrong) style = "border-destructive bg-destructive-tint text-destructive"
					else if (isAnswered) style = "border-skill-listening bg-skill-listening text-primary-foreground"

					return (
						<a key={q.id} href={`#q-${qi}`} className={cn("w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition shrink-0", style)}>{qi + 1}</a>
					)
				})}
				<div className="flex-1" />
				{!submitted ? (
					<button type="button" onClick={() => setSubmitted(true)} disabled={answeredCount < MOCK_QUESTIONS.length} className="btn btn-primary py-2 px-6 text-sm disabled:opacity-50">
						Nộp bài
					</button>
				) : (
					<Link to="/luyen-tap/nghe" className="btn btn-primary py-2 px-6 text-sm">Xong</Link>
				)}
			</div>
		</div>
	)
}
