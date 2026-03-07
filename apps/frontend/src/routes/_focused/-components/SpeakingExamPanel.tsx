import { ArrowLeft01Icon, ArrowRight01Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
	ExamSessionDetail,
	QuestionContent,
	SpeakingPart1Content,
	SpeakingPart2Content,
	SpeakingPart3Content,
} from "@/types/api"

// --- Type guards ---

function isPart1(c: QuestionContent): c is SpeakingPart1Content {
	return "topics" in c
}

function isPart2(c: QuestionContent): c is SpeakingPart2Content {
	return "situation" in c && "options" in c
}

function isPart3(c: QuestionContent): c is SpeakingPart3Content {
	return "centralIdea" in c
}

// --- Part labels ---

function getPartLabel(content: QuestionContent): string {
	if (isPart1(content)) return "Social Interaction"
	if (isPart2(content)) return "Solution Discussion"
	if (isPart3(content)) return "Topic Development"
	return "Speaking"
}

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${seconds}s`
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// --- Props ---

interface SpeakingExamPanelProps {
	questions: ExamSessionDetail["questions"]
}

// --- Content renderers ---

function Part1Content({ content }: { content: SpeakingPart1Content }) {
	return (
		<div className="space-y-6">
			{content.topics.map((topic, ti) => (
				<div key={`topic-${ti}`} className="space-y-3">
					<h4 className="font-semibold">{topic.name}</h4>
					<ul className="space-y-2 pl-1">
						{topic.questions.map((q, qi) => (
							<li
								key={`q-${ti}-${qi}`}
								className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm"
							>
								<span className="shrink-0 font-medium text-primary">{qi + 1}.</span>
								<span>{q}</span>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	)
}

function Part2Content({ content }: { content: SpeakingPart2Content }) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{content.situation}</p>
			</div>

			<div className="space-y-2">
				<p className="text-sm font-medium">Các lựa chọn:</p>
				<div className="grid gap-2 sm:grid-cols-2">
					{content.options.map((opt, i) => (
						<div
							key={`opt-${i}`}
							className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 text-sm"
						>
							<span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
								{i + 1}
							</span>
							<span>{opt}</span>
						</div>
					))}
				</div>
			</div>

			<div className="flex gap-4 text-xs text-muted-foreground">
				<span>Chuẩn bị: {formatDuration(content.preparationSeconds)}</span>
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>
		</div>
	)
}

function Part3Content({ content }: { content: SpeakingPart3Content }) {
	return (
		<div className="space-y-5">
			<div className="rounded-xl bg-muted/30 p-5">
				<p className="whitespace-pre-line leading-relaxed">{content.centralIdea}</p>
			</div>

			{content.suggestions.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm font-medium">Gợi ý:</p>
					<ul className="space-y-2">
						{content.suggestions.map((s, i) => (
							<li
								key={`sug-${i}`}
								className="flex gap-2 rounded-lg border border-border bg-background p-3 text-sm"
							>
								<span className="shrink-0 text-primary">•</span>
								<span>{s}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
				<p className="text-sm font-medium text-primary">Câu hỏi tiếp theo:</p>
				<p className="mt-1 text-sm">{content.followUpQuestion}</p>
			</div>

			<div className="flex gap-4 text-xs text-muted-foreground">
				<span>Chuẩn bị: {formatDuration(content.preparationSeconds)}</span>
				<span>Nói: {formatDuration(content.speakingSeconds)}</span>
			</div>
		</div>
	)
}

// --- Main Panel ---

export function SpeakingExamPanel({ questions }: SpeakingExamPanelProps) {
	const parts = useMemo(() => [...questions].sort((a, b) => a.part - b.part), [questions])

	const [activePartIdx, setActivePartIdx] = useState(0)

	const activeQuestion = parts[activePartIdx]
	const content = activeQuestion?.content

	const handlePrevPart = useCallback(() => {
		setActivePartIdx((i) => Math.max(0, i - 1))
	}, [])

	const handleNextPart = useCallback(() => {
		setActivePartIdx((i) => Math.min(i + 1, parts.length - 1))
	}, [parts.length])

	if (!activeQuestion || !content) return null

	const partLabel = getPartLabel(content)

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* ---- Content area (scrollable) ---- */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{/* Part header */}
					<div className="flex items-center gap-3">
						<HugeiconsIcon icon={Mic01Icon} className="size-5 text-primary" />
						<h3 className="text-lg font-semibold">Speaking — Part {activeQuestion.part}</h3>
						<span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
							{partLabel}
						</span>
					</div>

					{/* Recording notice */}
					<div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
						<HugeiconsIcon icon={Mic01Icon} className="size-4 text-primary" />
						<p className="text-sm text-primary">
							Chức năng ghi âm đang được phát triển. Hãy luyện nói theo các câu hỏi bên dưới.
						</p>
					</div>

					{/* Part-specific content */}
					{isPart1(content) && <Part1Content content={content} />}
					{isPart2(content) && <Part2Content content={content} />}
					{isPart3(content) && <Part3Content content={content} />}
				</div>
			</div>

			{/* ---- Part tabs + prev/next buttons ---- */}
			<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
				{/* Left: prev part */}
				{activePartIdx > 0 ? (
					<Button size="sm" variant="outline" onClick={handlePrevPart}>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
						Part {activePartIdx}
					</Button>
				) : (
					<div className="w-24" />
				)}

				{/* Center: part tabs */}
				<div className="flex items-center gap-1.5">
					{parts.map((q, i) => {
						const isActive = i === activePartIdx
						const label = getPartLabel(q.content)
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActivePartIdx(i)}
								className={cn(
									"flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								Part {i + 1}
								<span className="hidden opacity-80 sm:inline">· {label}</span>
							</button>
						)
					})}
				</div>

				{/* Right: next part */}
				{activePartIdx < parts.length - 1 ? (
					<Button size="sm" onClick={handleNextPart}>
						Part {activePartIdx + 2}
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
