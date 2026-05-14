import { Pencil, Plus, Trash2 } from "lucide-react"
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

const KIND_LABEL: Record<AdminGrammarExercise["kind"], string> = {
	mcq: "Trắc nghiệm",
	error_correction: "Sửa lỗi",
	fill_blank: "Điền chỗ trống",
	rewrite: "Viết lại",
}

function summary(ex: AdminGrammarExercise): string {
	if (ex.kind === "mcq") return ex.payload.prompt
	if (ex.kind === "error_correction") return `${ex.payload.sentence} → ${ex.payload.correction}`
	if (ex.kind === "fill_blank") return ex.payload.template
	return `${ex.payload.instruction} — ${ex.payload.original}`
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
			<div className="mb-4 flex items-center justify-between">
				<p className="text-sm text-muted">{exercises.length} bài tập.</p>
				<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
					Thêm bài tập
				</Button>
			</div>

			{exercises.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted">
					Chưa có bài tập nào.
				</div>
			) : (
				<ul className="flex flex-col gap-2">
					{exercises.map((ex) => (
						<li
							key={ex.id}
							className="flex items-start justify-between gap-3 rounded-(--radius-card) border border-border bg-surface px-4 py-3"
						>
							<div className="min-w-0 flex-1">
								<div className="mb-1 flex items-center gap-2">
									<Badge variant="info">{KIND_LABEL[ex.kind]}</Badge>
									<span className="text-xs text-subtle">#{ex.display_order}</span>
								</div>
								<p className="line-clamp-2 text-sm text-foreground">{summary(ex)}</p>
								<p className="mt-1 line-clamp-1 text-xs text-muted">{ex.explanation}</p>
							</div>
							<div className="flex gap-1">
								<button
									type="button"
									className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
									onClick={() => setEditing(ex)}
									aria-label="Sửa"
								>
									<Pencil className="size-3.5" />
								</button>
								<button
									type="button"
									className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
									onClick={() => setDeleting(ex)}
									aria-label="Xoá"
								>
									<Trash2 className="size-3.5" />
								</button>
							</div>
						</li>
					))}
				</ul>
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
