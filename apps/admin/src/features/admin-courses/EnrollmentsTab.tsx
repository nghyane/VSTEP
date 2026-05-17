import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { Switch as AntdSwitch, Empty, Flex, Space, Table, Tag, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { showError, showSuccess } from "#/components/Toaster"
import { AddEnrollmentDialog } from "#/features/admin-courses/AddEnrollmentDialog"
import {
	enrollmentsQuery,
	useDeleteEnrollment,
	useSetEnrollmentCommitment,
} from "#/features/admin-courses/queries"
import type { AdminEnrollment } from "#/features/admin-courses/types"
import { extractError } from "#/lib/api"

interface Props {
	courseId: string
}

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "—"
	const d = new Date(iso)
	return d.toLocaleString("vi-VN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

function formatDateOnly(iso: string | null | undefined): string {
	if (!iso) return "—"
	const d = new Date(iso.length >= 10 ? iso.slice(0, 10) : iso)
	return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function EnrollmentsTab({ courseId }: Props) {
	const [page, setPage] = useState(1)
	const [deleting, setDeleting] = useState<AdminEnrollment | null>(null)
	const [addOpen, setAddOpen] = useState(false)
	const { data, isLoading } = useQuery(enrollmentsQuery(courseId, page))
	const rows = data?.data ?? []

	const remove = useDeleteEnrollment(courseId)
	const setCommit = useSetEnrollmentCommitment(courseId)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã hủy ghi danh.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	async function toggleCommitment(r: AdminEnrollment): Promise<void> {
		try {
			await setCommit.mutateAsync({ id: r.id, acknowledged: !r.acknowledged_commitment })
			showSuccess(r.acknowledged_commitment ? "Đã bỏ xác nhận cam kết." : "Đã đánh dấu cam kết.")
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={16}>
			<Flex justify="space-between" align="center">
				<div style={{ fontSize: 14, color: "rgba(0,0,0,0.55)" }}>
					{data ? `Tổng ${data.meta.total} học viên đã ghi danh.` : ""}
				</div>
				<Button icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
					Thêm học viên
				</Button>
			</Flex>

			{!isLoading && rows.length === 0 ? (
				<Empty description="Chưa có học viên nào ghi danh khóa này." />
			) : (
				<Table
					rowKey="id"
					loading={isLoading}
					dataSource={rows}
					pagination={
						data && data.meta.last_page > 1
							? {
									current: data.meta.current_page,
									total: data.meta.total,
									pageSize: data.meta.per_page,
									onChange: (p) => setPage(p),
									showSizeChanger: false,
								}
							: false
					}
					columns={[
						{
							title: "Học viên",
							render: (_, r: AdminEnrollment) => (
								<Flex vertical gap={2}>
									<strong>{r.account?.full_name ?? "—"}</strong>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{r.account?.email ?? "—"}
									</Typography.Text>
									{r.profile?.nickname && (
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											Nickname: {r.profile.nickname}
										</Typography.Text>
									)}
								</Flex>
							),
						},
						{
							title: "Mục tiêu",
							width: 160,
							render: (_, r: AdminEnrollment) =>
								r.profile?.target_level ? (
									<Flex vertical gap={2}>
										<Tag color="blue" style={{ marginInlineEnd: 0 }}>
											{r.profile.target_level}
										</Tag>
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											Hạn: {formatDateOnly(r.profile.target_deadline)}
										</Typography.Text>
									</Flex>
								) : (
									<span>—</span>
								),
						},
						{
							title: "Ngày ghi danh",
							dataIndex: "enrolled_at",
							width: 180,
							render: (v: string) => formatDate(v),
						},
						{
							title: "Xu nhận",
							width: 120,
							render: (_, r: AdminEnrollment) =>
								r.bonus_coins_received > 0 ? (
									<Tag color="gold">+{r.bonus_coins_received.toLocaleString("vi-VN")} xu</Tag>
								) : (
									"—"
								),
						},
						{
							title: "Cam kết",
							width: 160,
							render: (_, r: AdminEnrollment) => (
								<Flex align="center" gap={8}>
									<AntdSwitch
										size="small"
										checked={r.acknowledged_commitment}
										loading={setCommit.isPending}
										onChange={() => toggleCommitment(r)}
									/>
									<span
										style={{
											fontSize: 12,
											color: r.acknowledged_commitment ? "#16a34a" : "#a16207",
										}}
									>
										{r.acknowledged_commitment ? "Đã xác nhận" : "Chưa"}
									</span>
								</Flex>
							),
						},
						{
							title: "",
							width: 64,
							align: "right" as const,
							render: (_, r: AdminEnrollment) => (
								<Space size={4}>
									<button
										type="button"
										onClick={() => setDeleting(r)}
										style={{
											background: "none",
											border: 0,
											padding: 4,
											cursor: "pointer",
											color: "#ef4444",
										}}
										aria-label="Hủy ghi danh"
										title="Hủy ghi danh"
									>
										<DeleteOutlined />
									</button>
								</Space>
							),
						},
					]}
				/>
			)}

			<AddEnrollmentDialog open={addOpen} onClose={() => setAddOpen(false)} courseId={courseId} />

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Hủy ghi danh học viên"
				description={
					deleting
						? `Hủy ghi danh của "${deleting.account?.full_name ?? deleting.profile?.nickname ?? "học viên này"}"? Học viên sẽ bị xóa khỏi khóa. Thao tác không hoàn tác — không tự refund tiền/xu, admin tự xử lý qua kênh riêng.`
						: undefined
				}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
