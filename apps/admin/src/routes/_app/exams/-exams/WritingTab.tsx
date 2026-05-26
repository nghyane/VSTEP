import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Button, Flex, Modal, Popconfirm, Tag, Typography } from "antd"
import { useState } from "react"
import { Card } from "#/components/Card"
import { showError, showSuccess } from "#/components/Toaster"
import {
	useCreateWritingTask,
	useDeleteWritingTask,
	useUpdateWritingTask,
} from "#/features/admin-exams/content-mutations"
import type { WritingTask } from "#/features/admin-exams/types"
import { WritingTaskForm } from "#/features/admin-exams/WritingTaskForm"
import { extractError } from "#/lib/api"

interface Props {
	tasks: WritingTask[]
	examId: string
	versionId: string
}

export function WritingTab({ tasks, examId, versionId }: Props) {
	const [modal, setModal] = useState<{ open: boolean; editing?: WritingTask }>({ open: false })

	const createTask = useCreateWritingTask(examId, versionId)
	const updateTask = useUpdateWritingTask(examId, versionId)
	const deleteTask = useDeleteWritingTask(examId, versionId)

	async function handleDelete(id: string) {
		try {
			await deleteTask.mutateAsync(id)
			showSuccess("Đã xoá bài viết.")
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<Flex vertical gap={12}>
			<Flex justify="end">
				<Button icon={<PlusOutlined />} onClick={() => setModal({ open: true })}>
					Thêm bài viết
				</Button>
			</Flex>
			{tasks.length === 0 ? (
				<Typography.Text type="secondary">Chưa có nội dung Writing.</Typography.Text>
			) : (
				<Flex vertical gap={16}>
					{tasks.map((t) => (
						<Card
							key={t.id}
							title={`Part ${t.part} — ${t.task_type === "letter" ? "Thư" : "Bài luận"}`}
							action={
								<Flex gap={4}>
									<Button
										size="small"
										icon={<EditOutlined />}
										onClick={() => setModal({ open: true, editing: t })}
									/>
									<Popconfirm
										title="Xoá bài viết này?"
										onConfirm={() => handleDelete(t.id)}
										okText="Xoá"
										cancelText="Huỷ"
									>
										<Button size="small" danger icon={<DeleteOutlined />} />
									</Popconfirm>
								</Flex>
							}
						>
							<Flex vertical gap={8}>
								<Flex gap={8}>
									{t.duration_minutes && <Tag>Thời gian: {t.duration_minutes} phút</Tag>}
									{t.min_words && <Tag>Tối thiểu: {t.min_words} từ</Tag>}
								</Flex>
								<Typography.Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>
									{t.prompt}
								</Typography.Paragraph>
								{t.instructions && t.instructions.length > 0 && (
									<Flex vertical gap={4}>
										<Typography.Text type="secondary">Hướng dẫn:</Typography.Text>
										<ul style={{ margin: 0, paddingLeft: 20 }}>
											{t.instructions.map((ins, i) => (
												<li key={i}>{ins}</li>
											))}
										</ul>
									</Flex>
								)}
							</Flex>
						</Card>
					))}
				</Flex>
			)}

			<Modal
				title={modal.editing ? "Sửa bài viết" : "Thêm bài viết"}
				open={modal.open}
				onCancel={() => setModal({ open: false })}
				footer={null}
				destroyOnHidden
				centered
				width={720}
			>
				<WritingTaskForm
					initial={modal.editing ?? undefined}
					onSubmit={async (input) => {
						if (modal.editing) {
							await updateTask.mutateAsync({ id: modal.editing.id, ...input })
						} else {
							await createTask.mutateAsync(input)
						}
						showSuccess(modal.editing ? "Đã cập nhật." : "Đã thêm bài viết.")
						setModal({ open: false })
					}}
					onCancel={() => setModal({ open: false })}
					submitting={createTask.isPending || updateTask.isPending}
				/>
			</Modal>
		</Flex>
	)
}
