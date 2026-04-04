import {
	Award02Icon,
	BubbleChatIcon,
	CheckmarkBadge01Icon,
	LicenseDraftIcon,
	Mic01Icon,
	Note01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type { VstepBand } from "@/types/api"

// --- Types for AI speaking feedback ---

export interface SpeakingCriteriaScores {
	pronunciation: number
	fluency: number
	grammar: number
	vocabulary: number
	taskFulfillment: number
}

export interface TranscriptHighlight {
	offset: number
	length: number
	original: string
	suggestion: string
	type: "grammar" | "vocabulary" | "pronunciation" | "fluency"
}

export interface SpeakingTemplate {
	title: string
	structure: string[]
	example?: string
}

export interface SpeakingFeedbackData {
	overallScore: number
	band: VstepBand | null
	criteriaScores: SpeakingCriteriaScores
	transcript: string
	highlights: TranscriptHighlight[]
	templates: SpeakingTemplate[]
	generalFeedback: string
}

// --- Helpers ---

const criteriaLabels: Record<keyof SpeakingCriteriaScores, string> = {
	pronunciation: "Phát âm",
	fluency: "Lưu loát",
	grammar: "Ngữ pháp",
	vocabulary: "Từ vựng",
	taskFulfillment: "Hoàn thành yêu cầu",
}

const criteriaColors: Record<keyof SpeakingCriteriaScores, string> = {
	pronunciation: "bg-blue-500",
	fluency: "bg-emerald-500",
	grammar: "bg-amber-500",
	vocabulary: "bg-purple-500",
	taskFulfillment: "bg-rose-500",
}

const highlightTypeLabels: Record<TranscriptHighlight["type"], string> = {
	grammar: "Ngữ pháp",
	vocabulary: "Từ vựng",
	pronunciation: "Phát âm",
	fluency: "Lưu loát",
}

const highlightTypeColors: Record<TranscriptHighlight["type"], string> = {
	grammar: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
	vocabulary: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
	pronunciation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
	fluency: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
}

function getScoreColor(score: number): string {
	if (score >= 8) return "text-emerald-600 dark:text-emerald-400"
	if (score >= 6) return "text-amber-600 dark:text-amber-400"
	return "text-red-600 dark:text-red-400"
}

function getBandColor(band: VstepBand | null): string {
	if (band === "C1")
		return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
	if (band === "B2") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
	return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
}

// --- Score Ring ---

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
	const radius = (size - 8) / 2
	const circumference = 2 * Math.PI * radius
	const progress = (score / 10) * circumference
	const strokeDashoffset = circumference - progress

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				className="-rotate-90"
				role="img"
				aria-label={`Score ${score.toFixed(1)} out of 10`}
			>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={4}
					className="text-muted/20"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={4}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					className={getScoreColor(score)}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center">
				<span className={cn("text-lg font-bold", getScoreColor(score))}>{score.toFixed(1)}</span>
			</div>
		</div>
	)
}

// --- Criteria Bar ---

function CriteriaBar({
	label,
	score,
	colorClass,
}: {
	label: string
	score: number
	colorClass: string
}) {
	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between text-xs">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-semibold">{score.toFixed(1)}/10</span>
			</div>
			<div className="h-1.5 rounded-full bg-muted/30">
				<div
					className={cn("h-full rounded-full transition-all", colorClass)}
					style={{ width: `${(score / 10) * 100}%` }}
				/>
			</div>
		</div>
	)
}

// --- Transcript with highlights ---

function HighlightedTranscript({
	transcript,
	highlights,
}: {
	transcript: string
	highlights: TranscriptHighlight[]
}) {
	if (highlights.length === 0) {
		return <p className="text-sm leading-relaxed">{transcript}</p>
	}

	const sorted = [...highlights].sort((a, b) => a.offset - b.offset)
	const parts: React.ReactNode[] = []
	let lastIndex = 0

	for (let i = 0; i < sorted.length; i++) {
		const h = sorted[i]
		if (h.offset > lastIndex) {
			parts.push(<span key={`text-${i}`}>{transcript.slice(lastIndex, h.offset)}</span>)
		}
		parts.push(
			<span
				key={`hl-${i}`}
				className={cn(
					"relative cursor-help rounded px-0.5 underline decoration-wavy decoration-1 underline-offset-2",
					highlightTypeColors[h.type],
				)}
				title={`${highlightTypeLabels[h.type]}: ${h.suggestion}`}
			>
				{transcript.slice(h.offset, h.offset + h.length)}
			</span>,
		)
		lastIndex = h.offset + h.length
	}

	if (lastIndex < transcript.length) {
		parts.push(<span key="text-end">{transcript.slice(lastIndex)}</span>)
	}

	return <p className="text-sm leading-relaxed">{parts}</p>
}

