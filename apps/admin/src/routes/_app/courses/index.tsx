import {
	ClockCircleOutlined,
	CopyOutlined,
	DeleteOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	EyeOutlined,
	PlusOutlined,
	SearchOutlined,
} from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
	Alert,
	Switch as AntdSwitch,
	Input as AntInput,
	Empty,
	Flex,
	Space,
	Table,
	Tag,
	Typography,
} from "antd"
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

const EXPIRING_SOON_DAYS = 7
const SLUG_MAX_LENGTH = 80
const TITLE_MAX_LENGTH = 200

function startOfTodayMs(): number {
	const d = new Date()
	d.setHours(0, 0, 0, 0)
	return d.getTime()
}

function daysUntil(endDate: string): number {
	const end = new Date(endDate)
	end.setHours(0, 0, 0, 0)
	return Math.round((end.getTime() - startOfTodayMs()) / (1000 * 60 * 60 * 24))
}

function isExpired(endDate: string): boolean {
	return daysUntil(endDate) < 0
}

function countExpiryWarnings(courses: AdminCourse[] | undefined): { expired: number; expiring: number } {
	if (!courses) return { expired: 0, expiring: 0 }
	let expired = 0
	let expiring = 0
	for (const c of courses) {
		const days = daysUntil(c.end_date)
		if (days < 0 && c.is_published) expired++
		else if (days >= 0 && days <= EXPIRING_SOON_DAYS && c.is_published) expiring++
	}
	return { expired, expiring }
}

