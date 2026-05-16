import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Input as AntInput, Empty, Flex, Space, Table, Tag, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
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
		<Flex vertical gap={24}>
			<PageHeader
				title="Bài nói (VSTEP)"
				subtitle="Quản lý task speaking — social, solution, topic."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo bài nói
					</Button>
				}
			/>

			<Flex wrap align="center" gap={8}>
				<AntInput
					prefix={<SearchOutlined />}
					placeholder="Tìm theo tiêu đề hoặc slug…"
					value={draftQ}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftQ(e.target.value)}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (e.key === "Enter") setSearch({ q: draftQ })
					}}
					style={{ maxWidth: 280, flex: 1 }}
				/>
				<div style={{ width: 144 }}>
					<Select
						value={is_published}
						onChange={(e) => setSearch({ is_published: e.target.value as Search["is_published"] })}
					>
						<option value="all">Tất cả</option>
						<option value="yes">Đã xuất bản</option>
						<option value="no">Bản nháp</option>
					</Select>
				</div>
				<div style={{ width: 128 }}>
					<Select
						value={part ?? ""}
						onChange={(e) => setSearch({ part: e.target.value ? Number(e.target.value) : undefined })}
					>
						<option value="">Mọi part</option>
						<option value={1}>Part 1</option>
						<option value={2}>Part 2</option>
						<option value={3}>Part 3</option>
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Chưa có bài nói nào." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={data?.data ?? []}
					pagination={
						data && data.meta.last_page > 1
							? {
									current: data.meta.current_page,
									total: data.meta.total,
									pageSize: data.meta.per_page,
									onChange: (p) => setSearch({ page: p }),
									showSizeChanger: false,
								}
							: false
					}
					columns={[
						{
							title: "Slug",
							dataIndex: "slug",
							render: (v: string) => (
								<Typography.Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>
									{v}
								</Typography.Text>
							),
						},
						{ title: "Tiêu đề", dataIndex: "title", render: (v: string) => <strong>{v}</strong> },
						{ title: "Part", dataIndex: "part", render: (v: number) => <Tag>Part {v}</Tag> },
						{
							title: "Type",
							dataIndex: "task_type",
							render: (v: string) => <Tag color="blue">{v}</Tag>,
						},
						{ title: "Phút", dataIndex: "estimated_minutes" },
						{
							title: "Trạng thái",
							render: (_, t: AdminSpeakingTask) => (
								<button
									type="button"
									onClick={() => togglePublish(t)}
									style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
									aria-label="Đổi trạng thái xuất bản"
								>
									<Tag color={t.is_published ? "success" : "warning"}>
										{t.is_published ? "Xuất bản" : "Nháp"}
									</Tag>
								</button>
							),
						},
						{
							title: "",
							width: 128,
							align: "right" as const,
							render: (_, t: AdminSpeakingTask) => (
								<Space size={4}>
									<Link
										to="/practice/speaking-tasks/$taskId"
										params={{ taskId: t.id }}
										aria-label="Xem chi tiết"
									>
										<EyeOutlined />
									</Link>
									<Link to="/practice/speaking-tasks/$taskId" params={{ taskId: t.id }} aria-label="Sửa">
										<EditOutlined />
									</Link>
									<button
										type="button"
										onClick={() => setDeleting(t)}
										style={{ background: "none", border: 0, padding: 4, cursor: "pointer" }}
										aria-label="Xoá"
									>
										<DeleteOutlined />
									</button>
								</Space>
							),
						},
					]}
				/>
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
		</Flex>
	)
}
