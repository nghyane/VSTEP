import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type { AdminGrammarExample, ExampleFormInput } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarExample
	onSubmit: (input: ExampleFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ExampleForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [en, setEn] = useState(initial?.en ?? "")
	const [vi, setVi] = useState(initial?.vi ?? "")
	const [note, setNote] = useState(initial?.note ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ en, vi, note, display_order: displayOrder })
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
			<FormField label="Tiếng Anh" htmlFor="en" required error={errors.en}>
				<Input id="en" value={en} onChange={(e) => setEn(e.target.value)} invalid={!!errors.en} />
			</FormField>
			<FormField label="Tiếng Việt" htmlFor="vi" required error={errors.vi}>
				<Input id="vi" value={vi} onChange={(e) => setVi(e.target.value)} invalid={!!errors.vi} />
			</FormField>
			<FormField label="Ghi chú" htmlFor="note" error={errors.note}>
				<Textarea id="note" value={note ?? ""} onChange={(e) => setNote(e.target.value)} rows={2} />
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
					{initial ? "Cập nhật" : "Thêm ví dụ"}
				</Button>
			</div>
		</form>
	)
}
