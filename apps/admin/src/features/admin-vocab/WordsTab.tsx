import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Flex, Table, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { useCreateWord, useDeleteWord, useUpdateWord } from "#/features/admin-vocab/mutations"
import type { AdminVocabWord } from "#/features/admin-vocab/types"
import { WordForm } from "#/features/admin-vocab/WordForm"
import { extractError } from "#/lib/api"

interface Props {
	topicId: string
	words: AdminVocabWord[]
}

export function WordsTab({ topicId, words }: Props) {
	const create = useCreateWord(topicId)
	const update = useUpdateWord(topicId)
	const remove = useDeleteWord(topicId)
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminVocabWord | null>(null)
	const [deleting, setDeleting] = useState<AdminVocabWord | null>(null)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá từ.")
			setDeleting(null)
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	const columns: ColumnsType<AdminVocabWord> = [
		{ title: "#", dataIndex: "display_order", width: 60 },
		{ title: "Từ", dataIndex: "word", render: (v: string) => <strong>{v}</strong> },
		{ title: "IPA", dataIndex: "phonetic", render: (v: string | null) => v ?? "—" },
		{ title: "Loại", dataIndex: "part_of_speech" },
		{
			title: "Định nghĩa",
			dataIndex: "definition",
			ellipsis: true,
		},
		{
			title: "",
			key: "actions",
			width: 100,
			align: "right",
			render: (_: unknown, w: AdminVocabWord) => (
				<Flex gap={4} justify="end">
					<Button variant="ghost" size="sm" icon={<EditOutlined />} onClick={() => setEditing(w)} />
					<Button variant="ghost" size="sm" icon={<DeleteOutlined />} onClick={() => setDeleting(w)} />
				</Flex>
			),
		},
	]

	return (
		<>
			<Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
				<Typography.Text type="secondary">{words.length} từ.</Typography.Text>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					Thêm từ
				</Button>
			</Flex>

			<Table<AdminVocabWord>
				columns={columns}
				dataSource={words}
				rowKey="id"
				pagination={false}
				size="small"
				locale={{ emptyText: "Chưa có từ nào trong chủ đề này." }}
			/>

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm từ mới" size="lg">
				<WordForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm từ.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal
				open={!!editing}
				onClose={() => setEditing(null)}
				title={`Sửa từ: ${editing?.word ?? ""}`}
				size="lg"
			>
				{editing && (
					<WordForm
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
				title="Xoá từ"
				description={deleting ? `Xoá từ "${deleting.word}"? Hành động này không thể hoàn tác.` : undefined}
				loading={remove.isPending}
			/>
		</>
	)
}
