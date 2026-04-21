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

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* ─── Header ─── */}
			<div className="flex items-center justify-between border-b-2 border-border bg-surface px-6 py-4 shrink-0">
				<div className="flex items-center gap-4">
					<Link to="/luyen-tap/nghe" className="p-1.5 hover:opacity-70">
						<Icon name="close" size="sm" className="text-muted" />
					</Link>
					<div>
						<h2 className="font-extrabold text-base text-foreground">Hỏi đường đến bưu điện</h2>
						<p className="text-xs text-subtle">Part 1 · 3 câu · ~5 phút</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold text-foreground">{answeredCount}</span>
					<span className="text-sm text-subtle">/ {MOCK_QUESTIONS.length}</span>
				</div>
			</div>

			{/* ─── Progress ─── */}
			<div className="h-2 bg-border shrink-0">
				<div className="h-full bg-skill-listening rounded-r-full transition-all" style={{ width: `${(answeredCount / MOCK_QUESTIONS.length) * 100}%` }} />
			</div>

			{/* ─── Questions (scroll) ─── */}
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
					{MOCK_QUESTIONS.map((q, qi) => {
						const selected = answers[q.id]
						const correct = correctMap[q.id]
						const isWrong = submitted && selected !== undefined && selected !== correct

						return (
							<div key={q.id} id={`q-${qi}`}>
								<p className="font-bold text-base text-foreground mb-4">
									<span className="text-skill-listening mr-2">{qi + 1}.</span>
									{q.question}
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
												className={cn(
													"flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-b-4 text-left transition",
													"active:translate-y-[2px] active:border-b-2",
													optClass,
												)}
											>
												<span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition", badgeClass)}>
													{letter}
												</span>
												<span className="text-sm font-bold text-foreground">{opt}</span>
											</button>
										)
									})}
								</div>

								{/* Explanation after submit */}
								{submitted && isWrong && (
									<div className="mt-3 rounded-xl border-2 border-destructive/20 bg-destructive-tint px-4 py-3">
										<p className="text-xs font-bold text-destructive uppercase tracking-wide mb-1">Giải thích</p>
										<p className="text-sm text-foreground">Đáp án đúng là {String.fromCharCode(65 + correct)}. Bưu điện nằm ở cuối đường, rẽ phải tại ngã tư.</p>
									</div>
								)}
							</div>
						)
					})}

					{/* Celebration */}
					{submitted && (
						<div className="card p-8 text-center">
							<img src="/mascot/lac-happy.png" alt="" className="w-24 h-24 mx-auto mb-4 object-contain" />
							<p className="font-extrabold text-3xl text-foreground">
								{Object.entries(answers).filter(([id, a]) => a === correctMap[id]).length}/{MOCK_QUESTIONS.length}
							</p>
							<p className="text-sm text-muted mt-1">câu đúng</p>
							<div className="flex justify-center gap-3 mt-6">
								<button type="button" onClick={() => { setAnswers({}); setSubmitted(false) }} className="btn btn-secondary text-primary px-6 py-2.5">
									Làm lại
								</button>
								<Link to="/luyen-tap/nghe" className="btn btn-primary px-6 py-2.5">
									Về danh sách
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* ─── Sticky bottom ─── */}
			<div className="shrink-0">
				{/* Subtitle panel */}
				{showSub && (
					<div className="bg-surface border-t-2 border-border px-6 py-4 max-h-32 overflow-y-auto">
						<p className="text-sm text-foreground leading-relaxed">
							<span className="bg-info-tint text-skill-listening font-bold px-0.5 rounded">Excuse</span>{" "}
							<span className="bg-info-tint text-skill-listening font-bold px-0.5 rounded">me,</span>{" "}
							can you tell me how to get to the{" "}
							<span className="font-bold text-foreground">post office</span>? I need to send a package.
							Sure, go straight for about{" "}
							<span className="font-bold text-foreground">10 minutes</span>, then turn right at the traffic light.
						</p>
					</div>
				)}

				{/* Audio bar */}
				<div className="bg-surface border-t-2 border-border px-5 py-3">
					<div className="flex items-center gap-4">
						<button type="button" className="w-12 h-12 rounded-full bg-skill-listening text-primary-foreground flex items-center justify-center shadow-[0_4px_0_oklch(0.45_0.15_240)] active:shadow-[0_2px_0_oklch(0.45_0.15_240)] active:translate-y-[2px] transition">
							<Icon name="volume" size="sm" />
						</button>
						<button type="button" className="w-8 h-8 rounded-full border-2 border-border border-b-4 flex items-center justify-center text-muted hover:text-foreground active:translate-y-[2px] active:border-b-2 transition" aria-label="Nghe lại">
							<Icon name="back" size="xs" />
						</button>
						<span className="text-sm font-bold text-skill-listening tabular-nums">0:00</span>
						<div className="flex-1 h-3 bg-background rounded-full relative border-2 border-border">
							<div className="absolute inset-y-0 left-0 bg-skill-listening rounded-full w-0" />
						</div>
						<span className="text-sm text-muted tabular-nums">3:45</span>
						<button
							type="button"
							onClick={() => setShowSub((v) => !v)}
							className={cn("w-8 h-8 rounded-full border-2 border-b-4 flex items-center justify-center text-xs font-bold transition active:translate-y-[2px] active:border-b-2", showSub ? "border-skill-listening bg-info-tint text-skill-listening" : "border-border text-muted")}
							aria-label="Bật/tắt phụ đề"
						>
							CC
						</button>
					</div>
				</div>

				{/* Question nav */}
				<div className="flex justify-center gap-2 border-t-2 border-border bg-surface px-4 py-3">
					{MOCK_QUESTIONS.map((q, qi) => {
						const isAnswered = answers[q.id] !== undefined
						const isCorrect = submitted && answers[q.id] === correctMap[q.id]
						const isWrong = submitted && answers[q.id] !== undefined && answers[q.id] !== correctMap[q.id]

						let style = "border-border bg-surface text-muted"
						if (isCorrect) style = "border-primary bg-primary-tint text-primary"
						else if (isWrong) style = "border-destructive bg-destructive-tint text-destructive"
						else if (isAnswered) style = "border-skill-listening bg-skill-listening text-primary-foreground"

						return (
							<a key={q.id} href={`#q-${qi}`} className={cn("w-10 h-10 rounded-xl border-2 border-b-4 flex items-center justify-center text-sm font-bold transition", style)}>
								{qi + 1}
							</a>
						)
					})}
				</div>

				{/* Submit */}
				{!submitted && (
					<div className="bg-surface px-6 py-3">
						<button
							type="button"
							onClick={() => setSubmitted(true)}
							disabled={answeredCount < MOCK_QUESTIONS.length}
							className="btn btn-primary w-full py-4 text-base disabled:opacity-50"
						>
							NỘP BÀI ({answeredCount}/{MOCK_QUESTIONS.length})
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
