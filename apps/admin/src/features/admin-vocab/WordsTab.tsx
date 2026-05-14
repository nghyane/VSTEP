import { Pencil, Plus, Trash2 } from "lucide-react"
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

	return (
		<>
			<div className="mb-4 flex items-center justify-between">
				<p className="text-sm text-muted">{words.length} từ.</p>
				<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
					Thêm từ
				</Button>
			</div>

			{words.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted">
					Chưa có từ nào trong chủ đề này.
				</div>
			) : (
				<div className="overflow-hidden rounded-(--radius-card) border border-border bg-surface">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-surface-muted/50">
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">#</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Từ</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">IPA</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Loại</th>
								<th className="h-10 px-4 text-left text-xs font-medium text-muted">Định nghĩa</th>
								<th className="h-10 w-24 px-4" />
							</tr>
						</thead>
						<tbody>
							{words.map((w) => (
								<tr key={w.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted/30">
									<td className="px-4 py-3 text-muted">{w.display_order}</td>
									<td className="px-4 py-3 font-medium text-foreground">{w.word}</td>
									<td className="px-4 py-3 text-muted">{w.phonetic ?? "—"}</td>
									<td className="px-4 py-3 text-muted">{w.part_of_speech}</td>
									<td className="px-4 py-3 text-muted">
										<span className="line-clamp-1 max-w-xs">{w.definition}</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-1">
											<button
												type="button"
												className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
												onClick={() => setEditing(w)}
												aria-label="Sửa"
											>
												<Pencil className="size-3.5" />
											</button>
											<button
												type="button"
												className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
												onClick={() => setDeleting(w)}
												aria-label="Xoá"
											>
												<Trash2 className="size-3.5" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

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
