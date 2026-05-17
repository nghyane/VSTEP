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
import { CourseForm } from "#/features/admin-courses/CourseForm"
import {
	courseListQuery,
	useCreateCourse,
	useDeleteCourse,
	useSetCoursePublished,
} from "#/features/admin-courses/queries"
import {
	type AdminCourse,
	COURSE_TARGET_LEVELS,
	type CourseTargetLevel,
} from "#/features/admin-courses/types"
import { extractError } from "#/lib/api"

interface Search {
	page?: number
	q?: string
	is_published?: "all" | "yes" | "no"
	target_level?: CourseTargetLevel | ""
}

export const Route = createFileRoute("/_app/courses/")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		page: typeof s.page === "number" ? s.page : undefined,
		q: typeof s.q === "string" ? s.q : undefined,
		is_published:
			s.is_published === "yes" || s.is_published === "no" || s.is_published === "all"
				? s.is_published
				: undefined,
		target_level: COURSE_TARGET_LEVELS.includes(s.target_level as CourseTargetLevel)
			? (s.target_level as CourseTargetLevel)
			: undefined,
	}),
	component: CoursesListPage,
})

function CoursesListPage() {
	const navigate = useNavigate({ from: "/courses/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all", target_level = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [deleting, setDeleting] = useState<AdminCourse | null>(null)

	const { data, isLoading } = useQuery(courseListQuery({ page, q, is_published, target_level, per_page: 20 }))
	const create = useCreateCourse()
	const setPub = useSetCoursePublished()
	const remove = useDeleteCourse()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá khóa học.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function togglePublish(c: AdminCourse): Promise<void> {
		try {
			await setPub.mutateAsync({ id: c.id, published: !c.is_published })
			showSuccess(c.is_published ? "Đã đóng ghi danh." : "Đã mở ghi danh.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Khóa học"
				subtitle="Quản lý khóa học: gán giáo viên, lịch, giá và cam kết."
				action={
					<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
						Tạo khóa học
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
						<option value="yes">Đang mở</option>
						<option value="no">Đã đóng</option>
					</Select>
				</div>
				<div style={{ width: 144 }}>
					<Select
						value={target_level}
						onChange={(e) => setSearch({ target_level: (e.target.value || "") as CourseTargetLevel | "" })}
					>
						<option value="">Mọi level</option>
						{COURSE_TARGET_LEVELS.map((lv) => (
							<option key={lv} value={lv}>
								{lv}
							</option>
						))}
					</Select>
				</div>
			</Flex>

			{!isLoading && data?.data.length === 0 ? (
				<Empty description="Chưa có khóa học nào." />
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
						{
							title: "Level",
							dataIndex: "target_level",
							render: (v: string) => <Tag color="blue">{v}</Tag>,
						},
						{
							title: "Giáo viên",
							render: (_, c: AdminCourse) => c.teacher?.full_name ?? "—",
						},
						{
							title: "Giá",
							render: (_, c: AdminCourse) => `${c.price_vnd.toLocaleString("vi-VN")}₫`,
						},
						{
							title: "Học viên",
							render: (_, c: AdminCourse) => `${c.enrollment_count ?? 0}/${c.max_slots}`,
						},
						{
							title: "Trạng thái",
							render: (_, c: AdminCourse) => (
								<button
									type="button"
									onClick={() => togglePublish(c)}
									style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }}
									aria-label="Đổi trạng thái ghi danh"
								>
									<Tag color={c.is_published ? "success" : "warning"}>
										{c.is_published ? "Đang mở" : "Đã đóng"}
									</Tag>
								</button>
							),
						},
						{
							title: "",
							width: 128,
							align: "right" as const,
							render: (_, c: AdminCourse) => (
								<Space size={4}>
									<Link to="/courses/$courseId" params={{ courseId: c.id }} aria-label="Xem chi tiết">
										<EyeOutlined />
									</Link>
									<Link to="/courses/$courseId" params={{ courseId: c.id }} aria-label="Sửa">
										<EditOutlined />
									</Link>
									<button
										type="button"
										onClick={() => setDeleting(c)}
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

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tạo khóa học" size="xl">
				<CourseForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã tạo khóa học.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá khóa học"
				description={
					deleting ? `Xoá khóa "${deleting.title}"? Không thể xoá nếu đã có học viên ghi danh.` : undefined
				}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
