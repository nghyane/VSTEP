import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { SegmentedTabs } from "#/components/SegmentedTabs"
import { ExamCard, type ExamCardState } from "#/features/exam/components/ExamCard"
import { appConfigQuery, examsQuery, mySessionsQuery } from "#/features/exam/queries"
import type { SkillKey } from "#/features/exam/types"
import { avgSkillScores, normalizeVi } from "#/lib/utils"

type StatusFilter = "all" | "not-started" | "in-progress" | "submitted"

export const Route = createFileRoute("/_app/thi-thu/")({
	validateSearch: (s: Record<string, unknown>): { q?: string; status?: StatusFilter } => {
		const out: { q?: string; status?: StatusFilter } = {}
		if (typeof s.q === "string" && s.q.length > 0) out.q = s.q
		if (s.status === "not-started" || s.status === "in-progress" || s.status === "submitted")
			out.status = s.status
		return out
	},
	loader: ({ context: { queryClient } }) =>
		Promise.all([
			queryClient.ensureQueryData(examsQuery),
			queryClient.ensureQueryData(appConfigQuery),
			queryClient.ensureQueryData(mySessionsQuery),
		]),
	component: ThiThuPage,
})

function ThiThuPage() {
	return (
		<>
			<Header title="Thư viện đề thi" />
			<div className="px-10 pb-12">
				<Suspense fallback={<Loading />}>
					<ExamListContent />
				</Suspense>
			</div>
		</>
	)
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
	{ value: "all", label: "Tất cả" },
	{ value: "not-started", label: "Chưa làm" },
	{ value: "in-progress", label: "Đang làm dở" },
	{ value: "submitted", label: "Đã nộp" },
]

function EmptyExams({
	variant,
	onReset,
}: {
	variant: "no-data" | "no-match" | "no-submitted"
	onReset?: () => void
}) {
	const v = useMemo(() => {
		switch (variant) {
			case "no-data":
				return {
					mascot: "/mascot/lac-sad.png",
					alt: "Lạc buồn vì chưa có đề thi",
					title: "Chưa có đề thi nào",
					message: "Đề thi sẽ xuất hiện tại đây ngay khi sẵn sàng. Quay lại sau nha!",
				}
			case "no-match":
				return {
					mascot: "/mascot/lac-think.png",
					alt: "Lạc đang tìm đề thi",
					title: "Không tìm thấy đề thi phù hợp",
					message: "Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác nhé!",
				}
			case "no-submitted":
				return {
					mascot: "/mascot/lac-think.png",
					alt: "Lạc khích lệ thi đề đầu tiên",
					title: "Bạn chưa nộp đề nào",
					message: "Hãy bắt đầu lượt thi đầu tiên để theo dõi tiến độ.",
				}
		}
	}, [variant])

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<img src={v.mascot} alt={v.alt} width={144} height={144} className="object-contain mb-1" />
			<h3 className="font-extrabold text-xl text-foreground mb-2">{v.title}</h3>
			<p className="text-sm text-muted max-w-sm mb-6">{v.message}</p>
			{variant === "no-match" && onReset && (
				<button type="button" onClick={onReset} className="btn btn-primary px-6 py-2.5 text-sm">
					Xóa bộ lọc
				</button>
			)}
		</div>
	)
}

