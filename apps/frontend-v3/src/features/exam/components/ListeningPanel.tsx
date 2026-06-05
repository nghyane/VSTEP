import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { logListeningPlayed } from "#/features/exam/actions"
import {
	ExamRoomProgressTabs,
	ExamRoomQuestionNav,
	ExamRoomSkillBadge,
} from "#/features/exam/components/ExamRoomChrome"
import { ExamRoomFooter, type ExamRoomFooterAction } from "#/features/exam/components/ExamRoomFooter"
import { MCQQuestion } from "#/features/exam/components/MCQQuestion"
import type { ExamVersionListeningSection, ListeningPlaySummaryItem } from "#/features/exam/types"
import { useToast } from "#/lib/toast"

interface Props {
	sections: ExamVersionListeningSection[]
	sessionId: string
	initialPlaySummary: ListeningPlaySummaryItem[]
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
	footer: ExamRoomFooterAction
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ListeningPanel({
	sections,
	sessionId,
	initialPlaySummary,
	mcqAnswers,
	onAnswer,
	footer,
}: Props) {
	// Sort by display_order then part
	const sorted = useMemo(
		() => [...sections].sort((a, b) => a.display_order - b.display_order || a.part - b.part),
		[sections],
	)

	// Group sections by part number → Part 1 / Part 2 / Part 3
	const partGroups = useMemo(() => {
		const map = new Map<number, ExamVersionListeningSection[]>()
		for (const sec of sorted) {
			const list = map.get(sec.part) ?? []
			list.push(sec)
			map.set(sec.part, list)
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => a - b)
			.map(([part, secs]) => ({ part, sections: secs }))
	}, [sorted])

	const [activePartIdx, setActivePartIdx] = useState(0) // index trong partGroups
	const [playingIdx, setPlayingIdx] = useState(-1) // index trong sorted (toàn bộ)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const [isPreparingAudio, setIsPreparingAudio] = useState(false)
	const [audioMessage, setAudioMessage] = useState<string | null>(null)
	const [playedSectionIds, setPlayedSectionIds] = useState<Set<string>>(
		() => new Set(initialPlaySummary.filter((item) => item.played).map((item) => item.section_id)),
	)
	const audioRefs = useRef<(HTMLAudioElement | null)[]>([])

	useEffect(() => {
		setPlayedSectionIds(
			new Set(initialPlaySummary.filter((item) => item.played).map((item) => item.section_id)),
		)
	}, [initialPlaySummary])

	const isPlaying = playingIdx >= 0

	// Sections thuộc part đang active
	const activeGroup = partGroups[activePartIdx]

	// Index trong sorted của section đầu tiên đang playing
	const playingPartIdx = useMemo(() => {
		if (playingIdx < 0) return -1
		const sec = sorted[playingIdx]
		if (!sec) return -1
		return partGroups.findIndex((g) => g.part === sec.part)
	}, [playingIdx, sorted, partGroups])

	// Sync progress bar
	useEffect(() => {
		if (playingIdx < 0) {
			setCurrentTime(0)
			setDuration(0)
			return
		}
		const sync = () => {
			const audio = audioRefs.current[playingIdx]
			if (!audio) return
			setCurrentTime(audio.currentTime)
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		sync()
		const id = setInterval(sync, 250)
		return () => clearInterval(id)
	}, [playingIdx])

	const playSectionAtIndex = useCallback(
		async (sectionIndex: number): Promise<boolean> => {
			const section = sorted[sectionIndex]
			if (!section) return false

			if (playedSectionIds.has(section.id)) {
				setAudioMessage(`Âm thanh phần ${section.part} đã phát. Bạn vẫn có thể tiếp tục trả lời câu hỏi.`)
				return false
			}

			setIsPreparingAudio(true)
			setAudioMessage(null)

			let alreadyPlayed = false
			try {
				const result = await logListeningPlayed(sessionId, section.id)
				alreadyPlayed = result.already_played
				setPlayedSectionIds((current) => new Set(current).add(section.id))
			} catch {
				setAudioMessage("Không ghi nhận được lượt phát âm thanh. Vui lòng kiểm tra kết nối và thử lại.")
				useToast.getState().add("Không ghi nhận được lượt phát âm thanh. Vui lòng thử lại.")
				return false
			} finally {
				setIsPreparingAudio(false)
			}

			if (alreadyPlayed) {
				setAudioMessage(`Âm thanh phần ${section.part} đã phát trước đó. Không thể phát lại.`)
				return false
			}

			const audio = audioRefs.current[sectionIndex]
			if (!audio) {
				setAudioMessage(
					"Không tìm thấy tệp âm thanh. Lượt phát đã được ghi nhận, vui lòng báo giám thị/hỗ trợ.",
				)
				return false
			}

			setPlayingIdx(sectionIndex)
			const partIdx = partGroups.findIndex((group) => group.part === section.part)
			if (partIdx >= 0) setActivePartIdx(partIdx)

			try {
				audio.currentTime = 0
				await audio.play()
				return true
			} catch {
				setPlayingIdx(-1)
				setAudioMessage(
					"Trình duyệt không phát được âm thanh. Lượt phát đã được ghi nhận, vui lòng báo giám thị/hỗ trợ.",
				)
				useToast.getState().add("Không phát được âm thanh. Vui lòng báo hỗ trợ.")
				return false
			}
		},
		[partGroups, playedSectionIds, sessionId, sorted],
	)

	useEffect(() => {
		const cleanups: Array<() => void> = []
		for (let i = 0; i < sorted.length; i++) {
			const audio = audioRefs.current[i]
			if (!audio) continue
			const onEnded = () => {
				const current = sorted[i]
				const nextIndex = sorted.findIndex(
					(section, index) =>
						index > i && section.part === current?.part && !playedSectionIds.has(section.id),
				)

				if (nextIndex >= 0) {
					void playSectionAtIndex(nextIndex)
					return
				}

				setPlayingIdx(-1)
			}
			audio.addEventListener("ended", onEnded)
			cleanups.push(() => audio.removeEventListener("ended", onEnded))
		}
		return () => {
			for (const fn of cleanups) fn()
		}
	}, [playSectionAtIndex, playedSectionIds, sorted])

	const activeSectionIndexes = useMemo(
		() =>
			(activeGroup?.sections ?? [])
				.map((section) => sorted.findIndex((candidate) => candidate.id === section.id))
				.filter((index) => index >= 0),
		[activeGroup, sorted],
	)
	const nextPlayableActiveIndex = activeSectionIndexes.find(
		(index) => !playedSectionIds.has(sorted[index]?.id ?? ""),
	)
	const activePartAudioPlayed = activeSectionIndexes.length > 0 && nextPlayableActiveIndex === undefined

	const handleStartAudio = useCallback(() => {
		if (isPlaying || isPreparingAudio || nextPlayableActiveIndex === undefined) return
		void playSectionAtIndex(nextPlayableActiveIndex)
	}, [isPlaying, isPreparingAudio, nextPlayableActiveIndex, playSectionAtIndex])

	const handleNextPart = useCallback(() => {
		setActivePartIdx((i) => Math.min(i + 1, partGroups.length - 1))
	}, [partGroups.length])

	const handleJumpToItem = useCallback((globalIdx: number) => {
		document
			.getElementById(`listening-item-${globalIdx}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

	// Per-part meta: answered / total
	const partsMeta = useMemo(
		() =>
			partGroups.map((g) => {
				const total = g.sections.reduce((s, sec) => s + sec.items.length, 0)
				const answered = g.sections.reduce(
					(s, sec) => s + sec.items.filter((it) => mcqAnswers.has(it.id)).length,
					0,
				)
				const audioTotal = g.sections.length
				const audioPlayed = g.sections.filter((section) => playedSectionIds.has(section.id)).length
				return { part: g.part, total, answered, audioTotal, audioPlayed }
			}),
		[partGroups, mcqAnswers, playedSectionIds],
	)

	// All items in active part (flattened, with global index offset)
	const activeItems = useMemo(() => {
		const items: Array<{
			item: ExamVersionListeningSection["items"][0]
			globalIdx: number
			sectionTitle: string
		}> = []
		let globalIdx = 0
		for (const sec of sorted) {
			const inActivePart = sec.part === activeGroup?.part
			for (const item of sec.items) {
				if (inActivePart) {
					items.push({ item, globalIdx, sectionTitle: sec.part_title })
				}
				globalIdx++
			}
		}
		return items
	}, [sorted, activeGroup])

	// Global offset of first item in active part (for jump buttons)
	const activePartGlobalOffset = useMemo(() => {
		let offset = 0
		for (const sec of sorted) {
			if (sec.part === activeGroup?.part) break
			offset += sec.items.length
		}
		return offset
	}, [sorted, activeGroup])

	const activePartAnswered = partsMeta[activePartIdx]?.answered ?? 0
	const activePartTotal = partsMeta[activePartIdx]?.total ?? 0
	const activePartUnanswered = Math.max(0, activePartTotal - activePartAnswered)

	if (partGroups.length === 0) return null

	const hasNextPart = activePartIdx < partGroups.length - 1
	const activeFooter = hasNextPart
		? {
				...footer,
				isLastSkill: false,
				nextTone: "secondary" as const,
				statusText:
					activePartUnanswered > 0
						? `Còn ${activePartUnanswered} câu chưa trả lời ở phần ${activeGroup?.part}`
						: `Phần ${activeGroup?.part} đã trả lời đủ`,
				nextLabel: `Tiếp: Phần ${partGroups[activePartIdx + 1]?.part}`,
				onNext: handleNextPart,
			}
		: footer

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			<ScrollArea className="flex-1 bg-background">
				<div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-5 p-6 lg:grid-cols-[320px_minmax(0,1fr)]">
					<div className="order-2 min-w-0 lg:order-2">
						<div className="sticky top-0 z-10 mb-5 border-b border-border-light bg-background/95 py-3 backdrop-blur">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<ExamRoomSkillBadge tone="listening">Phần {activeGroup?.part}</ExamRoomSkillBadge>
									<p className="text-sm font-extrabold text-foreground">Câu hỏi phần {activeGroup?.part}</p>
								</div>
								<span
									className={
										activePartUnanswered > 0 ? "text-xs font-bold text-warning" : "text-xs text-primary"
									}
								>
									{activePartUnanswered > 0
										? `Còn ${activePartUnanswered} câu chưa trả lời`
										: "Đã trả lời đủ"}
								</span>
							</div>
							<div className="mt-3 flex items-center gap-3">
								<ExamRoomQuestionNav
									className="min-w-0"
									items={activeItems.map(({ item, globalIdx }, localI) => ({
										id: item.id,
										label: localI + 1,
										answered: mcqAnswers.has(item.id),
										onClick: () => handleJumpToItem(globalIdx),
									}))}
								/>
								<span className="hidden shrink-0 text-xs text-subtle sm:inline">
									Âm thanh {partsMeta[activePartIdx]?.audioPlayed ?? 0}/
									{partsMeta[activePartIdx]?.audioTotal ?? 0} đã phát
								</span>
							</div>
							{audioMessage && <p className="mt-2 text-xs font-semibold text-warning">{audioMessage}</p>}
						</div>

						<div className="space-y-5">
							{activeItems.map(({ item, globalIdx }) => (
								<div key={item.id} id={`listening-item-${globalIdx}`}>
									<MCQQuestion
										item={item}
										index={globalIdx - activePartGlobalOffset}
										selectedIndex={mcqAnswers.get(item.id)}
										onSelect={onAnswer}
									/>
								</div>
							))}
						</div>
					</div>

					<aside className="order-1 lg:sticky lg:top-6 lg:self-start">
						<div className="rounded-(--radius-card) border border-border bg-surface p-4">
							<p className="mb-3 text-sm font-extrabold text-foreground">Âm thanh</p>
							<div className="space-y-3">
								{!isPlaying ? (
									<button
										type="button"
										onClick={handleStartAudio}
										disabled={isPreparingAudio || activePartAudioPlayed}
										className="btn btn-secondary w-full px-4 py-2 text-xs text-skill-listening disabled:opacity-60"
									>
										{isPreparingAudio
											? "Đang mở âm thanh…"
											: activePartAudioPlayed
												? `Âm thanh phần ${activeGroup?.part} đã phát`
												: `Phát âm thanh phần ${activeGroup?.part}`}
									</button>
								) : (
									<div className="flex items-center gap-2 rounded-(--radius-button) bg-skill-listening/10 px-3 py-2 text-skill-listening">
										<Icon name="volume" size="xs" />
										<span className="font-mono text-xs font-extrabold tabular-nums">
											{formatTime(currentTime)}
										</span>
										{playingPartIdx >= 0 && playingPartIdx !== activePartIdx && (
											<span className="text-xs text-muted">phần {sorted[playingIdx]?.part}</span>
										)}
									</div>
								)}
								<div className="flex items-center gap-2">
									<div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
										<div
											className="absolute inset-y-0 left-0 rounded-full bg-skill-listening transition-[width] duration-300"
											style={{ width: `${progressPct}%` }}
										/>
									</div>
									<span className="font-mono text-xs tabular-nums text-muted">{formatTime(duration)}</span>
								</div>
								{!audioMessage && !activePartAudioPlayed && !isPlaying && (
									<p className="text-xs text-subtle">Mỗi đoạn âm thanh chỉ phát một lần.</p>
								)}
							</div>
						</div>
					</aside>
				</div>
			</ScrollArea>

			{sorted.map((sec, i) => (
				<audio
					key={sec.id}
					ref={(el) => {
						audioRefs.current[i] = el
					}}
					src={sec.audio_url}
					preload="metadata"
					className="hidden"
				/>
			))}

			<ExamRoomFooter
				{...activeFooter}
				toneClass="text-skill-listening"
				context={
					<ExamRoomProgressTabs
						items={partsMeta.map((meta, i) => ({
							id: String(i),
							label: `Phần ${meta.part}`,
							meta: `${meta.answered}/${meta.total}`,
							progressPct: meta.total > 0 ? (meta.answered / meta.total) * 100 : 0,
							emphasis: i === playingPartIdx,
						}))}
						activeId={String(activePartIdx)}
						onChange={(id) => setActivePartIdx(Number(id))}
					/>
				}
			/>
		</div>
	)
}
