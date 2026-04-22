import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useState } from "react"
import { Header } from "#/components/Header"
import { Icon } from "#/components/Icon"
import { Loading } from "#/components/Loading"
import { ExamCard } from "#/features/exam/components/ExamCard"
import { examsQuery } from "#/features/exam/queries"

export const Route = createFileRoute("/_app/thi-thu/")({
	loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(examsQuery),
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

function ExamListContent() {
	const { data } = useSuspenseQuery(examsQuery)
	const exams = data.data
	const [search, setSearch] = useState("")

	const filtered = exams.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))

	return (
		<div className="flex gap-8">
			{/* Sidebar filters */}
			<aside className="w-60 shrink-0 space-y-6 pt-2">
				<div className="space-y-2">
					<p className="text-xs font-bold tracking-wider text-subtle uppercase">Tìm kiếm</p>
					<div className="relative">
						<Icon
							name="search"
							size="xs"
							className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
						/>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Nhập tên đề thi..."
							className="w-full rounded-(--radius-button) border-2 border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-border-focus transition-colors"
						/>
					</div>
				</div>
			</aside>

			{/* Exam grid */}
			<div className="flex-1 space-y-4">
				<p className="text-sm text-subtle">{filtered.length} đề thi</p>
				{filtered.length === 0 ? (
					<p className="text-sm text-subtle py-8 text-center">Không tìm thấy đề thi nào.</p>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{filtered.map((exam) => (
							<ExamCard key={exam.id} exam={exam} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}