// --- Main Component ---

// Mock data for development — will be replaced by real API data
const MOCK_FEEDBACK: SpeakingFeedbackData = {
	overallScore: 6.5,
	band: "B2",
	criteriaScores: {
		pronunciation: 7.0,
		fluency: 6.0,
		grammar: 6.5,
		vocabulary: 6.5,
		taskFulfillment: 7.0,
	},
	transcript:
		"I think travel is very important for everyone. When we go to another country, we can learn many thing about their culture. I goed to Japan last year and I really enjoy it. The food is delicious and people is very friendly. I think everyone should travel more because it help us to understand the world better.",
	highlights: [
		{
			offset: 97,
			length: 10,
			original: "many thing",
			suggestion: '"many things" — danh từ đếm được số nhiều cần thêm "s"',
			type: "grammar",
		},
		{
			offset: 133,
			length: 4,
			original: "goed",
			suggestion: '"went" — quá khứ bất quy tắc của "go"',
			type: "grammar",
		},
		{
			offset: 171,
			length: 5,
			original: "enjoy",
			suggestion: '"enjoyed" — cần chia quá khứ đơn cho phù hợp thì',
			type: "grammar",
		},
		{
			offset: 211,
			length: 9,
			original: "people is",
			suggestion: '"people are" — "people" là danh từ số nhiều',
			type: "grammar",
		},
		{
			offset: 264,
			length: 4,
			original: "help",
			suggestion: '"helps" — chủ ngữ "it" đi với động từ thêm "s"',
			type: "grammar",
		},
	],
	templates: [
		{
			title: "Mở bài — Nêu quan điểm",
			structure: [
				"In my opinion, [topic] is extremely important because…",
				"I strongly believe that [topic] plays a key role in…",
			],
		},
		{
			title: "Thân bài — Đưa ví dụ cụ thể",
			structure: [
				"For instance, when I visited [place], I had the opportunity to…",
				"A concrete example would be [experience], which taught me…",
			],
		},
		{
			title: "Kết bài — Tổng kết và mở rộng",
			structure: [
				"In conclusion, I firmly believe that [topic] is essential for…",
				"To sum up, [topic] not only [benefit 1] but also [benefit 2].",
			],
		},
	],
	generalFeedback:
		"Bạn trình bày ý tưởng khá rõ ràng và có ví dụ minh họa tốt. Tuy nhiên, cần chú ý hơn về ngữ pháp, đặc biệt là chia động từ ở thì quá khứ và sự hòa hợp chủ ngữ - vị ngữ. Hãy sử dụng thêm các liên từ và từ nối để bài nói mạch lạc hơn.",
}

