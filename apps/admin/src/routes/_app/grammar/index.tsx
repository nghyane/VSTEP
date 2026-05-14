import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Eye, Pencil, Plus, Search as SearchIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "#/components/Badge"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Input } from "#/components/Input"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { Skeleton } from "#/components/Skeleton"
import { showError, showSuccess } from "#/components/Toaster"
import { useCreatePoint, useDeletePoint, useSetPointPublished } from "#/features/admin-grammar/mutations"
import { PointForm } from "#/features/admin-grammar/PointForm"
import { adminGrammarPointsQuery } from "#/features/admin-grammar/queries"
import type { AdminGrammarPoint } from "#/features/admin-grammar/types"
import { GRAMMAR_CATEGORIES } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Search {
	page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	category?: string
}

export const Route = createFileRoute("/_app/grammar/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_published:
			s.is_published === "yes" || s.is_published === "no" || s.is_published === "all"
				? s.is_published
				: undefined,
		category: typeof s.category === "string" ? s.category : undefined,
	}),
	component: GrammarListPage,
})

function GrammarListPage() {
	const navigate = useNavigate({ from: "/grammar/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all", category = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [deleting, setDeleting] = useState<AdminGrammarPoint | null>(null)

	const { data, isLoading } = useQuery(
		adminGrammarPointsQuery({ page, q, is_published, category, per_page: 20 }),
	)

	const create = useCreatePoint()
	const setPub = useSetPointPublished()
	const remove = useDeletePoint()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá điểm ngữ pháp.")
			setDeleting(null)
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	async function togglePublish(p: AdminGrammarPoint): Promise<void> {
		try {
			await setPub.mutateAsync({ id: p.id, published: !p.is_published })
			showSuccess(p.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Ngữ pháp"
				subtitle="Quản lý điểm ngữ pháp + cấu trúc, ví dụ, lỗi, mẹo, bài tập."
				action={
					<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
						Tạo điểm ngữ pháp
					</Button>
				}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative max-w-xs flex-1">
					<SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
					<Input
						className="pl-9"
						placeholder="Tên / slug / tên Việt…"
						value={draftQ}
						onChange={(e) => setDraftQ(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") setSearch({ q: draftQ })
						}}
					/>
				</div>
				<Select
					className="w-36"
					value={is_published}
					onChange={(e) => setSearch({ is_published: e.target.value as Search["is_published"] })}
				>
					<option value="all">Tất cả</option>
					<option value="yes">Đã xuất bản</option>
					<option value="no">Bản nháp</option>
				</Select>
				<Select className="w-40" value={category} onChange={(e) => setSearch({ category: e.target.value })}>
					<option value="">Mọi category</option>
					{GRAMMAR_CATEGORIES.map((c) => (
						<option key={c.value} value={c.value}>
							{c.label}
						</option>
					))}
				</Select>
			</div>

			{isLoading ? (
				<div className="flex flex-col gap-2">
					{[0, 1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-14 w-full" />
					))}
				</div>
			) : data?.data.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
					Chưa có điểm ngữ pháp nào.
				</div>
			) : (
				<div className="overflow-hidden rounded-(--radius-card) border border-border bg-surface">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-surface-muted/50">
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Slug</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Tên</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Category</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Levels</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Tasks</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">BT</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Trạng thái</th>
								<th className="h-10 w-32 px-4" />
							</tr>
						</thead>
						<tbody>
							{data?.data.map((p) => (
								<tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/30">
									<td className="px-4 py-3 font-mono text-xs text-muted">{p.slug}</td>
									<td className="px-4 py-3">
										<div className="font-medium text-foreground">{p.name}</div>
										{p.vietnamese_name && <div className="text-xs text-muted">{p.vietnamese_name}</div>}
									</td>
									<td className="px-4 py-3">
										<Badge>{p.category}</Badge>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-1">
											{p.levels?.map((l) => (
												<Badge key={l}>{l}</Badge>
											))}
										</div>
									</td>
									<td className="px-4 py-3">
										<div className="flex flex-wrap gap-1">
											{p.tasks?.map((t) => (
												<Badge key={t} variant="info">
													{t}
												</Badge>
											))}
										</div>
									</td>
									<td className="px-4 py-3 text-muted">{p.exercise_count ?? 0}</td>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => togglePublish(p)}
											className="text-left"
											aria-label="Đổi trạng thái xuất bản"
										>
											<Badge variant={p.is_published ? "success" : "warning"}>
												{p.is_published ? "Xuất bản" : "Nháp"}
											</Badge>
										</button>
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-1">
											<Link
												to="/grammar/$pointId"
												params={{ pointId: p.id }}
												className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
												aria-label="Xem chi tiết"
											>
												<Eye className="size-3.5" />
											</Link>
											<Link
												to="/grammar/$pointId"
												params={{ pointId: p.id }}
												className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
												aria-label="Sửa"
											>
												<Pencil className="size-3.5" />
											</Link>
											<button
												type="button"
												onClick={() => setDeleting(p)}
												className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
												aria-label="Xoá"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{data && data.meta.last_page > 1 && (
						<div className="flex items-center justify-between border-t border-border px-4 py-3">
							<div className="text-xs text-muted">
								Trang {data.meta.current_page} / {data.meta.last_page} · {data.meta.total} mục
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="h-8 rounded-md border border-border px-3 text-xs text-muted hover:bg-surface-muted disabled:opacity-50"
									onClick={() => setSearch({ page: page - 1 })}
									disabled={page <= 1}
								>
									Trước
								</button>
								<button
									type="button"
									className="h-8 rounded-md border border-border px-3 text-xs text-muted hover:bg-surface-muted disabled:opacity-50"
									onClick={() => setSearch({ page: page + 1 })}
									disabled={page >= data.meta.last_page}
								>
									Sau
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo điểm ngữ pháp" size="lg">
				<PointForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá điểm ngữ pháp"
				description={
					deleting
						? `Xoá "${deleting.name}"? Tất cả cấu trúc, ví dụ, lỗi, mẹo, bài tập cũng bị xoá.`
						: undefined
				}
				loading={remove.isPending}
			/>
		</div>
	)
}
