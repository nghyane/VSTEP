import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminListeningExercise, ListeningFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminListeningExercise
	onSubmit: (input: ListeningFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ListeningForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<ListeningFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		description: initial?.description ?? "",
		part: initial?.part ?? 1,
		audio_url: initial?.audio_url ?? "",
		transcript: initial?.transcript ?? "",
		vietnamese_transcript: initial?.vietnamese_transcript ?? "",
		word_timestamps: initial?.word_timestamps ?? [],
		keywords: initial?.keywords ?? [],
		estimated_minutes: initial?.estimated_minutes ?? 10,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof ListeningFormInput>(k: K, v: ListeningFormInput[K]): void {
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
						placeholder="listening-part-1-conv-1"
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
				<FormField label="Part" htmlFor="part" required error={errors.part}>
					<Select id="part" value={state.part} onChange={(e) => set("part", Number(e.target.value))}>
						<option value={1}>Part 1 — Short conversations</option>
						<option value={2}>Part 2 — Talks</option>
						<option value={3}>Part 3 — Long talks</option>
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

			<FormField
				label="Audio URL"
				htmlFor="audio_url"
				error={errors.audio_url}
				helper="R2 key hoặc URL public."
			>
				<Input
					id="audio_url"
					value={state.audio_url ?? ""}
					onChange={(e) => set("audio_url", e.target.value)}
					placeholder="r2/listening/part1-conv1.mp3"
				/>
			</FormField>

			<FormField label="Transcript (EN)" htmlFor="transcript" required error={errors.transcript}>
				<Textarea
					id="transcript"
					value={state.transcript}
					onChange={(e) => set("transcript", e.target.value)}
					rows={4}
					invalid={!!errors.transcript}
				/>
			</FormField>

			<FormField label="Transcript Việt" htmlFor="vn_transcript" error={errors.vietnamese_transcript}>
				<Textarea
					id="vn_transcript"
					value={state.vietnamese_transcript ?? ""}
					onChange={(e) => set("vietnamese_transcript", e.target.value)}
					rows={3}
				/>
			</FormField>

			<FormField label="Keywords" error={errors.keywords} helper="Enter để thêm.">
				<TagInput value={state.keywords} onChange={(v) => set("keywords", v)} />
			</FormField>

			{generic && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{generic}</div>}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="ghost" onClick={onCancel} disabled={submitting}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					{initial ? "Cập nhật" : "Tạo bài nghe"}
				</Button>
			</div>
		</form>
	)
}