export function SpeakingFeedback({ data = MOCK_FEEDBACK }: { data?: SpeakingFeedbackData }) {
	return (
		<div className="space-y-5">
			{/* ── Score overview ── */}
			<div className="rounded-2xl bg-muted/50 p-5 shadow-sm">
				<div className="flex items-center gap-4">
					<ScoreRing score={data.overallScore} />
					<div className="flex-1 space-y-1">
						<p className="text-sm font-semibold">Điểm ước lượng</p>
						{data.band && (
							<span
								className={cn(
									"inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
									getBandColor(data.band),
								)}
							>
								VSTEP {data.band}
							</span>
						)}
						<p className="text-xs text-muted-foreground">Thang điểm 10 · Dựa trên AI đánh giá</p>
					</div>
				</div>

				{/* Criteria breakdown */}
				<div className="mt-4 space-y-2.5">
					{(Object.keys(criteriaLabels) as (keyof SpeakingCriteriaScores)[]).map((key) => (
						<CriteriaBar
							key={key}
							label={criteriaLabels[key]}
							score={data.criteriaScores[key]}
							colorClass={criteriaColors[key]}
						/>
					))}
				</div>
			</div>

			{/* ── General feedback ── */}
			<div className="rounded-2xl bg-blue-50/50 p-4 shadow-sm dark:bg-blue-950/20">
				<div className="mb-2 flex items-center gap-2">
					<HugeiconsIcon
						icon={BubbleChatIcon}
						className="size-4 text-blue-600 dark:text-blue-400"
					/>
					<p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Nhận xét chung</p>
				</div>
				<p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
					{data.generalFeedback}
				</p>
			</div>

			{/* ── Transcript with highlights ── */}
			<div className="rounded-2xl bg-muted/50 p-4 shadow-sm">
				<div className="mb-3 flex items-center gap-2">
					<HugeiconsIcon icon={Mic01Icon} className="size-4 text-primary" />
					<p className="text-sm font-semibold">Bản ghi lời nói</p>
				</div>

				<div className="rounded-lg bg-muted/20 p-3">
					<HighlightedTranscript transcript={data.transcript} highlights={data.highlights} />
				</div>

				{/* Highlight legend */}
				{data.highlights.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-2">
						{(["grammar", "vocabulary", "pronunciation", "fluency"] as const)
							.filter((type) => data.highlights.some((h) => h.type === type))
							.map((type) => (
								<span
									key={type}
									className={cn(
										"inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium",
										highlightTypeColors[type],
									)}
								>
									{highlightTypeLabels[type]}
								</span>
							))}
					</div>
				)}

				{/* Error details */}
				{data.highlights.length > 0 && (
					<div className="mt-3 space-y-2 pt-3">
						<div className="flex items-center gap-2">
							<HugeiconsIcon icon={Note01Icon} className="size-3.5 text-muted-foreground" />
							<p className="text-xs font-semibold text-muted-foreground">
								Chi tiết lỗi ({data.highlights.length})
							</p>
						</div>
						{data.highlights.map((h, i) => (
							<div
								key={i}
								className="flex items-start gap-2 rounded-lg bg-muted/10 px-3 py-2 text-xs"
							>
								<span
									className={cn(
										"mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-medium",
										highlightTypeColors[h.type],
									)}
								>
									{highlightTypeLabels[h.type]}
								</span>
								<div className="flex-1 space-y-0.5">
									<p>
										<span className="font-medium text-destructive line-through">{h.original}</span>
									</p>
									<p className="text-muted-foreground">{h.suggestion}</p>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* ── Speaking templates ── */}
			<div className="rounded-2xl bg-emerald-50/50 p-4 shadow-sm dark:bg-emerald-950/20">
				<div className="mb-3 flex items-center gap-2">
					<HugeiconsIcon
						icon={LicenseDraftIcon}
						className="size-4 text-emerald-600 dark:text-emerald-400"
					/>
					<p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
						Khung/Template gợi ý
					</p>
				</div>
				<div className="space-y-3">
					{data.templates.map((tpl, i) => (
						<div key={i} className="space-y-1.5">
							<div className="flex items-center gap-1.5">
								<HugeiconsIcon
									icon={CheckmarkBadge01Icon}
									className="size-3.5 text-emerald-600 dark:text-emerald-400"
								/>
								<p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
									{tpl.title}
								</p>
							</div>
							<ul className="space-y-1 pl-5">
								{tpl.structure.map((line, j) => (
									<li
										key={j}
										className="text-xs italic leading-relaxed text-emerald-900 dark:text-emerald-100"
									>
										"{line}"
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>

			{/* ── Score disclaimer ── */}
			<div className="flex items-start gap-2 rounded-2xl bg-muted/50 px-3 py-2.5 shadow-sm">
				<HugeiconsIcon
					icon={Award02Icon}
					className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
				/>
				<p className="text-[11px] leading-relaxed text-muted-foreground">
					Điểm số do AI ước lượng dựa trên bản ghi lời nói. Kết quả mang tính tham khảo, không thay
					thế đánh giá của giám khảo chính thức.
				</p>
			</div>
		</div>
	)
}
