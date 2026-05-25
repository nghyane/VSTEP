import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Input as AntInput, Empty, Flex, Space, Switch as AntdSwitch, Table, Tag, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { PageHeader } from "#/components/PageHeader"
import { Select } from "#/components/Select"
import { showError, showSuccess } from "#/components/Toaster"
import { SpeakingDrillForm } from "#/features/admin-practice/SpeakingDrillForm"
import {
	speakingDrillListQuery,
	useCreateSpeakingDrill,
	useDeleteSpeakingDrill,
	useSetSpeakingDrillPublished,
} from "#/features/admin-practice/speaking-drill"
import type { AdminSpeakingDrill } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Search {
	page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	level?: string
}

export const Route = createFileRoute("/_app/practice/speaking-drills/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_published:
			s.is_published === "yes" || s.is_published === "no" || s.is_published === "all"
				? s.is_published
				: undefined,
		level: typeof s.level === "string" ? s.level : undefined,
	}),
	component: SpeakingDrillListPage,
})

function SpeakingDrillListPage() {
	const navigate = useNavigate({ from: "/practice/speaking-drills/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all", level = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [deleting, setDeleting] = useState<AdminSpeakingDrill | null>(null)

	const { data, isLoading } = useQuery(speakingDrillListQuery({ page, q, is_published, level, per_page: 20 }))
	const create = useCreateSpeakingDrill()
	const setPub = useSetSpeakingDrillPublished()
	const remove = useDeleteSpeakingDrill()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá bài phát âm.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function togglePublish(t: AdminSpeakingDrill): Promise<void> {
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
				title="Luyện phát âm"
				subtitle="Quản lý bài shadowing với câu mẫu theo từng level."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo bài
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
					<Select value={level} onChange={(e) => setSearch({ level: e.target.value })}>
						<option value="">Mọi level</option>
						<option value="A2">A2</option>
						<option value="B1">B1</option>
						<option value="B2">B2</option>
						<option value="C1">C1</option>
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Chưa có bài phát âm nào." />
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
						{ title: "Level", dataIndex: "level", render: (v: string) => <Tag>{v}</Tag> },
						{ title: "Phút", dataIndex: "estimated_minutes" },
						{
							title: "Câu",
							dataIndex: "sentence_count",
							render: (v?: number) => v ?? 0,
						},
						{
							title: "Trạng thái",
							render: (_, t: AdminSpeakingDrill) => (
								<AntdSwitch
									checked={t.is_published}
									onChange={() => togglePublish(t)}
									checkedChildren="Xuất bản"
									unCheckedChildren="Nháp"
									size="small"
								/>
							),
						},
						{
							title: "",
							width: 128,
							align: "right" as const,
							render: (_, t: AdminSpeakingDrill) => (
								<Space size={4}>
									<Link
										to="/practice/speaking-drills/$drillId"
										params={{ drillId: t.id }}
										aria-label="Xem chi tiết"
									>
										<EyeOutlined />
									</Link>
									<Link to="/practice/speaking-drills/$drillId" params={{ drillId: t.id }} aria-label="Sửa">
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

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo bài phát âm" size="lg">
				<SpeakingDrillForm
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
				title="Xoá bài phát âm"
				description={deleting ? `Xoá bài "${deleting.title}"? Tất cả câu cũng bị xoá.` : undefined}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