function ExamListContent() {
	const { q, status } = Route.useSearch()
	const navigate = useNavigate({ from: "/thi-thu" })

	const { data: examsData } = useSuspenseQuery(examsQuery)
	const { data: configData } = useSuspenseQuery(appConfigQuery)
	const { data: mySessionsData } = useSuspenseQuery(mySessionsQuery)

	const exams = examsData.data
	const fullTestCoinCost = configData.data.pricing.exam.full_test_cost_coins

	// Local input value (type mượt), debounced commit to URL
	const [localQ, setLocalQ] = useState(q ?? "")
	const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	const commitQ = useCallback(
		(next: string) => {
			setLocalQ(next)
			clearTimeout(debounceRef.current)
			debounceRef.current = setTimeout(() => {
				navigate({
					search: () => {
						const nextQ = next.length > 0 ? next : undefined
						const s: { q?: string; status?: StatusFilter } = {}
						if (nextQ) s.q = nextQ
						if (status) s.status = status
						return s as never
					},
					replace: true,
				})
			}, 250)
		},
		[navigate, status],
	)
	// Sync URL → local when external change (e.g. reset)
	useEffect(() => {
		if (q !== undefined && q !== localQ) setLocalQ(q)
	}, [q, localQ])

	function clearQ() {
		commitQ("")
	}

	const currentStatus = status ?? "all"
	const setStatus = (next: StatusFilter) => {
		navigate({
			search: () => {
				const s: { q?: string; status?: StatusFilter } = {}
				if (q) s.q = q
				if (next !== "all") s.status = next
				return s as never
			},
			replace: true,
		})
	}

	const cardStateByExamId = useMemo(() => {
		const map = new Map<string, ExamCardState>()
		const sessions = mySessionsData.data
		const now = Date.now()
		const terminal = sessions.filter(
			(s) =>
				s.exam_id && (s.status === "submitted" || s.status === "graded" || s.status === "auto_submitted"),
		)

		// Group terminal sessions by exam_id, sorted newest first
		const terminalByExam = new Map<
			string,
			Array<{ id: string; submittedAt: string | null; scores: Record<SkillKey, number | null> | null }>
		>()
		for (const s of terminal) {
			if (!s.exam_id) continue
			const eid = s.exam_id
			const group = terminalByExam.get(eid) ?? []
			group.push({ id: s.id, submittedAt: s.submitted_at, scores: s.scores })
			terminalByExam.set(eid, group)
		}

		for (const s of sessions) {
			if (!s.exam_id) continue

			// Active session (not expired) — highest priority
			if (s.status === "active" && new Date(s.server_deadline_at).getTime() > now) {
				if (!map.has(s.exam_id)) {
					map.set(s.exam_id, {
						status: "in-progress",
						sessionId: s.id,
						selectedSkills: s.selected_skills,
					})
				}
				continue
			}

			// Terminal — only set if no active
			if (!map.has(s.exam_id) && terminalByExam.has(s.exam_id)) {
				const group = terminalByExam.get(s.exam_id)
				if (!group) continue
				group.sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime())
				map.set(s.exam_id, {
					status: "submitted",
					latestScore: avgSkillScores(group[0].scores),
					sessionCount: group.length,
				})
			}
		}
		return map
	}, [mySessionsData])

	const filtered = useMemo(
		() =>
			exams.filter((e) => {
				if (q) {
					const needle = normalizeVi(q)
					if (!normalizeVi(e.title).includes(needle)) return false
				}
				if (currentStatus !== "all") {
					const s = cardStateByExamId.get(e.id)?.status ?? "not-started"
					if (s !== currentStatus) return false
				}
				return true
			}),
		[exams, q, currentStatus, cardStateByExamId],
	)

	function pickEmptyVariant(): "no-data" | "no-match" | "no-submitted" {
		if (exams.length === 0) return "no-data"
		if (currentStatus === "submitted" && !(q !== undefined && q.length > 0)) return "no-submitted"
		return "no-match"
	}

	function resetFilters() {
		setLocalQ("")
		navigate({ search: () => ({}) as never, replace: true })
	}

	// Count per tab
	const tabCounts = useMemo(() => {
		const c: Record<StatusFilter, number> = {
			all: exams.length,
			"not-started": 0,
			"in-progress": 0,
			submitted: 0,
		}
		for (const e of exams) {
			const kind = cardStateByExamId.get(e.id)?.status ?? "not-started"
			c[kind]++
		}
		return c
	}, [exams, cardStateByExamId])
	const tabItems = STATUS_TABS.map((t) => ({ ...t, count: tabCounts[t.value] }))

	return (
		<div className="space-y-8">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<div className="relative w-full sm:w-56">
					<Icon
						name="search"
						size="xs"
						className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder pointer-events-none"
					/>
					<input
						type="search"
						value={localQ}
						onChange={(e) => commitQ(e.target.value)}
						placeholder="Tìm tên đề thi..."
						className="w-full rounded-(--radius-button) border-2 border-border bg-surface py-2 pl-9 pr-9 text-sm outline-none focus:border-border-focus transition-colors"
					/>
					{localQ && (
						<button
							type="button"
							onClick={clearQ}
							aria-label="Xóa tìm kiếm"
							className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-6 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground transition-colors"
						>
							<Icon name="close" size="xs" />
						</button>
					)}
				</div>

				{/* Divider */}
				<div className="w-px h-6 bg-border hidden sm:block" />

				<SegmentedTabs items={tabItems} value={currentStatus} onChange={setStatus} />
			</div>

			{/* Count */}
			<p className="text-sm text-subtle">{filtered.length} đề thi</p>

			{/* Grid */}
			{filtered.length === 0 ? (
				<EmptyExams variant={pickEmptyVariant()} onReset={resetFilters} />
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filtered.map((exam) => (
						<ExamCard
							key={exam.id}
							exam={exam}
							coinCost={fullTestCoinCost}
							state={cardStateByExamId.get(exam.id) ?? { status: "not-started" }}
						/>
					))}
				</div>
			)}
		</div>
	)
}