function ExpiryCell({ endDate }: { endDate: string }) {
	const days = daysUntil(endDate)
	const dateStr = new Date(endDate).toLocaleDateString("vi-VN")
	if (days < 0) {
		return (
			<Space size={4}>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					{dateStr}
				</Typography.Text>
				<Tag color="error" icon={<ExclamationCircleOutlined />} style={{ marginInlineEnd: 0 }}>
					Hết hạn {-days}d
				</Tag>
			</Space>
		)
	}
	if (days <= EXPIRING_SOON_DAYS) {
		return (
			<Space size={4}>
				<Typography.Text type="secondary" style={{ fontSize: 12 }}>
					{dateStr}
				</Typography.Text>
				<Tag color="warning" icon={<ClockCircleOutlined />} style={{ marginInlineEnd: 0 }}>
					Còn {days}d
				</Tag>
			</Space>
		)
	}
	return (
		<Typography.Text type="secondary" style={{ fontSize: 12 }}>
			{dateStr}
		</Typography.Text>
	)
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

function deleteDescription(c: AdminCourse): string {
	const parts: string[] = [`Xoá khóa "${c.title}"?`]
	const enrollments = c.enrollment_count ?? 0
	const orders = c.enrollment_order_count ?? 0
	if (enrollments > 0 || orders > 0) {
		const warnings: string[] = []
		if (enrollments > 0) warnings.push(`${enrollments} học viên ghi danh`)
		if (orders > 0) warnings.push(`${orders} đơn mua`)
		parts.push(`Hiện có ${warnings.join(" và ")} — không thể xoá.`)
	} else {
		parts.push("Hành động này không thể hoàn tác.")
	}
	return parts.join(" ")
}

function appendCloneSuffix(value: string, suffix: string, maxLength: number): string {
	return `${value.slice(0, maxLength - suffix.length)}${suffix}`
}

function buildCloneInitial(c: AdminCourse): AdminCourse {
	const slugSuffix = `-copy-${Date.now().toString(36)}`
	const titleSuffix = " (copy)"

	return {
		...c,
		slug: appendCloneSuffix(c.slug, slugSuffix, SLUG_MAX_LENGTH),
		title: appendCloneSuffix(c.title, titleSuffix, TITLE_MAX_LENGTH),
		start_date: "",
		end_date: "",
		is_published: false,
	}
}

function CoursesListPage() {
	const navigate = useNavigate({ from: "/courses/" })
	const search = Route.useSearch()
	const { page = 1, q = "", is_published = "all", target_level = "" } = search

	const [draftQ, setDraftQ] = useState(q)
	const [createOpen, setCreateOpen] = useState(false)
	const [createInitial, setCreateInitial] = useState<AdminCourse | null>(null)
	const [deleting, setDeleting] = useState<AdminCourse | null>(null)

	const { data, isLoading } = useQuery(courseListQuery({ page, q, is_published, target_level, per_page: 20 }))
	const create = useCreateCourse()
	const setPub = useSetCoursePublished()
	const remove = useDeleteCourse()

	function setSearch(next: Partial<Search>): void {
		navigate({ search: { ...search, ...next, page: next.page ?? 1 } })
	}

	function closeCreateModal(): void {
		setCreateOpen(false)
		setCreateInitial(null)
	}

	const expiryStats = countExpiryWarnings(data?.data)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá khóa học.")
			setDeleting(null)
		} catch (err) {
			const x = await extractError(err)
			const detail = x.errors ? Object.values(x.errors).flat().join(" ") : x.message
			showError(detail || x.message)
			setDeleting(null)
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

	function cloneCourse(c: AdminCourse): void {
		setCreateInitial(buildCloneInitial(c))
		setCreateOpen(true)
	}

	return (
		<Flex vertical gap={24}>
			<PageHeader
				title="Khóa học"
				subtitle="Quản lý khóa học: gán giáo viên, lịch, giá và cam kết."
				action={
					<Button
						icon={<PlusOutlined />}
						onClick={() => {
							setCreateInitial(null)
							setCreateOpen(true)
						}}
					>
						Tạo khóa học
					</Button>
				}
			/>

			{(expiryStats.expired > 0 || expiryStats.expiring > 0) && (
				<Alert
					type={expiryStats.expired > 0 ? "warning" : "info"}
					showIcon
					icon={<ExclamationCircleOutlined />}
					message={
						<Space wrap>
							{expiryStats.expired > 0 && (
								<span>
									<strong>{expiryStats.expired}</strong> khóa đã hết hạn nhưng vẫn đang mở ghi danh — nên đóng
									để học viên không thấy.
								</span>
							)}
							{expiryStats.expiring > 0 && (
								<span>
									<strong>{expiryStats.expiring}</strong> khóa sắp hết hạn trong {EXPIRING_SOON_DAYS} ngày
									tới.
								</span>
							)}
						</Space>
					}
				/>
			)}

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
						{
							title: "Tiêu đề",
							dataIndex: "title",
							render: (v: string) => <strong>{v}</strong>,
						},
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
							render: (_, c: AdminCourse) => {
								const orders = c.enrollment_order_count ?? 0
								return (
									<span>
										{c.enrollment_count ?? 0}/{c.max_slots}
										{orders > 0 && (
											<Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
												({orders} đơn)
											</Typography.Text>
										)}
									</span>
								)
							},
						},
						{
							title: "Lịch",
							render: (_, c: AdminCourse) => <ExpiryCell endDate={c.end_date} />,
						},
						{
							title: "Trạng thái",
							render: (_, c: AdminCourse) => {
								const expired = isExpired(c.end_date)
								return (
									<Space orientation="vertical" size={4} align="start">
										<AntdSwitch
											checked={c.is_published}
											onChange={() => togglePublish(c)}
											checkedChildren="Đang mở"
											unCheckedChildren="Đã đóng"
											size="small"
										/>
										{expired && c.is_published && (
											<Tag color="error" style={{ marginInlineEnd: 0 }}>
												Cần đóng
											</Tag>
										)}
									</Space>
								)
							},
						},
						{
							title: "",
							width: 160,
							align: "right" as const,
							render: (_, c: AdminCourse) => (
								<Space size={4}>
									<button
										type="button"
										onClick={() => cloneCourse(c)}
										disabled={create.isPending}
										style={{
											background: "none",
											border: 0,
											padding: 4,
											cursor: create.isPending ? "not-allowed" : "pointer",
											color: create.isPending ? "#cbd5e1" : undefined,
										}}
										aria-label="Nhân bản khóa học"
										title="Nhân bản khóa học"
									>
										<CopyOutlined />
									</button>
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

			<Modal
				open={createOpen}
				onClose={closeCreateModal}
				title={createInitial ? "Nhân bản khóa học" : "Tạo khóa học"}
				size="xl"
			>
				<CourseForm
					key={createInitial?.slug ?? "create"}
					initial={createInitial ?? undefined}
					submitting={create.isPending}
					onCancel={closeCreateModal}
					onSubmit={async (input) => {
						const res = await create.mutateAsync(input)
						showSuccess(createInitial ? "Đã nhân bản khóa học." : "Đã tạo khóa học.")
						closeCreateModal()
						if (createInitial) navigate({ to: "/courses/$courseId", params: { courseId: res.data.id } })
					}}
				/>
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá khóa học"
				description={deleting ? deleteDescription(deleting) : undefined}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
