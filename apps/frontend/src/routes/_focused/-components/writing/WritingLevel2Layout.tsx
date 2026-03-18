import { Book02Icon, BulbIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { SpellCheckEditor, useSpellCheck } from "@/components/spell-check-editor"
import { cn } from "@/lib/utils"
import { parseWritingPrompt } from "@/routes/_focused/-components/shared/exercise-shared"
import type { WritingExam } from "@/routes/_learner/practice/-components/mock-data"

interface WritingKeyword {
	word: string
	meaning: string
	example: string
	tip?: string
}

const MOCK_WRITING_KEYWORDS: Record<string, WritingKeyword[]> = {
	"write-2": [
		{
			word: "isolated",
			meaning: "bị cô lập, tách biệt",
			example: "People feel more isolated despite being online.",
			tip: "Thay thế bằng: disconnected, detached, alienated",
		},
		{
			word: "indispensable",
			meaning: "không thể thiếu",
			example: "The internet has become indispensable.",
			tip: "Từ nâng cao, tăng band điểm Vocabulary",
		},
		{
			word: "moreover",
			meaning: "hơn nữa, ngoài ra",
			example: "Moreover, online communities bring people together.",
			tip: "Từ nối bổ sung ý — dùng đầu đoạn hoặc giữa câu",
		},
		{
			word: "on the one hand",
			meaning: "một mặt",
			example: "On the one hand, it improves communication.",
			tip: "Luôn đi cặp với 'On the other hand'",
		},
		{
			word: "in conclusion",
			meaning: "tóm lại, kết luận",
			example: "In conclusion, the internet has both benefits and drawbacks.",
			tip: "Dùng mở đầu đoạn kết luận",
		},
		{
			word: "excessive",
			meaning: "quá mức, thái quá",
			example: "Excessive use of social media can cause problems.",
		},
		{
			word: "transcend",
			meaning: "vượt qua, vượt trên",
			example: "Friendships that transcend geographical boundaries.",
			tip: "Từ học thuật nâng cao — gây ấn tượng với giám khảo",
		},
		{
			word: "face-to-face",
			meaning: "trực tiếp, mặt đối mặt",
			example: "Face-to-face interactions are more meaningful.",
		},
	],
}

export function WritingLevel2Layout({
	tasks,
	examId,
	writingTexts,
	setWritingTexts,
}: {
	tasks: WritingExam["tasks"]
	examId: string
	writingTexts: Record<number, string>
	setWritingTexts: React.Dispatch<React.SetStateAction<Record<number, string>>>
}) {
	const keywords = MOCK_WRITING_KEYWORDS[examId] ?? []
	const task = tasks[0]
	const text = task ? (writingTexts[task.taskNumber] ?? "") : ""
	const { misspelled } = useSpellCheck(text)

	if (!task) return null

	const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
	const usedKeywords = keywords.filter((kw) => text.toLowerCase().includes(kw.word.toLowerCase()))

	// Dedupe misspelled for the error list
	const uniqueErrors = misspelled.filter(
		(m, i, arr) => arr.findIndex((x) => x.word.toLowerCase() === m.word.toLowerCase()) === i,
	)

	const { before, quote, after } = parseWritingPrompt(task.prompt)

	return (
		<div className="flex flex-1 overflow-hidden">
			{/* Left — Prompt + Editor */}
			<div className="flex flex-1 flex-col overflow-y-auto">
				<div className="space-y-4 p-6">
					{task.title && (
						<span className="inline-block rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
							{task.title}
						</span>
					)}

					<div className="whitespace-pre-line text-sm leading-relaxed">{before}</div>

					{quote && (
						<blockquote className="rounded-xl border-l-[3px] border-primary bg-muted/30 py-3 pr-4 pl-4 text-sm italic leading-relaxed">
							{quote}
						</blockquote>
					)}

					{after && <div className="whitespace-pre-line text-sm leading-relaxed">{after}</div>}

					{task.instructions && (
						<p className="text-sm text-muted-foreground">{task.instructions}</p>
					)}

					<SpellCheckEditor
						value={text}
						onChange={(val) =>
							setWritingTexts((prev) => ({
								...prev,
								[task.taskNumber]: val,
							}))
						}
						placeholder="Nhập bài viết của bạn..."
						minHeight={300}
					/>

					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							{wordCount}/{task.wordLimit} từ
							{wordCount < task.wordLimit && (
								<span className="ml-1 text-orange-500">(cần tối thiểu {task.wordLimit} từ)</span>
							)}
						</p>
						{usedKeywords.length > 0 && (
							<p className="text-xs text-green-600">
								✔ Đã dùng {usedKeywords.length}/{keywords.length} từ gợi ý
							</p>
						)}
					</div>

					{/* Spell error list with suggestions */}
					{uniqueErrors.length > 0 && (
						<div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
							<p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
								<span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">
									!
								</span>
								Lỗi chính tả ({uniqueErrors.length})
							</p>
							{uniqueErrors.map((err, i) => (
								<div key={i} className="flex items-center gap-2 text-xs">
									<span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-700 line-through dark:bg-red-900/30 dark:text-red-400">
										{err.word}
									</span>
									{err.suggestions.length > 0 && (
										<>
											<span className="text-muted-foreground">→</span>
											<span className="font-medium text-green-600 dark:text-green-400">
												{err.suggestions.join(", ")}
											</span>
										</>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Right — Vocabulary & Tips sidebar */}
			<aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l bg-muted/5 lg:block">
				<div className="space-y-4 p-4">
					{/* Header */}
					<div className="flex items-center gap-2">
						<div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
							<HugeiconsIcon icon={Book02Icon} className="size-4" />
						</div>
						<div>
							<p className="text-sm font-semibold">Trợ lý từ vựng</p>
							<p className="text-[10px] text-muted-foreground">Gợi ý từ khóa cho bài viết</p>
						</div>
					</div>

					{/* Keywords list */}
					<div className="space-y-2">
						{keywords.map((kw) => {
							const isUsed = text.toLowerCase().includes(kw.word.toLowerCase())
							return (
								<div
									key={kw.word}
									className={cn(
										"rounded-lg border p-2.5 transition-all duration-200",
										isUsed
											? "border-green-300 bg-green-50/80 dark:border-green-700 dark:bg-green-950/30"
											: "border-border bg-background",
									)}
								>
									<div className="flex items-center justify-between">
										<span className="text-sm font-semibold">{kw.word}</span>
										{isUsed && (
											<span className="flex size-4 items-center justify-center rounded-full bg-green-500 text-[9px] text-white">
												✓
											</span>
										)}
									</div>
									<p className="mt-0.5 text-xs text-muted-foreground">{kw.meaning}</p>
									<p className="mt-1 text-[11px] italic text-primary/70">"{kw.example}"</p>
									{kw.tip && (
										<p className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
											<HugeiconsIcon icon={BulbIcon} className="size-3 shrink-0" />
											{kw.tip}
										</p>
									)}
								</div>
							)
						})}
					</div>

					{/* Writing structure tips */}
					<div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-700 dark:bg-amber-950/20">
						<div className="flex items-center gap-1.5">
							<HugeiconsIcon
								icon={Tick02Icon}
								className="size-3.5 text-amber-600 dark:text-amber-400"
							/>
							<p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
								Gợi ý cấu trúc
							</p>
						</div>
						<ul className="space-y-1">
							<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
								<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
								Mở bài: Giới thiệu chủ đề + nêu thesis statement.
							</li>
							<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
								<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
								Thân bài 1: Quan điểm 1 + ví dụ minh họa.
							</li>
							<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
								<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
								Thân bài 2: Quan điểm đối lập + dẫn chứng.
							</li>
							<li className="flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
								<span className="mt-1 size-1 shrink-0 rounded-full bg-amber-500" />
								Kết bài: Tóm tắt + khẳng định quan điểm.
							</li>
						</ul>
					</div>
				</div>
			</aside>
		</div>
	)
}
