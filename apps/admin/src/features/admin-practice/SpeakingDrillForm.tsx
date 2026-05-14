import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { Textarea } from "#/components/Textarea"
import type { AdminSpeakingDrill, SpeakingDrillFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminSpeakingDrill
	onSubmit: (input: SpeakingDrillFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

const LEVELS: SpeakingDrillFormInput["level"][] = ["A2", "B1", "B2", "C1"]

export function SpeakingDrillForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<SpeakingDrillFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		description: initial?.description ?? "",
		level: initial?.level ?? "B1",
		estimated_minutes: initial?.estimated_minutes ?? 10,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof SpeakingDrillFormInput>(k: K, v: SpeakingDrillFormInput[K]): void {
		setState((s) => ({ ...s, [k]: v }))
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
				setGeneric(Object.values(x.errors).flat().join(" • ") || x.message)
			} else {
				setGeneric(x.message)
			}
		}
	}

	return (
		<form onSubmit={handle} className="flex flex-col gap-4">
			<div className="grid grid-cols-2 gap-3">
				<FormField label="Slug" htmlFor="slug" required error={errors.slug}>
					<Input
						id="slug"
						value={state.slug}
						onChange={(e) => set("slug", e.target.value)}
						invalid={!!errors.slug}
					/>
				</FormField>
				<FormField label="Tiêu đề" htmlFor="title" required error={errors.title}>
					<Input
						id="title"
						value={state.title}
						onChange={(e) => set("title", e.target.value)}
						invalid={!!errors.title}
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
					<Select
						id="level"
						value={state.level}
						onChange={(e) => set("level", e.target.value as SpeakingDrillFormInput["level"])}
					>
						{LEVELS.map((l) => (
							<option key={l} value={l}>
								{l}
							</option>
						))}
					</Select>
				</FormField>
				<FormField label="Thời lượng (phút)" htmlFor="minutes" required error={errors.estimated_minutes}>
					<Input
						id="minutes"
						type="number"
						min={1}
						value={state.estimated_minutes}
						onChange={(e) => set("estimated_minutes", Number(e.target.value))}
					/>
				</FormField>
				<div className="flex items-end pb-2">
					<Switch checked={state.is_published} onChange={(v) => set("is_published", v)} label="Đã xuất bản" />
				</div>
			</div>

			{generic && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{generic}</div>}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" onClick={onCancel} disabled={submitting}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					{initial ? "Cập nhật" : "Tạo bài phát âm"}
				</Button>
			</div>
		</form>
	)
}
