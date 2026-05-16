import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Card, Empty, Flex, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { SpeakingDrillSentenceForm } from "#/features/admin-practice/SpeakingDrillSentenceForm"
import {
	useCreateSpeakingDrillSentence,
	useDeleteSpeakingDrillSentence,
	useUpdateSpeakingDrillSentence,
} from "#/features/admin-practice/speaking-drill"
import type { AdminSpeakingDrillSentence } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	drillId: string
	sentences: AdminSpeakingDrillSentence[]
}

export function SpeakingDrillSentencesTab({ drillId, sentences }: Props) {
	const create = useCreateSpeakingDrillSentence(drillId)
	const update = useUpdateSpeakingDrillSentence(drillId)
	const remove = useDeleteSpeakingDrillSentence(drillId)

	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminSpeakingDrillSentence | null>(null)
	const [deleting, setDeleting] = useState<AdminSpeakingDrillSentence | null>(null)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá câu.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<Typography.Text type="secondary">{sentences.length} câu</Typography.Text>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					Thêm câu
				</Button>
			</Flex>

			{sentences.length === 0 ? (
				<Empty description="Chưa có câu nào." />
			) : (
				<Flex vertical gap={8}>
					{sentences.map((s, idx) => (
						<Card key={s.id} size="small">
							<Flex justify="space-between" align="flex-start" gap={12}>
								<div style={{ flex: 1 }}>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										Câu {idx + 1}
									</Typography.Text>
									<div style={{ fontWeight: 500, marginTop: 2 }}>{s.text}</div>
									{s.translation && (
										<Typography.Paragraph
											type="secondary"
											style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}
										>
											{s.translation}
										</Typography.Paragraph>
									)}
								</div>
								<Flex gap={4}>
									<Button
										variant="ghost"
										size="sm"
										icon={<EditOutlined />}
										onClick={() => setEditing(s)}
										aria-label="Sửa"
									/>
									<Button
										variant="ghost"
										size="sm"
										icon={<DeleteOutlined />}
										onClick={() => setDeleting(s)}
										aria-label="Xoá"
									/>
								</Flex>
							</Flex>
						</Card>
					))}
				</Flex>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm câu" size="lg">
				<SpeakingDrillSentenceForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm câu.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa câu" size="lg">
				{editing && (
					<SpeakingDrillSentenceForm
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
				title="Xoá câu"
				description="Xoá câu này khỏi bài phát âm?"
				loading={remove.isPending}
			/>
		</Flex>
	)
}
