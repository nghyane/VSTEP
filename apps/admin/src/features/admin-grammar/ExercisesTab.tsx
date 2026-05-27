import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Empty, Flex, Typography } from "antd"
import { useState } from "react"
import { Badge } from "#/components/Badge"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { ExerciseEditor } from "#/features/admin-grammar/ExerciseEditor"
import { useCreateExercise, useDeleteExercise, useUpdateExercise } from "#/features/admin-grammar/mutations"
import type { AdminGrammarExercise, ExerciseFormInput } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	pointId: string
	exercises: AdminGrammarExercise[]
}

function summary(ex: AdminGrammarExercise): string {
	return ex.payload.prompt
}

export function ExercisesTab({ pointId, exercises }: Props) {
	const create = useCreateExercise(pointId)
	const update = useUpdateExercise(pointId)
	const remove = useDeleteExercise(pointId)
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminGrammarExercise | null>(null)
	const [deleting, setDeleting] = useState<AdminGrammarExercise | null>(null)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá bài tập.")
			setDeleting(null)
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<>
			<Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
				<Typography.Text type="secondary">{exercises.length} bài tập.</Typography.Text>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					Thêm bài tập
				</Button>
			</Flex>

			{exercises.length === 0 ? (
				<Empty description="Chưa có bài tập nào." />
			) : (
				<Flex vertical gap={8}>
					{exercises.map((ex) => (
						<Flex
							key={ex.id}
							align="flex-start"
							justify="space-between"
							gap={12}
							style={{
								padding: "12px 16px",
								border: "1px solid rgba(0,0,0,0.06)",
								borderRadius: 8,
								background: "#fff",
							}}
						>
							<div style={{ minWidth: 0, flex: 1 }}>
								<Flex align="center" gap={8} style={{ marginBottom: 4 }}>
									<Badge variant="info">Trắc nghiệm</Badge>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										#{ex.display_order}
									</Typography.Text>
								</Flex>
								<Typography.Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>
									{summary(ex)}
								</Typography.Paragraph>
								<Typography.Paragraph
									type="secondary"
									ellipsis={{ rows: 1 }}
									style={{ marginBottom: 0, fontSize: 12 }}
								>
									{ex.explanation}
								</Typography.Paragraph>
							</div>
							<Flex gap={4}>
								<Button variant="ghost" size="sm" icon={<EditOutlined />} onClick={() => setEditing(ex)} />
								<Button variant="ghost" size="sm" icon={<DeleteOutlined />} onClick={() => setDeleting(ex)} />
							</Flex>
						</Flex>
					))}
				</Flex>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm bài tập" size="lg">
				<ExerciseEditor
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input: ExerciseFormInput) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm bài tập.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa bài tập" size="lg">
				{editing && (
					<ExerciseEditor
						initial={editing}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync({
								id: editing.id,
								input: { explanation: input.explanation, payload: input.payload },
							})
							showSuccess("Đã cập nhật.")
							setEditing(null)
						}}
					/>
				)}
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá bài tập"
				description="Hành động này không thể hoàn tác."
				loading={remove.isPending}
			/>
		</>
	)
}
