import { Pencil, Plus, Trash2 } from "lucide-react"
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
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-sm text-muted">{questions.length} câu hỏi</span>
				<Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
					Thêm câu hỏi
				</Button>
			</div>

			{questions.length === 0 ? (
				<div className="rounded-(--radius-card) border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
					Chưa có câu hỏi nào.
				</div>
			) : (
				<ol className="flex flex-col gap-2">
					{questions.map((q, idx) => (
						<li key={q.id} className="rounded-(--radius-card) border border-border bg-surface p-4">
							<div className="mb-2 flex items-start justify-between gap-3">
								<div className="flex-1">
									<div className="text-xs text-muted">Câu {idx + 1}</div>
									<div className="mt-1 text-sm font-medium text-foreground">{q.question}</div>
								</div>
								<div className="flex gap-1">
									<button
										type="button"
										onClick={() => setEditing(q)}
										className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
										aria-label="Sửa"
									>
										<Pencil className="size-3.5" />
									</button>
									<button
										type="button"
										onClick={() => setDeleting(q)}
										className="rounded-md p-1.5 text-muted hover:bg-danger-tint hover:text-danger"
										aria-label="Xoá"
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</div>
							<ul className="grid grid-cols-2 gap-1 text-xs">
								{q.options.map((opt, i) => (
									<li
										key={i}
										className={
											i === q.correct_index
												? "rounded-md bg-success-tint px-2 py-1 text-success"
												: "rounded-md bg-surface-muted px-2 py-1 text-muted"
										}
									>
										<span className="mr-1 font-mono">{String.fromCharCode(65 + i)}.</span>
										{opt}
									</li>
								))}
							</ul>
							{q.explanation && <p className="mt-2 text-xs text-subtle">Giải thích: {q.explanation}</p>}
						</li>
					))}
				</ol>
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
		</div>
	)
}
