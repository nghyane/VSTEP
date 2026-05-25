import { Alert, Select as AntdSelect, Flex, InputNumber } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { extractError } from "#/lib/api"

interface SectionFormInput {
	part: number
	part_title: string
	duration_minutes: number
	audio_url: string
}

interface Props {
	initial?: {
		part: number
		part_title: string | null
		duration_minutes: number | null
		audio_url: string | null
	}
	onSubmit: (input: SectionFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

export function ListeningSectionForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<SectionFormInput>({
		part: initial?.part ?? 1,
		part_title: initial?.part_title ?? "",
		duration_minutes: initial?.duration_minutes ?? 5,
		audio_url: initial?.audio_url ?? "",
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof SectionFormInput>(key: K, value: SectionFormInput[K]) {
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
			if (x.errors) setErrors(x.errors)
			else setGeneric(x.message)
		}
	}

	return (
		<form onSubmit={handle}>
			{generic && <Alert type="error" description={generic} style={{ marginBottom: 12 }} />}
			<Flex gap={12}>
				<FormField label="Part" required error={errors.part} style={{ width: 100 }}>
					<AntdSelect
						value={state.part}
						onChange={(v) => set("part", v)}
						options={[
							{ value: 1, label: "Part 1" },
							{ value: 2, label: "Part 2" },
							{ value: 3, label: "Part 3" },
						]}
					/>
				</FormField>
				<FormField label="Thời lượng (phút)" required error={errors.duration_minutes} style={{ width: 140 }}>
					<InputNumber
						value={state.duration_minutes}
						onChange={(v) => set("duration_minutes", v ?? 1)}
						min={1}
						style={{ width: "100%" }}
					/>
				</FormField>
			</Flex>
			<FormField label="Tiêu đề" required error={errors.part_title}>
				<Input value={state.part_title} onChange={(e) => set("part_title", e.target.value)} />
			</FormField>
			<FormField label="Audio URL" error={errors.audio_url}>
				<Input
					value={state.audio_url}
					onChange={(e) => set("audio_url", e.target.value)}
					placeholder="https://..."
				/>
			</FormField>
			<Flex justify="end" gap={8} style={{ marginTop: 16 }}>
				<Button variant="ghost" onClick={onCancel}>
					Huỷ
				</Button>
				<Button type="submit" loading={submitting}>
					Lưu
				</Button>
			</Flex>
		</form>
	)
}
