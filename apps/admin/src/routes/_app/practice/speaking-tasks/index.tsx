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
import { SpeakingTaskForm } from "#/features/admin-practice/SpeakingTaskForm"
import {
	speakingTaskListQuery,
	useCreateSpeakingTask,
	useDeleteSpeakingTask,
	useSetSpeakingTaskPublished,
} from "#/features/admin-practice/speaking-task"
import type { AdminSpeakingTask } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Search {
	page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	part?: number
}

export const Route = createFileRoute("/_app/practice/speaking-tasks/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_published:
			s.is_published === "yes" || s.is_published === "no" || s.is_published === "all"
				? s.is_published
				: undefined,
		part: typeof s.part === "number" ? s.part : undefined,
	}),
	component: SpeakingTaskListPage,
})

function SpeakingTaskListPage() {
	const navigate = useNavigate({ from: "/practice/speaking-tasks/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all", part } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [deleting, setDeleting] = useState<AdminSpeakingTask | null>(null)

	const { data, isLoading } = useQuery(speakingTaskListQuery({ page, q, is_published, part, per_page: 20 }))
	const create = useCreateSpeakingTask()
	const setPub = useSetSpeakingTaskPublished()
	const remove = useDeleteSpeakingTask()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá bài nói.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function togglePublish(t: AdminSpeakingTask): Promise<void> {
		try {
			await setPub.mutateAsync({ id: t.id, published: !t.is_published })
			showSuccess(t.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title="Bài nói (VSTEP)"
				subtitle="Quản lý task speaking — social, solution, topic."
				action={
					<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
						Tạo bài nói
					</Button>
				}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<div className="relative max-w-xs flex-1">
					<SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
					<Input
						className="pl-9"
						placeholder="Tìm theo tiêu đề hoặc slug…"
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
				<Select
					className="w-32"
					value={part ?? ""}
					onChange={(e) => setSearch({ part: e.target.value ? Number(e.target.value) : undefined })}
				>
					<option value="">Mọi part</option>
					<option value={1}>Part 1</option>
					<option value={2}>Part 2</option>
					<option value={3}>Part 3</option>
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
					Chưa có bài nói nào.
				</div>
			) : (
				<div className="overflow-hidden rounded-(--radius-card) border border-border bg-surface">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-surface-muted/50">
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Slug</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Tiêu đề</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Part</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Type</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Phút</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Trạng thái</th>
								<th className="h-10 w-32 px-4" />
							</tr>
						</thead>
						<tbody>
							{data?.data.map((t) => (
								<tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/30">
									<td className="px-4 py-3 font-mono text-xs text-muted">{t.slug}</td>
									<td className="px-4 py-3 font-medium text-foreground">{t.title}</td>
									<td className="px-4 py-3">
										<Badge>Part {t.part}</Badge>
									</td>
									<td className="px-4 py-3">
										<Badge variant="info">{t.task_type}</Badge>
									</td>
									<td className="px-4 py-3 text-muted">{t.estimated_minutes}</td>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => togglePublish(t)}
											className="text-left"
											aria-label="Đổi trạng thái xuất bản"
										>
											<Badge variant={t.is_published ? "success" : "warning"}>
												{t.is_published ? "Xuất bản" : "Nháp"}
											</Badge>
										</button>
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-1">
											<Link
												to="/practice/speaking-tasks/$taskId"
												params={{ taskId: t.id }}
												className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
												aria-label="Xem chi tiết"
											>
												<Eye className="size-3.5" />
											</Link>
											<Link
												to="/practice/speaking-tasks/$taskId"
												params={{ taskId: t.id }}
												className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
												aria-label="Sửa"
											>
												<Pencil className="size-3.5" />
											</Link>
											<button
												type="button"
												onClick={() => setDeleting(t)}
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
								Trang {data.meta.current_page} / {data.meta.last_page} · {data.meta.total} bài
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

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo bài nói" size="lg">
				<SpeakingTaskForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo bài.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá bài nói"
				description={deleting ? `Xoá bài "${deleting.title}"?` : undefined}
				loading={remove.isPending}
			/>
		</div>
	)
}
