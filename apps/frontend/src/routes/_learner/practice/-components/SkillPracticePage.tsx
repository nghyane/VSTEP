import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePracticeQuestions } from "@/hooks/use-practice"
import { cn } from "@/lib/utils"
import { skillColor, skillMeta } from "@/routes/_learner/exams/-components/skill-meta"
import type {
	ListeningContent,
	Question,
	QuestionContent,
	ReadingContent,
	ReadingGapFillContent,
	ReadingMatchingContent,
	Skill,
	SpeakingPart1Content,
	SpeakingPart2Content,
	SpeakingPart3Content,
	WritingContent,
} from "@/types/api"

// ═══════════════════════════════════════════════════
// Skill-specific helpers for category & card display
// ═══════════════════════════════════════════════════

const PART_LABELS: Record<Skill, Record<number, string>> = {
	listening: { 1: "Nghe hiểu ngắn", 2: "Nghe hiểu hội thoại", 3: "Nghe hiểu bài giảng" },
	reading: {
		1: "Đọc hiểu cơ bản",
		2: "Đọc hiểu suy luận",
		3: "Điền từ / Nối đoạn",
		4: "Đọc hiểu nâng cao",
	},
	writing: { 1: "Viết thư", 2: "Bài luận" },
	speaking: { 1: "Giao tiếp xã hội", 2: "Thảo luận giải pháp", 3: "Phát triển chủ đề" },
}

const WRITING_TASK_LABELS: Record<string, string> = {
	letter: "Thư",
	essay: "Bài luận",
}

function getCategory(q: Question, skill: Skill): string {
	if (skill === "writing") {
		const c = q.content as WritingContent
		return WRITING_TASK_LABELS[c.taskType] ?? `Part ${q.part}`
	}
	return PART_LABELS[skill]?.[q.part] ?? `Part ${q.part}`
}

function getBadge(q: Question, skill: Skill): string {
	if (skill === "writing") {
		const c = q.content as WritingContent
		return WRITING_TASK_LABELS[c.taskType] ?? `Part ${q.part}`
	}
	return `Part ${q.part}`
}

function getItemCount(q: Question, skill: Skill): string {
	if (skill === "listening") {
		const c = q.content as ListeningContent
		return `${c.items?.length ?? 0} câu`
	}
	if (skill === "reading") {
		const c = q.content as ReadingContent | ReadingGapFillContent | ReadingMatchingContent
		const items = "items" in c ? c.items : "paragraphs" in c ? c.paragraphs : []
		return `${items?.length ?? 0} câu`
	}
	if (skill === "speaking") {
		const c = q.content as QuestionContent
		if ("topics" in c) return `${(c as SpeakingPart1Content).topics.length} chủ đề`
		if ("options" in c) return `${(c as SpeakingPart2Content).options.length} lựa chọn`
		if ("suggestions" in c) return `${(c as SpeakingPart3Content).suggestions.length} gợi ý`
		return "1 đề"
	}
	return "1 đề"
}

