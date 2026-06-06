import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
	Input as AntdInput,
	Switch as AntdSwitch,
	Empty,
	Flex,
	Pagination,
	Skeleton,
	Space,
	Table,
	Tag,
	Typography,
} from "antd"
import type { ColumnsType } from "antd/es/table"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
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

	const columns: ColumnsType<AdminGrammarPoint> = [
		{
			title: "Slug",
			dataIndex: "slug",
			key: "slug",
			render: (v: string) => (
				<Typography.Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>
					{v}
				</Typography.Text>
			),
		},
		{
			title: "Tên",
			key: "name",
			render: (_: unknown, p) => (
				<div>
					<strong>{p.name}</strong>
					{p.vietnamese_name && (
						<div>
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								{p.vietnamese_name}
							</Typography.Text>
						</div>
					)}
				</div>
			),
		},
		{
			title: "Category",
			dataIndex: "category",
			key: "category",
			render: (v: string) => <Tag>{v}</Tag>,
		},
		{
			title: "Levels",
			dataIndex: "levels",
			key: "levels",
			render: (levels: string[] | undefined) => (
				<Space size={4} wrap>
					{levels?.map((l) => (
						<Tag key={l}>{l}</Tag>
					))}
				</Space>
			),
		},
		{
			title: "Tasks",
			dataIndex: "tasks",
			key: "tasks",
			render: (tasks: string[] | undefined) => (
				<Space size={4} wrap>
					{tasks?.map((t) => (
						<Tag key={t} color="blue">
							{t}
						</Tag>
					))}
				</Space>
			),
		},
		{
			title: "BT",
			dataIndex: "exercise_count",
			key: "exercise_count",
			render: (v: number | undefined) => v ?? 0,
		},
		{
			title: "Trạng thái",
			key: "status",
			render: (_: unknown, p) => (
				<AntdSwitch
					checked={p.is_published}
					onChange={() => togglePublish(p)}
					checkedChildren="Xuất bản"
					unCheckedChildren="Nháp"
					size="small"
				/>
			),
		},
		{
			title: "",
			key: "actions",
			width: 140,
			align: "right",
			render: (_: unknown, p) => (
				<Space size={4}>
					<Link to="/grammar/$pointId" params={{ pointId: p.id }} aria-label="Sửa">
						<Button variant="ghost" size="sm" icon={<EditOutlined />} />
					</Link>
					<Button
						variant="ghost"
						size="sm"
						icon={<DeleteOutlined />}
						onClick={() => setDeleting(p)}
						aria-label="Xoá"
					/>
				</Space>
			),
		},
	]

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Ngữ pháp"
				subtitle="Quản lý điểm ngữ pháp + cấu trúc, ví dụ, lỗi, mẹo, bài tập."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo điểm ngữ pháp
					</Button>
				}
			/>

			<Flex align="center" gap={8} wrap>
				<AntdInput
					prefix={<SearchOutlined />}
					placeholder="Tên / slug / tên Việt…"
					value={draftQ}
					onChange={(e) => setDraftQ(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") setSearch({ q: draftQ })
					}}
					style={{ width: 280 }}
				/>
				<Select
					value={is_published}
					onChange={(e) => setSearch({ is_published: e.target.value as Search["is_published"] })}
					style={{ width: 150 }}
				>
					<option value="all">Tất cả</option>
					<option value="yes">Đã xuất bản</option>
					<option value="no">Bản nháp</option>
				</Select>
				<Select
					value={category}
					onChange={(e) => setSearch({ category: e.target.value })}
					style={{ width: 170 }}
				>
					<option value="">Mọi category</option>
					{GRAMMAR_CATEGORIES.map((c) => (
						<option key={c.value} value={c.value}>
							{c.label}
						</option>
					))}
				</Select>
			</Flex>

			{isLoading ? (
				<Skeleton active paragraph={{ rows: 6 }} />
			) : data?.data.length === 0 ? (
				<Empty description="Chưa có điểm ngữ pháp nào." />
			) : (
				<Flex vertical gap={16}>
					<Table<AdminGrammarPoint>
						rowKey="id"
						columns={columns}
						dataSource={data?.data ?? []}
						pagination={false}
						size="middle"
					/>
					{data && data.meta.last_page > 1 && (
						<Flex justify="space-between" align="center">
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								Trang {data.meta.current_page} / {data.meta.last_page} · {data.meta.total} mục
							</Typography.Text>
							<Pagination
								current={page}
								total={data.meta.total}
								pageSize={data.meta.per_page}
								onChange={(p) => setSearch({ page: p })}
								showSizeChanger={false}
							/>
						</Flex>
					)}
				</Flex>
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
		</Flex>
	)
}
