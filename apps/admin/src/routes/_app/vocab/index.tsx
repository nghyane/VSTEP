import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Input as AntdInput, Empty, Flex, Pagination, Skeleton, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showError, showSuccess } from "#/components/Toaster"
import { useCreateTopic, useDeleteTopic, useSetTopicPublished } from "#/features/admin-vocab/mutations"
import { adminVocabTopicsQuery } from "#/features/admin-vocab/queries"
import { TopicForm } from "#/features/admin-vocab/TopicForm"
import type { AdminVocabTopic } from "#/features/admin-vocab/types"
import { VOCAB_LEVELS } from "#/features/admin-vocab/types"
import { extractError } from "#/lib/api"

interface Search {
	page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	level?: string
}

export const Route = createFileRoute("/_app/vocab/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_published:
			s.is_published === "yes" || s.is_published === "no" || s.is_published === "all"
				? s.is_published
				: undefined,
		level: typeof s.level === "string" ? s.level : undefined,
	}),
	component: VocabListPage,
})

function VocabListPage() {
	const navigate = useNavigate({ from: "/vocab/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all", level = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [deleting, setDeleting] = useState<AdminVocabTopic | null>(null)

	const { data, isLoading } = useQuery(adminVocabTopicsQuery({ page, q, is_published, level, per_page: 20 }))

	const create = useCreateTopic()
	const setPub = useSetTopicPublished()
	const remove = useDeleteTopic()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá chủ đề.")
			setDeleting(null)
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	async function togglePublish(t: AdminVocabTopic): Promise<void> {
		try {
			await setPub.mutateAsync({ id: t.id, published: !t.is_published })
			showSuccess(t.is_published ? "Đã ẩn xuất bản." : "Đã xuất bản.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	const columns: ColumnsType<AdminVocabTopic> = [
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
		{ title: "Tên", dataIndex: "name", key: "name", render: (v: string) => <strong>{v}</strong> },
		{ title: "Level", dataIndex: "level", key: "level", render: (v: string) => <Tag>{v}</Tag> },
		{
			title: "Tasks",
			dataIndex: "tasks",
			key: "tasks",
			render: (tasks: string[] | undefined) => (
				<Space size={4} wrap>
					{tasks?.map((task) => (
						<Tag key={task} color="blue">
							{task}
						</Tag>
					))}
				</Space>
			),
		},
		{ title: "Words", dataIndex: "word_count", key: "word_count", render: (v: number | undefined) => v ?? 0 },
		{
			title: "Bài tập",
			dataIndex: "exercise_count",
			key: "exercise_count",
			render: (v: number | undefined) => v ?? 0,
		},
		{
			title: "Trạng thái",
			key: "status",
			render: (_: unknown, t) => (
				<button
					type="button"
					onClick={() => togglePublish(t)}
					style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
					aria-label="Đổi trạng thái xuất bản"
				>
					<Tag color={t.is_published ? "success" : "warning"}>{t.is_published ? "Xuất bản" : "Nháp"}</Tag>
				</button>
			),
		},
		{
			title: "",
			key: "actions",
			width: 140,
			align: "right",
			render: (_: unknown, t) => (
				<Space size={4}>
					<Link to="/vocab/$topicId" params={{ topicId: t.id }} aria-label="Sửa">
						<Button variant="ghost" size="sm" icon={<EditOutlined />} />
					</Link>
					<Button
						variant="ghost"
						size="sm"
						icon={<DeleteOutlined />}
						onClick={() => setDeleting(t)}
						aria-label="Xoá"
					/>
				</Space>
			),
		},
	]

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Từ vựng"
				subtitle="Quản lý chủ đề, từ và bài tập từ vựng."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo chủ đề
					</Button>
				}
			/>

			<Flex align="center" gap={8} wrap>
				<AntdInput
					prefix={<SearchOutlined />}
					placeholder="Tìm theo tên hoặc slug…"
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
				<Select value={level} onChange={(e) => setSearch({ level: e.target.value })} style={{ width: 130 }}>
					<option value="">Mọi level</option>
					{VOCAB_LEVELS.map((l) => (
						<option key={l} value={l}>
							{l}
						</option>
					))}
				</Select>
			</Flex>

			{isLoading ? (
				<Skeleton active paragraph={{ rows: 6 }} />
			) : data?.data.length === 0 ? (
				<Empty description="Chưa có chủ đề nào." />
			) : (
				<Flex vertical gap={16}>
					<Table<AdminVocabTopic>
						rowKey="id"
						columns={columns}
						dataSource={data?.data ?? []}
						pagination={false}
						size="middle"
					/>
					{data && data.meta.last_page > 1 && (
						<Flex justify="space-between" align="center">
							<Typography.Text type="secondary" style={{ fontSize: 12 }}>
								Trang {data.meta.current_page} / {data.meta.last_page} · {data.meta.total} chủ đề
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

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo chủ đề từ vựng" size="lg">
				<TopicForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo chủ đề.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá chủ đề"
				description={
					deleting
						? `Xoá chủ đề "${deleting.name}"? Tất cả từ và bài tập trong chủ đề cũng sẽ bị xoá.`
						: undefined
				}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
