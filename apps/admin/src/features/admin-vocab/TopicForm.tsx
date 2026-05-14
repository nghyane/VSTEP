import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminVocabTopic, TopicFormInput, VocabLevel, VocabTask } from "#/features/admin-vocab/types"
import { VOCAB_LEVELS, VOCAB_TASKS } from "#/features/admin-vocab/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminVocabTopic
	onSubmit: (input: TopicFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

const ICON_KEYS = ["family", "sun", "briefcase", "heart", "leaf", "graduation", "globe", "book"]

export function TopicForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<TopicFormInput>({
		slug: initial?.slug ?? "",
		name: initial?.name ?? "",
		description: initial?.description ?? "",
		level: (initial?.level as VocabLevel) ?? "B1",
		icon_key: initial?.icon_key ?? "family",
		display_order: initial?.display_order ?? 0,
		is_published: initial?.is_published ?? false,
		tasks: (initial?.tasks ?? []) as VocabTask[],
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof TopicFormInput>(key: K, value: TopicFormInput[K]): void {
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
						placeholder="vd: family-life"
						invalid={!!errors.slug}
					/>
				</FormField>
				<FormField label="Tên chủ đề" htmlFor="name" required error={errors.name}>
					<Input
						id="name"
						value={state.name}
						onChange={(e) => set("name", e.target.value)}
						invalid={!!errors.name}
					/>
				</FormField>
			</div>

			<FormField label="Mô tả" htmlFor="description" error={errors.description}>
				<Textarea
					id="description"
					value={state.description ?? ""}
					onChange={(e) => set("description", e.target.value)}
					rows={2}
				/>
			</FormField>

			<div className="grid grid-cols-3 gap-3">
				<FormField label="Level" htmlFor="level" required error={errors.level}>
					<Select id="level" value={state.level} onChange={(e) => set("level", e.target.value as VocabLevel)}>
						{VOCAB_LEVELS.map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</Select>
				</FormField>
				<FormField label="Icon" htmlFor="icon_key" required error={errors.icon_key}>
					<Select id="icon_key" value={state.icon_key} onChange={(e) => set("icon_key", e.target.value)}>
						{ICON_KEYS.map((k) => (
							<option key={k} value={k}>
								{k}
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

			<FormField
				label="VSTEP tasks (gắn với task nào)"
				error={errors.tasks}
				helper="Bấm Enter để thêm. Cho phép: WT1, WT2, SP1, SP2, SP3, READ."
			>
				<TagInput
					value={state.tasks}
					onChange={(v) => set("tasks", v as VocabTask[])}
					allowed={VOCAB_TASKS}
					placeholder="WT1, SP2…"
				/>
			</FormField>

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
					{initial ? "Cập nhật" : "Tạo chủ đề"}
				</Button>
			</div>
		</form>
	)
}