function getDescription(q: Question, skill: Skill): string {
	if (skill === "writing") {
		const c = q.content as WritingContent
		return c.minWords ? `Tối thiểu ${c.minWords} từ` : ""
	}
	if (skill === "speaking") {
		const c = q.content as QuestionContent
		const secs =
			"speakingSeconds" in c
				? (c as SpeakingPart2Content | SpeakingPart3Content).speakingSeconds
				: null
		if (secs) {
			return secs >= 60 ? `${Math.floor(secs / 60)} phút nói` : `${secs}s nói`
		}
		return ""
	}
	return ""
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

export function SkillPracticePage({ skill }: { skill: Skill }) {
	const { data, isLoading, isError, error } = usePracticeQuestions({ skill })
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

	const questions = data?.data ?? []
	const readingEntries = useMemo(() => {
		if (skill !== "reading") return []

		return categoriesFromQuestions(questions, skill).map(([category, count]) => {
			const sample = questions.find((q) => getCategory(q, skill) === category)
			const levels = [
				...new Set(questions.filter((q) => q.part === sample?.part).map((q) => q.level)),
			]

			return {
				key: category,
				title: category,
				badge: `Part ${sample?.part ?? 1}`,
				description: `${count} bài đọc trong ngân hàng câu hỏi`,
				meta: levels.join(" · "),
				part: sample?.part ?? 1,
			}
		})
	}, [questions, skill])

	const categories = useMemo(() => {
		return categoriesFromQuestions(questions, skill)
	}, [questions, skill])

	const filtered = selectedCategory
		? questions.filter((q) => getCategory(q, skill) === selectedCategory)
		: questions
	const filteredReadingEntries = selectedCategory
		? readingEntries.filter((entry) => entry.key === selectedCategory)
		: readingEntries

	if (isLoading) {
		return (
			<div className="space-y-6">
				<PageHeader skill={skill} count={null} />
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-36 rounded-xl" />
					))}
				</div>
			</div>
		)
	}

	if (isError) {
		return (
			<div className="space-y-6">
				<PageHeader skill={skill} count={0} />
				<p className="py-10 text-center text-destructive">{error.message}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PageHeader skill={skill} count={questions.length} />

			<div className="flex flex-col gap-6 lg:flex-row">
				<TopicSidebar
					topics={categories}
					totalCount={questions.length}
					selectedTopic={selectedCategory}
					onSelect={setSelectedCategory}
				/>

				<div className="flex-1">
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{skill === "reading"
							? filteredReadingEntries.map((entry) => (
									<ReadingPracticeCard
										key={entry.key}
										title={entry.title}
										badge={entry.badge}
										description={entry.description}
										meta={entry.meta}
										part={entry.part}
									/>
								))
							: filtered.map((question) => (
									<QuestionCard key={question.id} question={question} skill={skill} />
								))}

						{((skill === "reading" && filteredReadingEntries.length === 0) ||
							(skill !== "reading" && filtered.length === 0)) && (
							<div className="col-span-full py-8 text-center text-sm text-muted-foreground">
								Không có bài luyện tập nào cho chủ đề này.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function categoriesFromQuestions(questions: Question[], skill: Skill): [string, number][] {
	const seen = new Map<string, number>()
	for (const q of questions) {
		const cat = getCategory(q, skill)
		seen.set(cat, (seen.get(cat) ?? 0) + 1)
	}
	return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b))
}

// ─── Question card ──────────────────────────────────

function QuestionCard({ question, skill }: { question: Question; skill: Skill }) {
	const title = question.topic ?? `${skillMeta[skill].label} Part ${question.part}`
	const badge = getBadge(question, skill)
	const itemCount = getItemCount(question, skill)
	const desc = getDescription(question, skill)

	return (
		<div className="flex flex-col gap-3 rounded-xl bg-muted/30 p-5 transition-colors hover:bg-muted/50">
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-semibold leading-snug">{title}</span>
				<span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
					{badge}
				</span>
			</div>
			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				<span>{itemCount}</span>
				{desc && <span>{desc}</span>}
				{question.level && <span>{question.level}</span>}
			</div>
			<Button size="sm" className="mt-auto w-full rounded-xl" asChild>
				<Link to="/exercise" search={{ skill, id: question.id, part: "", level: "", session: "" }}>
					Luyện tập ngay
				</Link>
			</Button>
		</div>
	)
}

function ReadingPracticeCard({
	title,
	badge,
	description,
	meta,
	part,
}: {
	title: string
	badge: string
	description: string
	meta: string
	part: number
}) {
	return (
		<div className="flex flex-col gap-3 rounded-xl bg-muted/30 p-5 transition-colors hover:bg-muted/50">
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-semibold leading-snug">{title}</span>
				<span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
					{badge}
				</span>
			</div>
			<div className="space-y-1 text-xs text-muted-foreground">
				<p>{description}</p>
				{meta && <p>{meta}</p>}
			</div>
			<Button size="sm" className="mt-auto w-full rounded-xl" asChild>
				<Link
					to="/exercise"
					search={{ skill: "reading", id: "", part: String(part), level: "", session: "" }}
				>
					Luyện tập ngay
				</Link>
			</Button>
		</div>
	)
}

// ─── Shared components ──────────────────────────────

function PageHeader({ skill, count }: { skill: Skill; count: number | null }) {
	const meta = skillMeta[skill]

	return (
		<div className="flex items-center gap-3">
			<Button variant="ghost" size="icon" className="size-8" asChild>
				<Link to="/practice">
					<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
				</Link>
			</Button>
			<div className={cn("flex size-10 items-center justify-center rounded-xl", skillColor[skill])}>
				<HugeiconsIcon icon={meta.icon} className="size-5" />
			</div>
			<div>
				<h1 className="text-xl font-bold">{meta.label}</h1>
				<p className="text-sm text-muted-foreground">
					{count !== null ? `${count} bài luyện tập` : "Đang tải..."}
				</p>
			</div>
		</div>
	)
}

function TopicSidebar({
	topics,
	totalCount,
	selectedTopic,
	onSelect,
}: {
	topics: [string, number][]
	totalCount: number
	selectedTopic: string | null
	onSelect: (topic: string | null) => void
}) {
	return (
		<div className="shrink-0 lg:w-[220px]">
			<p className="mb-2 text-sm font-semibold">Chủ đề</p>

			{/* Mobile: horizontal scroll */}
			<div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
				<button
					type="button"
					className={cn(
						"shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
						selectedTopic === null
							? "bg-foreground text-background"
							: "bg-muted/50 text-muted-foreground hover:bg-muted",
					)}
					onClick={() => onSelect(null)}
				>
					Tất cả ({totalCount})
				</button>
				{topics.map(([topic, count]) => (
					<button
						key={topic}
						type="button"
						className={cn(
							"shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
							selectedTopic === topic
								? "bg-foreground text-background"
								: "bg-muted/50 text-muted-foreground hover:bg-muted",
						)}
						onClick={() => onSelect(topic)}
					>
						{topic} ({count})
					</button>
				))}
			</div>

			{/* Desktop: vertical list */}
			<nav className="hidden space-y-1 lg:block">
				<button
					type="button"
					className={cn(
						"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
						selectedTopic === null
							? "bg-muted/50 font-semibold text-foreground"
							: "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
					)}
					onClick={() => onSelect(null)}
				>
					<span>Tất cả</span>
					<span className="text-xs text-muted-foreground">{totalCount}</span>
				</button>
				{topics.map(([topic, count]) => (
					<button
						key={topic}
						type="button"
						className={cn(
							"flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
							selectedTopic === topic
								? "bg-muted/50 font-semibold text-foreground"
								: "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
						)}
						onClick={() => onSelect(topic)}
					>
						<span>{topic}</span>
						<span className="text-xs text-muted-foreground">{count}</span>
					</button>
				))}
			</nav>
		</div>
	)
}
