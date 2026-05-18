import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Card, Empty, Flex, Typography } from "antd"
import { useState } from "react"
import { Badge } from "#/components/Badge"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import type { AdminWritingMarker } from "#/features/admin-practice/types"
import { WritingMarkerForm } from "#/features/admin-practice/WritingMarkerForm"
import {
	useCreateWritingMarker,
	useDeleteWritingMarker,
	useUpdateWritingMarker,
} from "#/features/admin-practice/writing"
import { extractError } from "#/lib/api"

interface Props {
	promptId: string
	markers: AdminWritingMarker[]
}

export function WritingMarkersTab({ promptId, markers }: Props) {
	const create = useCreateWritingMarker(promptId)
	const update = useUpdateWritingMarker(promptId)
	const remove = useDeleteWritingMarker(promptId)

	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<AdminWritingMarker | null>(null)
	const [deleting, setDeleting] = useState<AdminWritingMarker | null>(null)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá marker.")
			setDeleting(null)
		} catch (err) {
			showError((await extractError(err)).message)
		}
	}

	return (
		<Flex vertical gap={12}>
			<Flex justify="space-between" align="center">
				<Typography.Text type="secondary">{markers.length} marker</Typography.Text>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					Thêm marker
				</Button>
			</Flex>

			{markers.length === 0 ? (
				<Empty description="Chưa có marker nào. Marker dùng để AI highlight đoạn quan trọng trong bài mẫu." />
			) : (
				<Flex vertical gap={8}>
					{markers.map((m) => (
						<Card key={m.id} size="small">
							<Flex justify="space-between" align="flex-start" gap={12}>
								<div style={{ flex: 1 }}>
									<Flex wrap="wrap" align="center" gap={8} style={{ marginBottom: 4 }}>
										<Badge>{m.label}</Badge>
										<Badge variant="info">{m.side === "left" ? "← Trái" : "Phải →"}</Badge>
										<Badge>{m.color}</Badge>
										<Typography.Text type="secondary" style={{ fontSize: 12 }}>
											lần #{m.occurrence}
										</Typography.Text>
									</Flex>
									<div style={{ fontSize: 12 }}>
										Match: <span style={{ fontFamily: "monospace" }}>"{m.match}"</span>
									</div>
									{m.detail && (
										<Typography.Paragraph
											type="secondary"
											style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}
										>
											{m.detail}
										</Typography.Paragraph>
									)}
								</div>
								<Flex gap={4}>
									<Button
										variant="ghost"
										size="sm"
										icon={<EditOutlined />}
										onClick={() => setEditing(m)}
										aria-label="Sửa"
									/>
									<Button
										variant="ghost"
										size="sm"
										icon={<DeleteOutlined />}
										onClick={() => setDeleting(m)}
										aria-label="Xoá"
									/>
								</Flex>
							</Flex>
						</Card>
					))}
				</Flex>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Thêm marker" size="lg">
				<WritingMarkerForm
					submitting={create.isPending}
					onCancel={() => setCreateOpen(false)}
					onSubmit={async (input) => {
						await create.mutateAsync(input)
						showSuccess("Đã thêm marker.")
						setCreateOpen(false)
					}}
				/>
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa marker" size="lg">
				{editing && (
					<WritingMarkerForm
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
				title="Xoá marker"
				description={deleting ? `Xoá marker "${deleting.label}"?` : undefined}
				loading={remove.isPending}
			/>
		</Flex>
	)
}
