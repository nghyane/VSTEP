import { Alert, Select as AntdSelect, Divider, Flex, InputNumber } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import {
	SocialEditor,
	SolutionEditor,
	sanitizeSpeakingContent,
	speakingDefaults,
	TopicEditor,
} from "#/features/admin-exams/SpeakingContentEditors"
import { extractError } from "#/lib/api"

type SpeakingType = "social" | "solution" | "topic"

interface SpeakingPartFormInput {
	part: number
	type: SpeakingType
	duration_minutes: number
	speaking_seconds: number
	content: Record<string, unknown>
}

interface Props {
	initial?: {
		part: number
		type: string
		duration_minutes: number | null
		speaking_seconds: number | null
		content: Record<string, unknown>
	}
	onSubmit: (input: SpeakingPartFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

function isKnownType(type: string): type is SpeakingType {
	return type === "social" || type === "solution" || type === "topic"
}

export function SpeakingPartForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const initialType = initial && isKnownType(initial.type) ? initial.type : "topic"

	const [state, setState] = useState<SpeakingPartFormInput>({
		part: initial?.part ?? 1,
		type: initialType,
		duration_minutes: initial?.duration_minutes ?? 3,
		speaking_seconds: initial?.speaking_seconds ?? 60,
		content:
			initial?.content && Object.keys(initial.content).length > 0
				? initial.content
				: speakingDefaults[initialType],
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof SpeakingPartFormInput>(key: K, value: SpeakingPartFormInput[K]) {
		setState((s) => ({ ...s, [key]: value }))
	}

	function changeType(next: SpeakingType) {
		setState((s) => ({ ...s, type: next, content: speakingDefaults[next] }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			const cleaned = sanitizeSpeakingContent(state.type, state.content)
			await onSubmit({ ...state, content: cleaned })
		} catch (err) {
			const x = await extractError(err)
			if (x.errors) setErrors(x.errors)
			else setGeneric(x.message)
		}
	}

	return (
		<form onSubmit={handle}>
			{generic && <Alert type="error" description={generic} style={{ marginBottom: 16 }} />}
			<Flex gap={16} align="start" wrap>
				<FormField label="Part" required error={errors.part} style={{ flex: "1 1 200px", minWidth: 160 }}>
					<AntdSelect
						value={state.part}
						onChange={(v) => set("part", v)}
						style={{ width: "100%" }}
						options={[
							{ value: 1, label: "Part 1" },
							{ value: 2, label: "Part 2" },
							{ value: 3, label: "Part 3" },
						]}
					/>
				</FormField>
				<FormField label="Loại" required error={errors.type} style={{ flex: "1 1 200px", minWidth: 160 }}>
					<AntdSelect
						value={state.type}
						onChange={changeType}
						style={{ width: "100%" }}
						options={[
							{ value: "social", label: "Social interaction" },
							{ value: "solution", label: "Solution discussion" },
							{ value: "topic", label: "Topic development" },
						]}
					/>
				</FormField>
			</Flex>
			<Flex gap={16} align="start" wrap>
				<FormField
					label="Thời gian chuẩn bị (phút)"
					required
					error={errors.duration_minutes}
					style={{ flex: "1 1 200px", minWidth: 200 }}
				>
					<InputNumber
						value={state.duration_minutes}
						onChange={(v) => set("duration_minutes", v ?? 1)}
						min={1}
						style={{ width: "100%" }}
					/>
				</FormField>
				<FormField
					label="Thời gian nói (giây)"
					required
					error={errors.speaking_seconds}
					style={{ flex: "1 1 200px", minWidth: 200 }}
				>
					<InputNumber
						value={state.speaking_seconds}
						onChange={(v) => set("speaking_seconds", v ?? 30)}
						min={1}
						style={{ width: "100%" }}
					/>
				</FormField>
			</Flex>

			<Divider style={{ margin: "8px 0 16px" }} titlePlacement="start">
				Nội dung
			</Divider>

			<div
				style={{
					maxHeight: "50vh",
					overflowY: "auto",
					paddingRight: 12,
					marginRight: -12,
				}}
			>
				{state.type === "social" && (
					<SocialEditor
						value={state.content as unknown as Parameters<typeof SocialEditor>[0]["value"]}
						onChange={(v) => set("content", v as unknown as Record<string, unknown>)}
						errors={errors}
					/>
				)}
				{state.type === "solution" && (
					<SolutionEditor
						value={state.content as unknown as Parameters<typeof SolutionEditor>[0]["value"]}
						onChange={(v) => set("content", v as unknown as Record<string, unknown>)}
						errors={errors}
					/>
				)}
				{state.type === "topic" && (
					<TopicEditor
						value={state.content as unknown as Parameters<typeof TopicEditor>[0]["value"]}
						onChange={(v) => set("content", v as unknown as Record<string, unknown>)}
						errors={errors}
					/>
				)}
			</div>

			<Divider style={{ margin: "16px 0" }} />
			<Flex justify="end" gap={8}>
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
