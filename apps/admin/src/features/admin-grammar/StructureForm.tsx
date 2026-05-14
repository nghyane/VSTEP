import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Textarea } from "#/components/Textarea"
import type { AdminGrammarStructure, StructureFormInput } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarStructure
	onSubmit: (input: StructureFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function StructureForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [template, setTemplate] = useState(initial?.template ?? "")
	const [description, setDescription] = useState(initial?.description ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ template, description, display_order: displayOrder })
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
			<FormField label="Cấu trúc" htmlFor="template" required error={errors.template}>
				<Input
					id="template"
					value={template}
					onChange={(e) => setTemplate(e.target.value)}
					placeholder="S + V-ed + O"
					invalid={!!errors.template}
				/>
			</FormField>
			<FormField label="Mô tả" htmlFor="description" error={errors.description}>
				<Textarea
					id="description"
					value={description ?? ""}
					onChange={(e) => setDescription(e.target.value)}
					rows={2}
				/>
			</FormField>
			<FormField label="Thứ tự" htmlFor="display_order" error={errors.display_order}>
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
					{initial ? "Cập nhật" : "Thêm cấu trúc"}
				</Button>
			</div>
		</form>
	)
}
