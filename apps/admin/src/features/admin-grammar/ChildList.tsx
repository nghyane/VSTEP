import { Pencil, Plus, Trash2 } from "lucide-react"
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
			<div className="mb-4 flex items-center justify-between">
				<p className="text-sm text-muted">{items.length} mục.</p>
				<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
					{addLabel}
				</Button>
			</div>

			{items.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted">
					{emptyLabel}
				</div>
			) : (
				<ul className="flex flex-col gap-2">
					{items.map((item) => (
						<li
							key={item.id}
							className="flex items-start justify-between gap-3 rounded-(--radius-card) border border-border bg-surface px-4 py-3"
						>
							<div className="min-w-0 flex-1">{renderItem(item)}</div>
							<div className="flex shrink-0 gap-1">
								<button
									type="button"
									className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
									onClick={() => setEditing(item)}
									aria-label="Sửa"
								>
									<Pencil className="size-3.5" />
								</button>
								<button
									type="button"
									className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
									onClick={() => setDeleting(item)}
									aria-label="Xoá"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</li>
					))}
				</ul>
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
