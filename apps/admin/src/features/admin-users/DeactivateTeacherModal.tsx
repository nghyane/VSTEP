import { useQuery } from "@tanstack/react-query"
import { Alert, Flex, Space, Spin, Table, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { Modal } from "#/components/Modal"
import { Select } from "#/components/Select"
import { teacherOptionsQuery } from "#/features/admin-courses/queries"
import { extractError, formatApiErrorBanner } from "#/lib/api"
import { teacherActiveCoursesQuery, useDeactivateUser } from "./queries"
import type { AdminUser, ReassignmentInput } from "./types"

interface Props {
	open: boolean
	teacher: AdminUser | null
	onClose: () => void
	onDone: () => void
}

/**
 * Modal vô hiệu hoá giáo viên. Khi teacher còn khóa active phải ép admin
 * chọn giáo viên thay thế cho từng khóa trước khi confirm. Khóa đã hết
 * hạn không hiển thị (không bị ảnh hưởng theo policy).
 */
export function DeactivateTeacherModal({ open, teacher, onClose, onDone }: Props) {
	const teacherId = teacher?.id
	const coursesQ = useQuery({ ...teacherActiveCoursesQuery(teacherId ?? ""), enabled: !!teacherId && open })
	const teachersQ = useQuery({ ...teacherOptionsQuery(), enabled: open })
	const deactivate = useDeactivateUser()

	const courses = coursesQ.data?.data ?? []
	const teacherOptions = (teachersQ.data?.data ?? []).filter((t) => t.id !== teacherId)

	const [assignments, setAssignments] = useState<Record<string, string>>({})
	const [error, setError] = useState<string | null>(null)

	function reset(): void {
		setAssignments({})
		setError(null)
	}

	function setFor(courseId: string, newTeacherId: string): void {
		setAssignments((s) => ({ ...s, [courseId]: newTeacherId }))
	}

	async function handleConfirm(): Promise<void> {
		if (!teacher) return
		setError(null)

		const missing = courses.filter((c) => !assignments[c.id])
		if (missing.length > 0) {
			setError(`Còn ${missing.length} khóa chưa chọn giáo viên thay thế.`)
			return
		}

		const reassignments: ReassignmentInput[] = courses.map((c) => ({
			course_id: c.id,
			new_teacher_id: assignments[c.id],
		}))

		try {
			await deactivate.mutateAsync({ id: teacher.id, reassignments })
			reset()
			onDone()
		} catch (err) {
			setError(formatApiErrorBanner(await extractError(err)))
		}
	}

	const loading = coursesQ.isLoading || teachersQ.isLoading

	return (
		<Modal
			open={open}
			onClose={() => {
				reset()
				onClose()
			}}
			title="Vô hiệu hoá giáo viên"
			size="lg"
		>
			{!teacher ? null : loading ? (
				<Flex justify="center" style={{ padding: 32 }}>
					<Spin />
				</Flex>
			) : (
				<Flex vertical gap={12}>
					<Typography.Text>
						Bạn sắp khoá tài khoản <strong>{teacher.full_name ?? teacher.email}</strong>.
					</Typography.Text>

					{courses.length === 0 ? (
						<Alert
							type="info"
							showIcon
							message="Giáo viên này không phụ trách khóa nào đang chạy. Có thể vô hiệu hoá ngay."
						/>
					) : (
						<>
							<Alert
								type="warning"
								showIcon
								message={`Đang phụ trách ${courses.length} khóa chưa kết thúc — chọn giáo viên thay thế cho từng khóa trước khi tiếp tục.`}
							/>
							<Table
								size="small"
								rowKey="id"
								dataSource={courses}
								pagination={false}
								columns={[
									{
										title: "Khóa",
										dataIndex: "title",
										render: (v: string, c) => (
											<Space orientation="vertical" size={0}>
												<strong>{v}</strong>
												<Typography.Text type="secondary" style={{ fontSize: 11 }}>
													Đến {new Date(c.end_date).toLocaleDateString("vi-VN")}
												</Typography.Text>
											</Space>
										),
									},
									{
										title: "Giáo viên thay thế",
										width: 280,
										render: (_, c) => (
											<Select value={assignments[c.id] ?? ""} onChange={(e) => setFor(c.id, e.target.value)}>
												<option value="">— Chọn —</option>
												{teacherOptions.map((t) => (
													<option key={t.id} value={t.id}>
														{t.full_name} ({t.email})
													</option>
												))}
											</Select>
										),
									},
								]}
							/>
						</>
					)}

					{error && <Alert type="error" showIcon message={error} closable />}

					<Flex justify="flex-end" gap={8}>
						<Button
							variant="ghost"
							onClick={() => {
								reset()
								onClose()
							}}
							disabled={deactivate.isPending}
						>
							Huỷ
						</Button>
						<Button variant="danger" onClick={handleConfirm} loading={deactivate.isPending}>
							Vô hiệu hoá
						</Button>
					</Flex>
				</Flex>
			)}
		</Modal>
	)
}

/**
 * Hook nhỏ cho non-teacher (learner/staff) — không cần modal phức tạp,
 * chỉ confirm rồi gọi mutation. Component caller dùng `ConfirmDialog`
 * cho UX thống nhất.
 */
export function useSimpleDeactivate() {
	return useDeactivateUser()
}
