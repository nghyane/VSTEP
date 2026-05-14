import { Pencil, Plus, Trash2 } from "lucide-react"
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
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted">{markers.length} marker</span>
				<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
					Thêm marker
				</Button>
			</div>

			{markers.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
					Chưa có marker nào. Marker dùng để AI highlight đoạn quan trọng trong bài mẫu.
				</div>
			) : (
				<ul className="flex flex-col gap-2">
					{markers.map((m) => (
						<li
							key={m.id}
							className="flex items-start justify-between gap-3 rounded-(--radius-card) border border-border bg-surface p-4"
						>
							<div className="flex-1">
								<div className="mb-1 flex flex-wrap items-center gap-2">
									<Badge>{m.label}</Badge>
									<Badge variant="info">{m.side === "left" ? "← Trái" : "Phải →"}</Badge>
									<Badge>{m.color}</Badge>
									<span className="text-xs text-muted">lần #{m.occurrence}</span>
								</div>
								<div className="text-xs text-foreground">
									Match: <span className="font-mono">"{m.match}"</span>
								</div>
								{m.detail && <p className="mt-1 text-xs text-subtle">{m.detail}</p>}
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => setEditing(m)}
									className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
									aria-label="Sửa"
								>
									<Pencil className="size-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setDeleting(m)}
									className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
									aria-label="Xoá"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</li>
					))}
				</ul>
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
		</div>
	)
}
