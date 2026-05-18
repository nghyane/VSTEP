import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Card, Col, Empty, Flex, Row, Tag, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { McqQuestionForm } from "#/features/admin-practice/McqQuestionForm"
import type { McqQuestion, McqQuestionFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface MutationLike<TInput> {
	mutateAsync: (input: TInput) => Promise<unknown>
	isPending: boolean
}

interface Props {
	questions: McqQuestion[]
	create: MutationLike<McqQuestionFormInput>
	update: MutationLike<{ id: string; input: Partial<McqQuestionFormInput> }>
	remove: MutationLike<string>
}

export function McqQuestionsTab({ questions, create, update, remove }: Props) {
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<McqQuestion | null>(null)
	const [deleting, setDeleting] = useState<McqQuestion | null>(null)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá câu hỏi.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<Typography.Text type="secondary">{questions.length} câu hỏi</Typography.Text>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					Thêm câu hỏi
				</Button>
			</Flex>

			{questions.length === 0 ? (
				<Empty description="Chưa có câu hỏi nào." />
			) : (
				<Flex vertical gap={8}>
					{questions.map((q, idx) => (
						<Card key={q.id} size="small">
							<Flex justify="space-between" align="flex-start" gap={12} style={{ marginBottom: 8 }}>
								<div style={{ flex: 1 }}>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										Câu {idx + 1}
									</Typography.Text>
									<div style={{ marginTop: 4, fontWeight: 500 }}>{q.question}</div>
								</div>
								<Flex gap={4}>
									<Button
										variant="ghost"
										size="sm"
										icon={<EditOutlined />}
										onClick={() => setEditing(q)}
										aria-label="Sửa"
									/>
									<Button
										variant="ghost"
										size="sm"
										icon={<DeleteOutlined />}
										onClick={() => setDeleting(q)}
										aria-label="Xoá"
									/>
								</Flex>
							</Flex>
							<Row gutter={[8, 8]}>
								{q.options.map((opt, i) => (
									<Col span={12} key={i}>
										<Tag color={i === q.correct_index ? "success" : "default"} style={{ width: "100%" }}>
											<span style={{ fontFamily: "monospace", marginRight: 4 }}>
												{String.fromCharCode(65 + i)}.
											</span>
											{opt}
										</Tag>
									</Col>
								))}
							</Row>
							{q.explanation && (
								<Typography.Paragraph
									type="secondary"
									style={{ marginTop: 8, marginBottom: 0, fontSize: 12 }}
								>
									Giải thích: {q.explanation}
								</Typography.Paragraph>
							)}
						</Card>
					))}
				</Flex>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm câu hỏi" size="lg">
				<McqQuestionForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm câu hỏi.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa câu hỏi" size="lg">
				{editing && (
					<McqQuestionForm
						initial={editing}
						submitting={update.isPending}
						onCancel={() => setEditing(null)}
						onSubmit={async (input) => {
							await update.mutateAsync({ id: editing.id, input })
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
				title="Xoá câu hỏi"
				description={deleting ? "Xoá câu hỏi này khỏi bài tập?" : undefined}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
