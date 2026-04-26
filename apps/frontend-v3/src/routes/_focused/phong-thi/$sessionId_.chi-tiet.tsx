import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense } from "react"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ResultBackground } from "#/features/exam/components/ResultBackground"
import { examDetailQuery, examSessionQuery, sessionResultsQuery } from "#/features/exam/queries"
import type { ExamVersionListeningSection, ExamVersionMcqItem, McqDetailItem } from "#/features/exam/types"
import { cn } from "#/lib/utils"

interface Search {
	examId: string
}

export const Route = createFileRoute("/_focused/phong-thi/$sessionId_/chi-tiet")({
	validateSearch: (search: Record<string, unknown>): Search => ({
		examId: typeof search.examId === "string" ? search.examId : "",
	}),
	component: ChiTietPage,
})

function ChiTietPage() {
	return (
		<Suspense fallback={<Loading />}>
			<ChiTietInner />
		</Suspense>
	)
}

function ChiTietInner() {
	const { sessionId } = Route.useParams()
	const { examId } = Route.useSearch()
	const { data: resultsRes } = useSuspenseQuery(sessionResultsQuery(sessionId))
	const { data: examRes } = useSuspenseQuery(examDetailQuery(examId))
	const { data: sessionRes } = useSuspenseQuery(examSessionQuery(sessionId))

	const { exam, version } = examRes.data
	const mcqDetail = resultsRes.data.mcq_detail
	const selected = sessionRes.data.selected_skills

	const detailMap = new Map<string, McqDetailItem>()
	for (const d of mcqDetail) detailMap.set(d.item_ref_id, d)

	const { score: totalCorrect, total: totalQuestions } = resultsRes.data.mcq
	const scoreOn10 = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 10 : 0

	// BE trả sections không sort — sort theo part ASC rồi display_order ASC để hiển thị
	// đúng thứ tự đề (Part 1 hết, Part 2 hết, ...). Không sort lệch theo creation time.
	const listeningBlocks = selected.includes("listening")
		? [...version.listening_sections].sort((a, b) => a.part - b.part || a.display_order - b.display_order)
		: []
	const readingBlocks = selected.includes("reading")
		? [...version.reading_passages].sort((a, b) => a.part - b.part || a.display_order - b.display_order)
		: []

	return (
		<div className="relative min-h-screen">
			<ResultBackground />

			{/* Back link top-left */}
			<div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
				<Link
					to="/phong-thi/$sessionId"
					params={{ sessionId }}
					search={{ examId }}
					className="inline-flex items-center gap-2 rounded-full border-2 border-b-4 border-white/50 bg-white/25 px-4 py-2 text-sm font-extrabold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/35 active:translate-y-0 active:border-b-2"
				>
					<Icon name="back" size="xs" className="text-white" />
					Kết quả
				</Link>
			</div>

			<div className="relative z-10 flex w-full flex-col items-center px-4 py-14 sm:py-16">
				<h1 className="mb-5 text-xl font-extrabold text-white drop-shadow-sm">Chi tiết đáp án</h1>

				<div className="w-full max-w-4xl overflow-hidden rounded-(--radius-banner) border-2 border-b-4 border-white/20 bg-white shadow-2xl">
					{/* Header */}
					<div className="border-b-2 border-border-light px-6 py-5 sm:px-8 sm:py-6">
						<p className="text-xs font-extrabold uppercase tracking-widest text-subtle">{exam.title}</p>
						<div className="mt-1 flex items-baseline gap-3">
							<span className="text-4xl font-extrabold tabular-nums text-foreground">
								{scoreOn10.toFixed(1)}
							</span>
							<span className="text-sm text-muted">
								điểm ·{" "}
								<span className="font-bold text-foreground tabular-nums">
									{totalCorrect}/{totalQuestions}
								</span>{" "}
								câu đúng
							</span>
						</div>
					</div>

					{/* Sections */}
					<div className="divide-y-2 divide-border-light">
						{groupListeningByPart(listeningBlocks).map((group) => (
							<SectionBlock
								key={`listening-${group.part}`}
								title={`Nghe · Part ${group.part}`}
								items={group.items}
								detailMap={detailMap}
							/>
						))}
						{readingBlocks.map((p) => (
							<SectionBlock key={p.id} title={`Đọc · ${p.title}`} items={p.items} detailMap={detailMap} />
						))}
					</div>

					{totalQuestions === 0 && (
						<div className="px-6 py-10 text-center text-sm text-muted">
							Bài thi này không có phần trắc nghiệm.
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function SectionBlock({
	title,
	items,
	detailMap,
}: {
	title: string
	items: ExamVersionMcqItem[]
	detailMap: Map<string, McqDetailItem>
}) {
	const sorted = [...items].sort((a, b) => a.display_order - b.display_order)
	const correct = sorted.reduce((n, it) => n + (detailMap.get(it.id)?.is_correct ? 1 : 0), 0)
	return (
		<div className="px-6 py-5 sm:px-8">
			<div className="mb-4 flex items-center justify-between">
				<p className="text-base font-extrabold text-foreground">{title}</p>
				<span className="text-sm tabular-nums text-subtle">
					<span className="font-bold text-foreground">{correct}</span>/{sorted.length} đúng
				</span>
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{sorted.map((item, idx) => (
					<ItemRow key={item.id} no={idx + 1} detail={detailMap.get(item.id) ?? null} />
				))}
			</div>
		</div>
	)
}

const LETTER = ["A", "B", "C", "D"] as const

/** VSTEP Part 1 = 8 announcements × 1 item — 8 sections riêng nhìn vụn vặt.
 * Gộp section cùng `part` thành 1 block, sort items theo (section.display_order, item.display_order). */
function groupListeningByPart(
	sections: ExamVersionListeningSection[],
): Array<{ part: number; items: ExamVersionMcqItem[] }> {
	const byPart = new Map<number, ExamVersionListeningSection[]>()
	for (const sec of sections) {
		const arr = byPart.get(sec.part) ?? []
		arr.push(sec)
		byPart.set(sec.part, arr)
	}
	const result: Array<{ part: number; items: ExamVersionMcqItem[] }> = []
	for (const [part, secs] of [...byPart.entries()].sort((a, b) => a[0] - b[0])) {
		const sortedSecs = [...secs].sort((a, b) => a.display_order - b.display_order)
		const items: ExamVersionMcqItem[] = []
		for (const sec of sortedSecs) {
			const sortedItems = [...sec.items].sort((a, b) => a.display_order - b.display_order)
			items.push(...sortedItems)
		}
		result.push({ part, items })
	}
	return result
}

function ItemRow({ no, detail }: { no: number; detail: McqDetailItem | null }) {
	const correct = detail?.is_correct ?? false
	const answered = detail?.selected_index !== null && detail?.selected_index !== undefined
	const userLetter = detail && answered ? LETTER[detail.selected_index as 0 | 1 | 2 | 3] : "—"
	const correctLetter = detail ? LETTER[detail.correct_index as 0 | 1 | 2 | 3] : "—"

	return (
		<div
			className={cn(
				"flex items-center gap-2 rounded-(--radius-button) border-2 px-3 py-2.5 text-sm",
				correct
					? "border-primary/30 bg-primary-tint"
					: answered
						? "border-destructive/30 bg-destructive-tint"
						: "border-border bg-background",
			)}
		>
			{correct ? (
				<Icon name="check" size="xs" className="text-primary" />
			) : (
				<Icon name="close" size="xs" className={answered ? "text-destructive" : "text-subtle"} />
			)}

			<span className="font-bold text-foreground">Câu {no}</span>

			<div className="ml-auto flex items-center gap-1.5">
				<LetterBadge letter={userLetter} tone={!answered ? "muted" : correct ? "success" : "danger"} />
				{!correct && (
					<>
						<span className="text-xs text-subtle">→</span>
						<LetterBadge letter={correctLetter} tone="success" />
					</>
				)}
			</div>
		</div>
	)
}

function LetterBadge({ letter, tone }: { letter: string; tone: "success" | "danger" | "muted" }) {
	const cls =
		tone === "success"
			? "border-primary/40 bg-primary/10 text-primary"
			: tone === "danger"
				? "border-destructive/40 bg-destructive/10 text-destructive"
				: "border-border bg-background text-subtle"
	return (
		<span
			className={cn(
				"inline-flex size-6 items-center justify-center rounded-full border-2 text-xs font-extrabold tabular-nums",
				cls,
			)}
		>
			{letter}
		</span>
	)
}
