import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Textarea } from "#/components/Textarea"
import type { AdminGrammarTip, GrammarTask, TipFormInput } from "#/features/admin-grammar/types"
import { GRAMMAR_TASKS } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarTip
	onSubmit: (input: TipFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function TipForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [task, setTask] = useState<GrammarTask>(initial?.task ?? "WT1")
	const [tip, setTip] = useState(initial?.tip ?? "")
	const [example, setExample] = useState(initial?.example ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ task, tip, example, display_order: displayOrder })
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) {
				setErrors(x.errors)
				setGeneric(Object.values(x.errors).flat().join(" • ") || x.message)
			} else {
				setGeneric(x.message)
			}
		}
	}

	return (
		<form onSubmit={handle} className="flex flex-col gap-4">
			<FormField label="VSTEP Task" htmlFor="task" required error={errors.task}>
				<Select id="task" value={task} onChange={(e) => setTask(e.target.value as GrammarTask)}>
					{GRAMMAR_TASKS.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</Select>
			</FormField>
			<FormField label="Mẹo" htmlFor="tip" required error={errors.tip}>
				<Textarea
					id="tip"
					value={tip}
					onChange={(e) => setTip(e.target.value)}
					rows={3}
					invalid={!!errors.tip}
				/>
			</FormField>
			<FormField label="Ví dụ áp dụng" htmlFor="example" required error={errors.example}>
				<Textarea
					id="example"
					value={example}
					onChange={(e) => setExample(e.target.value)}
					rows={2}
					invalid={!!errors.example}
				/>
			</FormField>
			<FormField label="Thứ tự" htmlFor="display_order">
				<Input
					id="display_order"
					type="number"
					value={displayOrder}
					onChange={(e) => setDisplayOrder(Number(e.target.value))}
				/>
			</FormField>

			{generic && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{generic}</div>}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" onClick={onCancel} disabled={submitting}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					{initial ? "Cập nhật" : "Thêm tip"}
				</Button>
			</div>
		</form>
	)
}
