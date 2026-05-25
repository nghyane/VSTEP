import { ImportOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Input as AntdInput, Empty, Flex, Pagination, Skeleton, Space, Table } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showError, showSuccess } from "#/components/Toaster"
import { ExamForm } from "#/features/admin-exams/ExamForm"
import { ImportExamForm } from "#/features/admin-exams/ImportExamForm"
import { useCreateExam, useDeleteExam, useSetExamPublished } from "#/features/admin-exams/mutations"
import { adminExamsQuery } from "#/features/admin-exams/queries"
import type { AdminExam } from "#/features/admin-exams/types"
import { extractError } from "#/lib/api"
import { getExamColumns } from "./-exams/columns"

interface Search {
	page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
}

export const Route = createFileRoute("/_app/exams/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_published:
			s.is_published === "yes" || s.is_published === "no" || s.is_published === "all"
				? s.is_published
				: undefined,
	}),
	component: ExamsListPage,
})

function ExamsListPage() {
	const navigate = useNavigate({ from: "/exams/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all" } = search
	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [importOpen, setImportOpen] = useState(false)
	const [deleting, setDeleting] = useState<AdminExam | null>(null)

	const { data, isLoading } = useQuery(adminExamsQuery({ page, q, is_published, per_page: 20 }))
	const create = useCreateExam()
	const setPub = useSetExamPublished()
	const remove = useDeleteExam()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá đề thi.")
			setDeleting(null)
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	async function togglePublish(t: AdminExam): Promise<void> {
		try {
			await setPub.mutateAsync({ id: t.id, published: !t.is_published })
			showSuccess(t.is_published ? "Đã ẩn đề thi." : "Đã xuất bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	const columns = getExamColumns({ togglePublish, setDeleting })

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Đề thi"
				subtitle="Quản lý đề thi VSTEP."
				action={
					<Space>
						<Button icon={<ImportOutlined />} variant="ghost" onClick={() => setImportOpen(true)}>
							Import JSON
						</Button>
						<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
							Tạo đề thi
						</Button>
					</Space>
				}
			/>
			<Flex align="center" gap={8} wrap>
				<AntdInput
					prefix={<SearchOutlined />}
					placeholder="Tìm theo tên, slug..."
					value={draftQ}
					onChange={(e) => setDraftQ(e.target.value)}
					onPressEnter={() => setSearch({ q: draftQ || undefined })}
					allowClear
					onClear={() => setSearch({ q: undefined })}
					style={{ width: 260 }}
				/>
				<Select
					value={is_published}
					onChange={(e) => setSearch({ is_published: e.target.value as Search["is_published"] })}
				>
					<option value="all">Tất cả</option>
					<option value="yes">Đã xuất bản</option>
					<option value="no">Nháp</option>
				</Select>
			</Flex>
			{isLoading ? (
				<Skeleton active paragraph={{ rows: 8 }} />
			) : !data?.data.length ? (
				<Empty description="Chưa có đề thi nào." />
			) : (
				<>
					<Table dataSource={data.data} columns={columns} rowKey="id" pagination={false} size="middle" />
					{data.meta.last_page > 1 && (
						<Flex justify="end">
							<Pagination
								current={data.meta.current_page}
								total={data.meta.total}
								pageSize={data.meta.per_page}
								onChange={(p) => setSearch({ page: p })}
								showSizeChanger={false}
							/>
						</Flex>
					)}
				</>
			)}
			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo đề thi mới">
				<ExamForm
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo đề thi.")
						setCreateOpen(false)
					}}
					onCancel={() => setCreateOpen(false)}
					submitting={create.isPending}
				/>
			</Modal>
			<Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import đề thi từ JSON" size="lg">
				<ImportExamForm
					onSuccess={() => {
						setImportOpen(false)
						showSuccess("Import thành công.")
					}}
					onCancel={() => setImportOpen(false)}
				/>
			</Modal>
			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá đề thi"
				description={`Bạn có chắc muốn xoá "${deleting?.title}"? Hành động này không thể hoàn tác.`}
				confirmLabel="Xoá"
				loading={remove.isPending}
			/>
		</Flex>
	)
}
