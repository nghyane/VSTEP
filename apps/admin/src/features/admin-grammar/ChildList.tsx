import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { Empty, Flex, Typography } from "antd"
import { type ReactNode, useState } from "react"
import { Button } from "#/components/Button"
import { ConfirmDialog } from "#/components/ConfirmDialog"
import { Modal } from "#/components/Modal"
import { showError, showSuccess } from "#/components/Toaster"
import { extractError } from "#/lib/api"

interface Identified {
	id: string
}

interface Props<T extends Identified, F> {
	items: T[]
	addLabel: string
	emptyLabel: string
	renderItem: (item: T) => ReactNode
	renderForm: (props: {
		initial?: T
		submitting: boolean
		onSubmit: (input: F) => Promise<unknown>
		onCancel: () => void
	}) => ReactNode
	modalTitle: { create: string; edit: string }
	confirmDelete: (item: T) => string
	mutations: {
		create: { mutateAsync: (input: F) => Promise<unknown>; isPending: boolean }
		update: {
			mutateAsync: (params: { id: string; input: F }) => Promise<unknown>
			isPending: boolean
		}
		remove: { mutateAsync: (id: string) => Promise<unknown>; isPending: boolean }
	}
}

export function ChildList<T extends Identified, F>({
	items,
	addLabel,
	emptyLabel,
	renderItem,
	renderForm,
	modalTitle,
	confirmDelete,
	mutations,
}: Props<T, F>) {
	const [createOpen, setCreateOpen] = useState(false)
	const [editing, setEditing] = useState<T | null>(null)
	const [deleting, setDeleting] = useState<T | null>(null)

	async function onDelete(): Promise<void> {
		if (!deleting) return
		try {
			await mutations.remove.mutateAsync(deleting.id)
			showSuccess("Đã xoá.")
			setDeleting(null)
		} catch (err) {
			const e = await extractError(err)
			showError(e.message)
		}
	}

	return (
		<>
			<Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
				<Typography.Text type="secondary">{items.length} mục.</Typography.Text>
				<Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
					{addLabel}
				</Button>
			</Flex>

			{items.length === 0 ? (
				<Empty description={emptyLabel} />
			) : (
				<Flex vertical gap={8}>
					{items.map((item) => (
						<Flex
							key={item.id}
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
							<div style={{ minWidth: 0, flex: 1 }}>{renderItem(item)}</div>
							<Flex gap={4} style={{ flexShrink: 0 }}>
								<Button variant="ghost" size="sm" icon={<EditOutlined />} onClick={() => setEditing(item)} />
								<Button
									variant="ghost"
									size="sm"
									icon={<DeleteOutlined />}
									onClick={() => setDeleting(item)}
								/>
							</Flex>
						</Flex>
					))}
				</Flex>
			)}

			<Modal open={createOpen} onClose={() => setCreateOpen(false)} title={modalTitle.create} size="lg">
				{renderForm({
					submitting: mutations.create.isPending,
					onCancel: () => setCreateOpen(false),
					onSubmit: async (input) => {
						await mutations.create.mutateAsync(input)
						showSuccess("Đã thêm.")
						setCreateOpen(false)
					},
				})}
			</Modal>

			<Modal open={!!editing} onClose={() => setEditing(null)} title={modalTitle.edit} size="lg">
				{editing &&
					renderForm({
						initial: editing,
						submitting: mutations.update.isPending,
						onCancel: () => setEditing(null),
						onSubmit: async (input) => {
							await mutations.update.mutateAsync({ id: editing.id, input })
							showSuccess("Đã cập nhật.")
							setEditing(null)
						},
					})}
			</Modal>

			<ConfirmDialog
				open={!!deleting}
				onClose={() => setDeleting(null)}
				onConfirm={onDelete}
				title="Xoá mục"
				description={deleting ? confirmDelete(deleting) : undefined}
				loading={mutations.remove.isPending}
			/>
		</>
	)
}
