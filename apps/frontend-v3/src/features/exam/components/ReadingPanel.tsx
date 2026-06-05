import { useCallback, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { ExamRoomProgressTabs, ExamRoomQuestionNav } from "#/features/exam/components/ExamRoomChrome"
import { ExamRoomFooter, type ExamRoomFooterAction } from "#/features/exam/components/ExamRoomFooter"
import { HighlightablePassage, PassageSpeechControl } from "#/features/exam/components/HighlightablePassage"
import { MCQQuestion } from "#/features/exam/components/MCQQuestion"
import type { ExamVersionReadingPassage } from "#/features/exam/types"
import { TTSVoicePicker } from "#/features/practice/components/TTSVoicePicker"
import { pickBoundaryEnglishVoice, stopSpeaking } from "#/lib/utils"

interface Props {
	passages: ExamVersionReadingPassage[]
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
	footer: ExamRoomFooterAction
}

export function ReadingPanel({ passages, mcqAnswers, onAnswer, footer }: Props) {
	const sorted = useMemo(() => [...passages].sort((a, b) => a.display_order - b.display_order), [passages])

	const [activeIdx, setActiveIdx] = useState(0)
	const [activeCharIndex, setActiveCharIndex] = useState<number | null>(null)
	const [voice, setVoice] = useState<SpeechSynthesisVoice | undefined>(() => pickBoundaryEnglishVoice())

	const activePassage = sorted[activeIdx]

	const passagesMeta = useMemo(
		() =>
			sorted.map((p) => {
				const answered = p.items.filter((it) => mcqAnswers.has(it.id)).length
				return { part: p.part, total: p.items.length, answered }
			}),
		[sorted, mcqAnswers],
	)

	const handleNext = useCallback(() => {
		setActiveIdx((i) => Math.min(i + 1, sorted.length - 1))
	}, [sorted.length])
	const handleTab = useCallback((index: number) => {
		setActiveIdx(index)
	}, [])
	const handleVoiceChange = useCallback((nextVoice: SpeechSynthesisVoice) => {
		stopSpeaking()
		setActiveCharIndex(null)
		setVoice(nextVoice)
	}, [])

	const handleJump = useCallback((itemIndex: number) => {
		document
			.getElementById(`reading-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	if (!activePassage) return null

	const activeMeta = passagesMeta[activeIdx]
	const activeUnanswered = Math.max(0, (activeMeta?.total ?? 0) - (activeMeta?.answered ?? 0))
	const hasNextPassage = activeIdx < sorted.length - 1
	const activeFooter = hasNextPassage
		? {
				...footer,
				isLastSkill: false,
				nextTone: "secondary" as const,
				statusText:
					activeUnanswered > 0
						? `Còn ${activeUnanswered} câu chưa trả lời ở đoạn ${activeIdx + 1}`
						: `Đoạn ${activeIdx + 1} đã trả lời đủ`,
				nextLabel: `Tiếp: Đoạn ${activeIdx + 2}`,
				onNext: handleNext,
			}
		: footer

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<div className="flex shrink-0 justify-end border-b border-border bg-surface px-5 py-3">
				<TTSVoicePicker
					voice={voice}
					onVoiceChange={handleVoiceChange}
					accentClassName="border-skill-reading text-skill-reading"
				/>
			</div>
			{/* Split layout: passage left | questions right */}
			<div className="flex flex-1 overflow-hidden">
				{/* Passage */}
				<ScrollArea className="w-1/2 border-r border-border">
					<div className="space-y-4 bg-background px-7 py-6">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<span className="rounded-full border-2 border-b-4 border-skill-reading/30 bg-skill-reading/10 px-3 py-1 text-xs font-extrabold text-skill-reading">
									Phần {activePassage.part}
								</span>
								<span className="text-xs text-muted">{activePassage.duration_minutes} phút</span>
							</div>
							<PassageSpeechControl
								key={activePassage.id}
								text={activePassage.passage}
								onActiveCharChange={setActiveCharIndex}
								voice={voice}
								onVoiceChange={handleVoiceChange}
								showVoicePicker={false}
							/>
						</div>
						<h2 className="text-base font-bold text-foreground">{activePassage.title}</h2>
						<HighlightablePassage
							text={activePassage.passage}
							passageId={activePassage.id}
							activeCharIndex={activeCharIndex}
							className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
						/>
					</div>
				</ScrollArea>

				{/* Questions */}
				<ScrollArea className="flex-1">
					<div className="space-y-6 bg-background px-6 pb-6">
						<div className="sticky top-0 z-10 -mx-6 border-b border-border-light bg-background/95 px-6 py-3 backdrop-blur">
							<div className="flex items-center justify-between gap-3">
								<p className="text-sm font-extrabold text-foreground">Câu hỏi đoạn {activeIdx + 1}</p>
								<span
									className={activeUnanswered > 0 ? "text-xs font-bold text-warning" : "text-xs text-primary"}
								>
									{activeUnanswered > 0 ? `Còn ${activeUnanswered} câu chưa trả lời` : "Đã trả lời đủ"}
								</span>
							</div>
							<ExamRoomQuestionNav
								className="mt-3"
								items={activePassage.items.map((item, i) => ({
									id: item.id,
									label: i + 1,
									answered: mcqAnswers.has(item.id),
									onClick: () => handleJump(i),
								}))}
							/>
						</div>

						{activePassage.items.map((item, idx) => (
							<div key={item.id} id={`reading-item-${idx}`}>
								<MCQQuestion
									item={item}
									index={idx}
									selectedIndex={mcqAnswers.get(item.id)}
									onSelect={onAnswer}
									skill="reading"
								/>
							</div>
						))}
					</div>
				</ScrollArea>
			</div>

			<ExamRoomFooter
				{...activeFooter}
				statusText={activeMeta ? footer.statusText : ""}
				toneClass="text-skill-reading"
				context={
					<ExamRoomProgressTabs
						items={passagesMeta.map((meta, i) => ({
							id: String(i),
							label: `Đoạn ${i + 1}`,
							meta: `${meta.answered}/${meta.total}`,
							progressPct: meta.total > 0 ? (meta.answered / meta.total) * 100 : 0,
						}))}
						activeId={String(activeIdx)}
						onChange={(id) => handleTab(Number(id))}
					/>
				}
			/>
		</div>
	)
}
