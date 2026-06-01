import {
	CheckmarkCircle02Icon,
	Csv01Icon,
	MagicWand01Icon,
	QuoteDownIcon,
	Search01Icon,
	SortingIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { ExamQuestion } from "@/routes/_learner/practice/-components/mock-data"

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

interface TaggedWord {
	text: string
	tag?: string
	tagColor?: string // tailwind bg class
	highlightColor?: string // tailwind bg class for text highlight
}

interface Comparison {
	left: string
	operator: "=" | "><" | "→"
	right: string
}

interface ExplanationStep {
	number: string
	title: string
	tags?: TaggedWord[]
	simplified?: TaggedWord[]
	keywords?: string[]
	locationHint?: string
	quote?: string
	mainIdea?: string
	passageConclusion?: string
	questionConclusion?: string
	finalAnswer?: string
	finalAnswerColor?: string
}

interface QuestionExplanation {
	questionNumber: number
	relevantParagraphIndex: number
	paraphrasing: {
		questionHighlights: { phrase: string; color: string }[]
		badges: { text: string; color: string }[]
		comparisons: Comparison[]
	}
	steps: ExplanationStep[]
}

// ═══════════════════════════════════════════════════
// Mock explanation data for read-1 (Blood Types & Personality)
// ═══════════════════════════════════════════════════

const MOCK_EXPLANATIONS: Record<string, QuestionExplanation[]> = {
	"read-1": [
		{
			questionNumber: 1,
			relevantParagraphIndex: 0,
			paraphrasing: {
				questionHighlights: [
					{ phrase: "more popular in Asian countries", color: "bg-green-200 dark:bg-green-800/50" },
					{ phrase: "than in the West", color: "bg-orange-200 dark:bg-orange-800/50" },
				],
				badges: [
					{ text: "phổ biến ở châu Á", color: "bg-green-500" },
					{ text: "hơn phương Tây", color: "bg-orange-500" },
				],
				comparisons: [
					{
						left: "more popular in Asian countries",
						operator: "=",
						right: "especially popular in Japan and South Korea",
					},
					{
						left: "than in the West",
						operator: "→",
						right: "bài đọc không so sánh trực tiếp với phương Tây",
					},
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					tags: [
						{ text: "S + V", tagColor: "bg-green-500" },
						{ text: "Noun Phrase", tagColor: "bg-red-500" },
						{
							text: "niềm tin về nhóm máu",
							tagColor: "bg-amber-700",
							highlightColor: "bg-amber-100 dark:bg-amber-900/30",
						},
					],
					simplified: [
						{ text: "It is", tag: "S+V", tagColor: "bg-green-500" },
						{ text: "more popular", tag: "Adj", tagColor: "bg-blue-500" },
						{ text: "in Asian countries than in the West", tag: "PP", tagColor: "bg-purple-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["Asian countries", "popular", "Japan", "South Korea"],
					locationHint: "Dựa vào các từ khóa trên → Tìm được trích dẫn ở đoạn (A) câu 2.",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						"This belief is especially popular in Japan and South Korea, where asking about someone's blood type is almost as common as asking about their zodiac sign.",
					tags: [
						{ text: "S + V", tagColor: "bg-green-500" },
						{ text: "NP", tagColor: "bg-red-500" },
					],
					simplified: [
						{ text: "This belief is", tag: "S+V", tagColor: "bg-green-500" },
						{
							text: "especially popular in Japan and South Korea",
							tag: "NP",
							tagColor: "bg-red-500",
						},
					],
					mainIdea: "Niềm tin về nhóm máu đặc biệt phổ biến ở Nhật Bản và Hàn Quốc (châu Á).",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion:
						"Niềm tin này phổ biến ở Nhật Bản và Hàn Quốc → đều là các nước châu Á.",
					questionConclusion:
						"Nó phổ biến hơn ở các nước châu Á so với phương Tây → bài đọc chỉ nói phổ biến ở châu Á, không so sánh trực tiếp.",
					finalAnswer: "A",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 2,
			relevantParagraphIndex: 0,
			paraphrasing: {
				questionHighlights: [{ phrase: "theory", color: "bg-green-200 dark:bg-green-800/50" }],
				badges: [
					{ text: "lý thuyết", color: "bg-green-500" },
					{ text: "tồn tại", color: "bg-blue-500" },
				],
				comparisons: [
					{
						left: "the theory persists",
						operator: "=",
						right: "lý thuyết vẫn tồn tại trong văn hóa đại chúng",
					},
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "The word", tag: "S", tagColor: "bg-green-500" },
						{ text: "refers to", tag: "V", tagColor: "bg-blue-500" },
						{ text: "what concept in the passage", tag: "Object", tagColor: "bg-red-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["theory", "persists", "popular culture"],
					locationHint: "Dựa vào ngữ cảnh → Tìm được từ 'theory' ở câu cuối đoạn (A).",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						"Although it has been dismissed by the scientific community, the theory persists in popular culture.",
					simplified: [
						{ text: "the theory", tag: "S", tagColor: "bg-green-500" },
						{ text: "persists in popular culture", tag: "VP", tagColor: "bg-red-500" },
					],
					mainIdea: "'theory' ở đây chỉ lý thuyết về mối liên hệ giữa nhóm máu và tính cách.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Lý thuyết = the idea about blood types and personality.",
					questionConclusion:
						"Đáp án D (theory) chính là từ được nhắc đến trong câu cuối đoạn (A).",
					finalAnswer: "D",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 3,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [
					{ phrase: "suppress their own feelings", color: "bg-green-200 dark:bg-green-800/50" },
					{ phrase: "get on well with others", color: "bg-orange-200 dark:bg-orange-800/50" },
				],
				badges: [
					{ text: "kìm nén cảm xúc", color: "bg-green-500" },
					{ text: "hòa hợp", color: "bg-orange-500" },
				],
				comparisons: [
					{
						left: "suppress their own feelings",
						operator: "=",
						right: "may suppress their own feelings",
					},
					{ left: "get on well with others", operator: "=", right: "to get on well with others" },
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					tags: [
						{ text: "S + V", tagColor: "bg-green-500" },
						{ text: "Object", tagColor: "bg-red-500" },
						{
							text: "người nhóm máu A",
							tagColor: "bg-amber-700",
							highlightColor: "bg-amber-100 dark:bg-amber-900/30",
						},
					],
					simplified: [
						{ text: "They", tag: "S", tagColor: "bg-green-500" },
						{ text: "suppress their feelings", tag: "V+O", tagColor: "bg-blue-500" },
						{ text: "to get on well with others", tag: "Purpose", tagColor: "bg-purple-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["Type A", "suppress", "feelings", "get on well"],
					locationHint: "Dựa vào các từ khóa trên → Tìm được trích dẫn ở đoạn (B) câu 2.",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						"They tend to prioritize harmony in their relationships and may suppress their own feelings to get on well with others.",
					simplified: [
						{ text: "They", tag: "S", tagColor: "bg-green-500" },
						{ text: "may suppress their own feelings", tag: "VP", tagColor: "bg-red-500" },
						{ text: "to get on well with others", tag: "Purpose", tagColor: "bg-purple-500" },
					],
					mainIdea: "Người nhóm máu A có xu hướng kìm nén cảm xúc để hòa hợp với người khác.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion:
						"Bài đọc nói Type A 'may suppress their own feelings to get on well with others'.",
					questionConclusion: "Đáp án B trùng khớp chính xác với nội dung trong bài đọc.",
					finalAnswer: "B",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 4,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [
					{
						phrase: "creative, passionate, and outgoing",
						color: "bg-green-200 dark:bg-green-800/50",
					},
				],
				badges: [
					{ text: "sáng tạo", color: "bg-green-500" },
					{ text: "đam mê", color: "bg-blue-500" },
				],
				comparisons: [
					{ left: "creative, passionate, outgoing", operator: "=", right: "Type B individuals" },
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "Which blood type is", tag: "S+V", tagColor: "bg-green-500" },
						{ text: "creative, passionate, and outgoing", tag: "Adj", tagColor: "bg-red-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["creative", "passionate", "outgoing"],
					locationHint: "Dựa vào các từ khóa → Tìm được ở đoạn (B) câu 3.",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote: "Type B individuals are seen as creative, passionate, and outgoing.",
					mainIdea: "Người nhóm máu B được mô tả là sáng tạo, đam mê và hướng ngoại.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Bài đọc mô tả Type B = creative, passionate, outgoing.",
					questionConclusion: "Đáp án A (Type B) là chính xác.",
					finalAnswer: "A",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 5,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [
					{ phrase: "rational", color: "bg-green-200 dark:bg-green-800/50" },
					{
						phrase: "deciphering complex situations",
						color: "bg-orange-200 dark:bg-orange-800/50",
					},
				],
				badges: [
					{ text: "lý trí", color: "bg-green-500" },
					{ text: "giải mã", color: "bg-orange-500" },
				],
				comparisons: [
					{ left: "rational and good at deciphering", operator: "=", right: "Type AB people" },
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "Which type is", tag: "S+V", tagColor: "bg-green-500" },
						{ text: "rational and good at deciphering", tag: "Adj", tagColor: "bg-red-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["rational", "deciphering", "complex situations"],
					locationHint: "Dựa vào từ khóa → Tìm được ở đoạn (B) câu 5.",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						"Type AB people are thought to be rational and good at deciphering complex situations.",
					mainIdea: "Người nhóm máu AB được cho là lý trí và giỏi xử lý tình huống phức tạp.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Bài đọc: Type AB = rational, good at deciphering complex situations.",
					questionConclusion: "Đáp án B (Type AB) là chính xác.",
					finalAnswer: "B",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 6,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [
					{ phrase: "get on well with people", color: "bg-green-200 dark:bg-green-800/50" },
				],
				badges: [{ text: "hòa đồng", color: "bg-green-500" }],
				comparisons: [
					{
						left: "get on well with people",
						operator: "=",
						right: "Type B - get on well with people",
					},
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "Which type", tag: "S", tagColor: "bg-green-500" },
						{
							text: "gets on well with people but can be selfish",
							tag: "VP",
							tagColor: "bg-red-500",
						},
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["get on well", "selfish"],
					locationHint: "Dựa vào từ khóa → Tìm được ở đoạn (B) câu 3-4.",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote: "They get on well with people but can sometimes be perceived as selfish.",
					mainIdea: "Type B hòa đồng nhưng đôi khi bị coi là ích kỷ.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Bài đọc: Type B 'get on well with people'.",
					questionConclusion: "Đáp án C (get on well with people) mô tả đặc điểm của Type B.",
					finalAnswer: "C",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 7,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [{ phrase: "deciphering", color: "bg-green-200 dark:bg-green-800/50" }],
				badges: [
					{ text: "giải mã", color: "bg-green-500" },
					{ text: "từ đồng nghĩa", color: "bg-blue-500" },
				],
				comparisons: [{ left: "deciphering", operator: "=", right: "cracking (giải mã, bẻ khóa)" }],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "The word 'deciphering'", tag: "S", tagColor: "bg-green-500" },
						{ text: "is closest in meaning to", tag: "V", tagColor: "bg-blue-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["deciphering"],
					locationHint: "Tìm từ 'deciphering' ở đoạn (B).",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						"Type AB people are thought to be rational and good at deciphering complex situations.",
					mainIdea: "Deciphering = giải mã, tìm hiểu, hiểu rõ → gần nghĩa nhất với 'cracking'.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Deciphering = to decode or figure out something complex.",
					questionConclusion: "D (cracking) = to solve or decode → đồng nghĩa.",
					finalAnswer: "D",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 8,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [{ phrase: "bura hara", color: "bg-green-200 dark:bg-green-800/50" }],
				badges: [{ text: "phân biệt đối xử", color: "bg-red-500" }],
				comparisons: [
					{ left: "bura hara", operator: "=", right: "discrimination based on blood type" },
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "The passage", tag: "S", tagColor: "bg-green-500" },
						{ text: "explains the meaning of 'bura hara'", tag: "VP", tagColor: "bg-red-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["bura hara", "discrimination"],
					locationHint: "Tìm 'bura hara' ở câu cuối đoạn (B).",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						'In Japan, discrimination based on blood type, called "bura hara," has become a social issue.',
					mainIdea: "Bài đọc giải thích 'bura hara' là phân biệt đối xử dựa trên nhóm máu ở Nhật.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Bài đọc có giải thích ý nghĩa của 'bura hara'.",
					questionConclusion: "Đáp án A là đúng — bài đọc giải thích 'bura hara'.",
					finalAnswer: "A",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 9,
			relevantParagraphIndex: 1,
			paraphrasing: {
				questionHighlights: [
					{ phrase: "unpopularity", color: "bg-orange-200 dark:bg-orange-800/50" },
				],
				badges: [
					{ text: "không phổ biến", color: "bg-red-500" },
					{ text: "sai thông tin", color: "bg-gray-500" },
				],
				comparisons: [
					{
						left: "unpopularity with people",
						operator: "><",
						right: "perceived as insensitive (not unpopular)",
					},
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "Their unpopularity", tag: "S", tagColor: "bg-green-500" },
						{ text: "makes them lonely", tag: "VP", tagColor: "bg-red-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["Type O", "insensitive", "unpopular"],
					locationHint: "Dựa vào ngữ cảnh Type O → Tìm ở đoạn (B).",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote: "However, they can be perceived as insensitive.",
					mainIdea:
						"Type O bị coi là vô tâm (insensitive), KHÔNG phải không được yêu thích (unpopular).",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion:
						"Bài đọc nói Type O 'perceived as insensitive' — không nói 'unpopular'.",
					questionConclusion:
						"B nói 'unpopularity makes them lonely' — thông tin sai, không có trong bài.",
					finalAnswer: "B",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
		{
			questionNumber: 10,
			relevantParagraphIndex: 0,
			paraphrasing: {
				questionHighlights: [{ phrase: "best title", color: "bg-green-200 dark:bg-green-800/50" }],
				badges: [{ text: "tiêu đề phù hợp", color: "bg-blue-500" }],
				comparisons: [
					{
						left: "What your blood type can tell you",
						operator: "=",
						right: "nội dung toàn bài: nhóm máu nói gì về tính cách",
					},
				],
			},
			steps: [
				{
					number: "01",
					title: "Read the question to understand (main idea + detail)",
					simplified: [
						{ text: "Which", tag: "Q", tagColor: "bg-green-500" },
						{ text: "is the best title for the passage", tag: "VP", tagColor: "bg-red-500" },
					],
				},
				{
					number: "02",
					title: "Locate relevant information",
					keywords: ["blood type", "personality", "main idea"],
					locationHint: "Cần đọc tổng quan toàn bài để xác định chủ đề chính.",
				},
				{
					number: "03",
					title: "Read relevant information to understand (main idea + detail)",
					quote:
						"In many Asian countries, people believe that blood types are associated with personality traits.",
					mainIdea: "Bài đọc nói về niềm tin rằng nhóm máu phản ánh tính cách con người.",
				},
				{
					number: "04",
					title: "Compare meaning with meaning",
					passageConclusion: "Bài đọc: nhóm máu gắn liền với tính cách, mô tả từng nhóm máu.",
					questionConclusion:
						"D: 'What your blood type can tell you' — phù hợp nhất với nội dung toàn bài.",
					finalAnswer: "D",
					finalAnswerColor: "bg-green-600",
				},
			],
		},
	],
}

// ═══════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════

function TagBadge({ text, color }: { text: string; color: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold text-white",
				color,
			)}
		>
			{text}
		</span>
	)
}

function WordBubble({ word }: { word: TaggedWord }) {
	return (
		<span className="inline-flex items-center gap-1">
			{word.tag && (
				<span
					className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold text-white", word.tagColor)}
				>
					{word.tag}
				</span>
			)}
			<span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs">
				{word.text}
			</span>
		</span>
	)
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
				checked ? "bg-primary" : "bg-muted",
			)}
		>
			<span
				className={cn(
					"pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform",
					checked ? "translate-x-4" : "translate-x-0",
				)}
			/>
		</button>
	)
}

// --- Paraphrasing Section ---

function ParaphrasingSection({
	explanation,
	question,
}: {
	explanation: QuestionExplanation
	question: ExamQuestion
}) {
	const { paraphrasing } = explanation

	// Highlight phrases in question text
	const renderQuestionText = () => {
		let text = question.questionText || `Câu ${question.questionNumber}`
		if (!question.questionText) {
			const opt = question.options[question.correctAnswer]
			text = opt || text
		}

		if (paraphrasing.questionHighlights.length === 0) return <span>{text}</span>

		const allOptions = Object.values(question.options)
		const selectedText = allOptions.find((_, i) => {
			const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i]
			return letter === question.correctAnswer
		})

		const displayText = question.questionText || selectedText || `Câu ${question.questionNumber}`

		const pattern = new RegExp(
			`(${paraphrasing.questionHighlights.map((h) => h.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
			"gi",
		)
		const parts = displayText.split(pattern)

		return (
			<>
				{parts.map((part, i) => {
					const match = paraphrasing.questionHighlights.find(
						(h) => h.phrase.toLowerCase() === part.toLowerCase(),
					)
					if (!match) return <span key={i}>{part}</span>
					return (
						<mark key={i} className={cn("rounded px-0.5", match.color)}>
							{part}
						</mark>
					)
				})}
			</>
		)
	}

	return (
		<div className="rounded-xl border bg-background p-4">
			<div className="mb-3 flex items-center gap-2 text-sm font-semibold">
				<HugeiconsIcon icon={SortingIcon} className="size-4 text-muted-foreground" />
				Paraphrasing
			</div>

			<div className="space-y-3 text-sm">
				<div>
					<span className="font-medium text-muted-foreground">Câu hỏi: </span>
					{renderQuestionText()}
				</div>

				<div>
					<p className="mb-2 font-medium text-muted-foreground">So sánh với bài đọc:</p>
					<div className="mb-2 flex flex-wrap gap-1.5">
						{paraphrasing.badges.map((badge, i) => (
							<TagBadge key={i} text={badge.text} color={badge.color} />
						))}
					</div>
					<ul className="space-y-1.5 pl-1">
						{paraphrasing.comparisons.map((comp, i) => (
							<li key={i} className="flex items-center gap-1.5 text-xs">
								<span className="inline-flex items-center rounded-full border px-2 py-0.5">
									{comp.left}
								</span>
								<span
									className={cn(
										"shrink-0 font-bold",
										comp.operator === "="
											? "text-green-600"
											: comp.operator === "><"
												? "text-red-600"
												: "text-amber-600",
									)}
								>
									{comp.operator === "=" ? "=" : comp.operator === "><" ? "><" : "→"}
								</span>
								<span className="inline-flex items-center rounded-full border px-2 py-0.5">
									{comp.right}
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	)
}

// --- Step-by-step Explanation ---

function StepByStepSection({ steps }: { steps: ExplanationStep[] }) {
	return (
		<div className="rounded-xl border bg-background p-4">
			<div className="mb-4 flex items-center gap-2 text-sm font-semibold">
				<HugeiconsIcon icon={SparklesIcon} className="size-4 text-muted-foreground" />
				Giải thích chi tiết
			</div>

			<div className="space-y-4">
				{steps.map((step, i) => (
					<div key={i}>
						{i > 0 && <hr className="mb-4 border-dashed" />}
						<div className="space-y-2.5">
							{/* Step header */}
							<div className="flex items-start gap-2">
								<HugeiconsIcon
									icon={CheckmarkCircle02Icon}
									className="mt-0.5 size-4 shrink-0 text-green-600"
								/>
								<p className="text-sm font-bold">
									Step {step.number}: {step.title}
								</p>
							</div>

							{/* Tags */}
							{step.tags && (
								<div className="flex flex-wrap gap-1.5 pl-6">
									{step.tags.map((tag, j) => (
										<TagBadge
											key={j}
											text={tag.tag || tag.text}
											color={tag.tagColor || "bg-gray-500"}
										/>
									))}
								</div>
							)}

							{/* Simplified sentence */}
							{step.simplified && (
								<div className="pl-6">
									<span className="text-xs font-medium text-muted-foreground">Simplified: </span>
									<div className="mt-1 flex flex-wrap items-center gap-1.5">
										{step.simplified.map((word, j) => (
											<WordBubble key={j} word={word} />
										))}
									</div>
								</div>
							)}

							{/* Keywords */}
							{step.keywords && (
								<div className="pl-6 text-sm">
									<span className="text-muted-foreground">• Từ khóa: </span>
									<span className="italic">{step.keywords.join(", ")}</span>
								</div>
							)}

							{/* Location hint */}
							{step.locationHint && (
								<div className="pl-6 text-sm">
									<span className="text-muted-foreground">→ </span>
									{step.locationHint}
								</div>
							)}

							{/* Quote */}
							{step.quote && (
								<div className="pl-6">
									<div className="flex items-start gap-1.5 text-sm">
										<HugeiconsIcon
											icon={QuoteDownIcon}
											className="mt-0.5 size-3.5 shrink-0 text-amber-500"
										/>
										<p className="italic text-muted-foreground">"{step.quote}"</p>
									</div>
								</div>
							)}

							{/* Main idea */}
							{step.mainIdea && (
								<div className="pl-6 text-sm">
									<span className="font-medium">Main idea: </span>
									<span className="text-primary">{step.mainIdea}</span>
								</div>
							)}

							{/* Step 04: Comparison */}
							{step.passageConclusion && (
								<div className="space-y-1.5 pl-6 text-sm">
									<div>
										<span className="text-muted-foreground">• Trong bài đọc: </span>
										{step.passageConclusion}
									</div>
									{step.questionConclusion && (
										<div>
											<span className="text-muted-foreground">• Trong câu hỏi: </span>
											{step.questionConclusion}
										</div>
									)}
									{step.finalAnswer && (
										<div className="mt-2 flex items-center gap-2">
											<span className="text-muted-foreground">⇒</span>
											<span className="font-medium">Chọn:</span>
											<span
												className={cn(
													"rounded-md px-2.5 py-0.5 text-xs font-bold text-white",
													step.finalAnswerColor || "bg-green-600",
												)}
											>
												{step.finalAnswer}
											</span>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

interface ReadingAnswerDetailProps {
	examId: string
	questions: ExamQuestion[]
	answers: Record<number, string>
	onHighlightParagraph: (index: number | null) => void
	summaryOverride?: {
		score?: number | null
		correct?: number | null
		total?: number | null
	}
}

export function ReadingAnswerDetail({
	examId,
	questions,
	answers,
	onHighlightParagraph,
	summaryOverride,
}: ReadingAnswerDetailProps) {
	const [currentQIdx, setCurrentQIdx] = useState(0)
	const [viewMode, setViewMode] = useState<"brief" | "detailed">("detailed")
	const [showLocator, setShowLocator] = useState(false)

	const explanations = MOCK_EXPLANATIONS[examId] ?? []
	const currentQ = questions[currentQIdx]
	if (!currentQ) return null

	const currentExplanation = explanations.find((e) => e.questionNumber === currentQ.questionNumber)
	const correct =
		summaryOverride?.correct ??
		questions.filter((q) => answers[q.questionNumber] === q.correctAnswer).length
	const totalQuestions = summaryOverride?.total ?? questions.length
	const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0
	const userAnswer = answers[currentQ.questionNumber]
	const isCorrectAnswer = userAnswer === currentQ.correctAnswer

	const handleLocatorToggle = (v: boolean) => {
		setShowLocator(v)
		if (v && currentExplanation) {
			onHighlightParagraph(currentExplanation.relevantParagraphIndex)
		} else {
			onHighlightParagraph(null)
		}
	}

	const handleQuestionChange = (idx: number) => {
		setCurrentQIdx(idx)
		const exp = explanations.find((e) => e.questionNumber === questions[idx]?.questionNumber)
		if (showLocator && exp) {
			onHighlightParagraph(exp.relevantParagraphIndex)
		}
	}

	return (
		<div className="flex h-full flex-col">
			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto">
				<div className="space-y-4 p-4">
					{/* Results summary */}
					<div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-semibold">Kết quả</p>
								{summaryOverride?.score !== undefined ? (
									<>
										<p className="mt-0.5 text-xs text-muted-foreground">Điểm từ API hiện tại</p>
										<p className="mt-1 text-2xl font-bold text-green-600">
											{summaryOverride.score !== null
												? `${summaryOverride.score.toFixed(1)}/10`
												: "--"}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Mock review bên dưới, score là dữ liệu thật.
										</p>
									</>
								) : (
									<p className="mt-0.5 text-xs text-muted-foreground">
										Bạn trả lời đúng{" "}
										<span className="font-semibold text-green-600">
											{correct}/{totalQuestions}
										</span>{" "}
										câu
									</p>
								)}
							</div>
							<span className="text-2xl font-bold text-green-600">{percentage}%</span>
						</div>
						<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-green-500 transition-all"
								style={{
									width: `${totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0}%`,
								}}
							/>
						</div>
					</div>

					{/* Current question display */}
					<div className="rounded-xl border p-4">
						<p className="mb-3 text-sm font-semibold">
							<span
								className={cn(
									"mr-2 inline-flex size-6 items-center justify-center rounded-lg text-xs font-bold text-white",
									isCorrectAnswer ? "bg-green-500" : "bg-red-500",
								)}
							>
								{currentQ.questionNumber}
							</span>
							{currentQ.questionText || `Câu ${currentQ.questionNumber}`}
						</p>

						<div className="space-y-1.5">
							{Object.entries(currentQ.options).map(([letter, text]) => {
								const isCorrect = letter === currentQ.correctAnswer
								const isUserWrong = letter === userAnswer && !isCorrect

								let cls = "border bg-background text-foreground"
								if (isCorrect)
									cls =
										"border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
								if (isUserWrong)
									cls = "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"

								return (
									<div
										key={letter}
										className={cn(
											"flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
											cls,
										)}
									>
										<span
											className={cn(
												"flex size-5 shrink-0 items-center justify-center rounded text-[11px] font-bold text-white",
												isCorrect
													? "bg-green-500"
													: isUserWrong
														? "bg-red-500"
														: "bg-muted text-muted-foreground",
											)}
										>
											{letter}
										</span>
										<span className="text-xs">{text}</span>
										{isCorrect && (
											<HugeiconsIcon
												icon={CheckmarkCircle02Icon}
												className="ml-auto size-4 text-green-500"
											/>
										)}
									</div>
								)
							})}
						</div>
					</div>

					{/* Tab bar: Ngắn gọn / Chi tiết + Định vị toggle */}
					<div className="flex items-center justify-between rounded-xl border bg-muted/30 p-1">
						<div className="flex gap-1">
							<button
								type="button"
								onClick={() => setViewMode("brief")}
								className={cn(
									"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
									viewMode === "brief"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<HugeiconsIcon icon={MagicWand01Icon} className="size-3.5" />
								Ngắn gọn
							</button>
							<button
								type="button"
								onClick={() => setViewMode("detailed")}
								className={cn(
									"flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
									viewMode === "detailed"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<HugeiconsIcon icon={Csv01Icon} className="size-3.5" />
								Chi tiết
							</button>
						</div>
						<div className="flex items-center gap-1.5 pr-1">
							<span className="text-xs text-muted-foreground">Định vị</span>
							<ToggleSwitch checked={showLocator} onChange={handleLocatorToggle} />
						</div>
					</div>

					{/* Explanation content */}
					{currentExplanation && (
						<>
							{/* Paraphrasing */}
							<ParaphrasingSection explanation={currentExplanation} question={currentQ} />

							{/* Step-by-step (only in detailed mode) */}
							{viewMode === "detailed" && <StepByStepSection steps={currentExplanation.steps} />}
						</>
					)}

					{/* Fallback when no explanation data */}
					{!currentExplanation && (
						<div className="rounded-xl border border-dashed p-6 text-center">
							<HugeiconsIcon
								icon={Search01Icon}
								className="mx-auto mb-2 size-8 text-muted-foreground/50"
							/>
							<p className="text-sm text-muted-foreground">
								Chưa có dữ liệu giải thích cho câu hỏi này.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Question number navigation */}
			<div className="shrink-0 border-t bg-background px-3 py-2.5">
				<div className="flex flex-wrap justify-center gap-1.5">
					{questions.map((q, i) => {
						const isCurrent = i === currentQIdx
						const isCorrect = answers[q.questionNumber] === q.correctAnswer
						const isAnswered = answers[q.questionNumber] != null

						return (
							<button
								key={q.questionNumber}
								type="button"
								onClick={() => handleQuestionChange(i)}
								className={cn(
									"flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all",
									isCurrent ? "ring-2 ring-primary ring-offset-1" : "",
									isAnswered
										? isCorrect
											? "border border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
											: "border border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
										: "border bg-background text-muted-foreground",
								)}
							>
								{q.questionNumber}
							</button>
						)
					})}
				</div>
			</div>
		</div>
	)
}
