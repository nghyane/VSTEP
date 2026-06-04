import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { SegmentedTabs } from "#/components/SegmentedTabs"
import { ExamCard } from "#/features/exam/components/ExamCard"
import { appConfigQuery, examsQuery } from "#/features/exam/queries"

type StatusFilter = "all" | "not_started" | "in_progress" | "submitted"
type SortOption = "newest" | "popular"
type ExamSearch = { q?: string; status?: Exclude<StatusFilter, "all">; sort?: SortOption; page?: number }

const EXAM_PAGE_SIZE = 12

function toSearch(next: ExamSearch): ExamSearch {
	const s: ExamSearch = {}
	if (next.q) s.q = next.q
	if (next.status) s.status = next.status
	if (next.sort && next.sort !== "newest") s.sort = next.sort
	if (next.page && next.page > 1) s.page = next.page
	return s
}

export const Route = createFileRoute("/_app/thi-thu/")({
	validateSearch: (s: Record<string, unknown>): ExamSearch => {
		const out: ExamSearch = {}
		if (typeof s.q === "string" && s.q.length > 0) out.q = s.q
		if (s.status === "not_started" || s.status === "in_progress" || s.status === "submitted")
			out.status = s.status
		if (s.sort === "newest" || s.sort === "popular") out.sort = s.sort
		const page = typeof s.page === "string" ? Number(s.page) : s.page
		if (typeof page === "number" && Number.isInteger(page) && page > 1) out.page = page
		return out
	},
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(appConfigQuery),
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
	{ value: "not_started", label: "Chưa làm" },
	{ value: "in_progress", label: "Đang làm dở" },
	{ value: "submitted", label: "Đã nộp" },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "Mới nhất" },
	{ value: "popular", label: "Phổ biến" },
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
	const { q, status, sort, page } = Route.useSearch()
	const navigate = useNavigate({ from: "/thi-thu" })

	const currentStatus = status ?? "all"
	const currentSort = sort ?? "newest"
	const currentPage = page ?? 1
	const { data: examsData } = useSuspenseQuery(
		examsQuery({ q, status, sort: currentSort, page: currentPage, per_page: EXAM_PAGE_SIZE }),
	)
	const { data: configData } = useSuspenseQuery(appConfigQuery)

	const exams = examsData.data
	const pagination = examsData.meta
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
						return toSearch({ q: nextQ, status, sort: currentSort }) as never
					},
					replace: true,
				})
			}, 250)
		},
		[navigate, status, currentSort],
	)
	// Sync URL → local when external change (e.g. reset)
	useEffect(() => {
		const nextQ = q ?? ""
		if (nextQ !== localQ) setLocalQ(nextQ)
	}, [q, localQ])

	function clearQ() {
		commitQ("")
	}

	const setStatus = (next: StatusFilter) => {
		navigate({
			search: () => {
				return toSearch({
					q,
					status: next === "all" ? undefined : next,
					sort: currentSort,
				}) as never
			},
			replace: true,
		})
	}

	const setSort = (next: SortOption) => {
		navigate({
			search: () => toSearch({ q, status, sort: next }) as never,
			replace: true,
		})
	}

	const handleSortChange = (value: string) => {
		if (value === "newest" || value === "popular") setSort(value)
	}

	const setPage = (next: number) => {
		navigate({
			search: () => toSearch({ q, status, sort: currentSort, page: next }) as never,
		})
	}

	function pickEmptyVariant(): "no-data" | "no-match" | "no-submitted" {
		if (pagination.total === 0 && !q && currentStatus === "all") return "no-data"
		if (currentStatus === "submitted" && !(q !== undefined && q.length > 0)) return "no-submitted"
		return "no-match"
	}

	function resetFilters() {
		setLocalQ("")
		navigate({ search: () => ({}) as never, replace: true })
	}

	return (
		<div className="space-y-8">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
				<div className="relative w-full sm:w-72">
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

				<SegmentedTabs items={STATUS_TABS} value={currentStatus} onChange={setStatus} />

				<div className="ml-auto relative hidden sm:block">
					<select
						value={currentSort}
						onChange={(e) => handleSortChange(e.target.value)}
						aria-label="Sắp xếp đề thi"
						className="h-10 appearance-none rounded-(--radius-button) border-2 border-border bg-surface pl-3 pr-8 text-sm font-bold text-muted outline-none transition-colors hover:border-border-focus focus:border-border-focus"
					>
						{SORT_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<Icon
						name="chevron-down"
						size="xs"
						className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-subtle"
					/>
				</div>
			</div>

			{/* Grid */}
			{exams.length === 0 ? (
				<EmptyExams variant={pickEmptyVariant()} onReset={resetFilters} />
			) : (
				<div className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{exams.map((exam) => (
							<ExamCard key={exam.id} exam={exam} coinCost={fullTestCoinCost} />
						))}
					</div>

					{pagination.last_page > 1 && (
						<div className="flex items-center justify-center gap-4 pt-2">
							<button
								type="button"
								disabled={pagination.current_page <= 1}
								onClick={() => setPage(pagination.current_page - 1)}
								className="btn btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
							>
								Trước
							</button>
							<span className="text-sm font-bold text-subtle">
								{pagination.current_page} / {pagination.last_page}
							</span>
							<button
								type="button"
								disabled={pagination.current_page >= pagination.last_page}
								onClick={() => setPage(pagination.current_page + 1)}
								className="btn btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
							>
								Tiếp
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
