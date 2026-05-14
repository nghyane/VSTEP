import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type {
	AdminGrammarPoint,
	GrammarCategory,
	GrammarLevel,
	GrammarTask,
	PointFormInput,
} from "#/features/admin-grammar/types"
import { GRAMMAR_CATEGORIES, GRAMMAR_LEVELS, GRAMMAR_TASKS } from "#/features/admin-grammar/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminGrammarPoint
	onSubmit: (input: PointFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function PointForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<PointFormInput>({
		slug: initial?.slug ?? "",
		name: initial?.name ?? "",
		vietnamese_name: initial?.vietnamese_name ?? "",
		summary: initial?.summary ?? "",
		category: (initial?.category as GrammarCategory) ?? "foundation",
		display_order: initial?.display_order ?? 0,
		is_published: initial?.is_published ?? false,
		levels: (initial?.levels ?? []) as GrammarLevel[],
		tasks: (initial?.tasks ?? []) as GrammarTask[],
		functions: initial?.functions ?? [],
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof PointFormInput>(key: K, value: PointFormInput[K]): void {
		setState((s) => ({ ...s, [key]: value }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit(state)
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) {
				setErrors(x.errors)
				const fieldList = Object.values(x.errors).flat().join(" • ")
				setGeneric(fieldList || x.message)
			} else {
				setGeneric(x.message)
			}
		}
	}

	return (
		<form onSubmit={handle} className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-3">
				<FormField label="Slug" htmlFor="slug" required error={errors.slug} helper="Không trùng, không dấu.">
					<Input
						id="slug"
						value={state.slug}
						onChange={(e) => set("slug", e.target.value)}
						placeholder="past-simple"
						invalid={!!errors.slug}
					/>
				</FormField>
				<FormField label="Tên (EN)" htmlFor="name" required error={errors.name}>
					<Input
						id="name"
						value={state.name}
						onChange={(e) => set("name", e.target.value)}
						invalid={!!errors.name}
					/>
				</FormField>
			</div>

			<FormField label="Tên tiếng Việt" htmlFor="vn_name" error={errors.vietnamese_name}>
				<Input
					id="vn_name"
					value={state.vietnamese_name ?? ""}
					onChange={(e) => set("vietnamese_name", e.target.value)}
				/>
			</FormField>

			<FormField label="Tóm tắt" htmlFor="summary" required error={errors.summary}>
				<Textarea
					id="summary"
					value={state.summary}
					onChange={(e) => set("summary", e.target.value)}
					rows={2}
					invalid={!!errors.summary}
				/>
			</FormField>

			<div className="grid grid-cols-2 gap-3">
				<FormField label="Category" htmlFor="category" required error={errors.category}>
					<Select
						id="category"
						value={state.category}
						onChange={(e) => set("category", e.target.value as GrammarCategory)}
					>
						{GRAMMAR_CATEGORIES.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</Select>
				</FormField>
				<FormField label="Thứ tự" htmlFor="display_order" error={errors.display_order}>
					<Input
						id="display_order"
						type="number"
						value={state.display_order}
						onChange={(e) => set("display_order", Number(e.target.value))}
					/>
				</FormField>
			</div>

			<div className="grid grid-cols-3 gap-3">
				<FormField label="Levels" error={errors.levels} helper="A2 / B1 / B2 / C1">
					<TagInput
						value={state.levels}
						onChange={(v) => set("levels", v as GrammarLevel[])}
						allowed={[...GRAMMAR_LEVELS]}
						placeholder="B1, B2…"
					/>
				</FormField>
				<FormField label="VSTEP tasks" error={errors.tasks} helper="WT1, SP2…">
					<TagInput
						value={state.tasks}
						onChange={(v) => set("tasks", v as GrammarTask[])}
						allowed={GRAMMAR_TASKS}
					/>
				</FormField>
				<FormField label="Functions" error={errors.functions} helper="Tự do.">
					<TagInput
						value={state.functions}
						onChange={(v) => set("functions", v)}
						placeholder="expressing time…"
					/>
				</FormField>
			</div>

			<Switch
				id="is_published"
				checked={state.is_published}
				onChange={(v) => set("is_published", v)}
				label="Đã xuất bản"
			/>

			{generic && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{generic}</div>}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" onClick={onCancel} disabled={submitting}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					{initial ? "Cập nhật" : "Tạo điểm ngữ pháp"}
				</Button>
			</div>
		</form>
	)
}
