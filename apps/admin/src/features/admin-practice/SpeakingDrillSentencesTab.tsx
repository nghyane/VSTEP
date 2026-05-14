import { Pencil, Plus, Trash2 } from "lucide-react"
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
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted">{sentences.length} câu</span>
				<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
					Thêm câu
				</Button>
			</div>

			{sentences.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
					Chưa có câu nào.
				</div>
			) : (
				<ol className="flex flex-col gap-2">
					{sentences.map((s, idx) => (
						<li
							key={s.id}
							className="flex items-start justify-between gap-3 rounded-(--radius-card) border border-border bg-surface p-4"
						>
							<div className="flex-1">
								<div className="mb-1 text-xs text-muted">Câu {idx + 1}</div>
								<div className="text-sm font-medium text-foreground">{s.text}</div>
								{s.translation && <p className="mt-1 text-xs text-subtle">{s.translation}</p>}
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									onClick={() => setEditing(s)}
									className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
									aria-label="Sửa"
								>
									<Pencil className="size-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setDeleting(s)}
									className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
									aria-label="Xoá"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</li>
					))}
				</ol>
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
		</div>
	)
}
