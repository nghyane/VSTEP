import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { TagInput } from "#/components/TagInput"
import { Textarea } from "#/components/Textarea"
import type { AdminSpeakingScenario, SpeakingScenarioFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminSpeakingScenario
	onSubmit: (input: SpeakingScenarioFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

const LEVELS: SpeakingScenarioFormInput["level"][] = ["A1", "A2", "B1", "B2", "C1"]

const VOICE_OPTIONS = [
	{ value: "us Sierra", label: "Sierra (US Female)" },
	{ value: "us Adam", label: "Adam (US Male)" },
	{ value: "uk Emma", label: "Emma (UK Female)" },
	{ value: "uk James", label: "James (UK Male)" },
]

export function SpeakingScenarioForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<SpeakingScenarioFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		level: initial?.level ?? "A2",
		character_name: initial?.character_name ?? "",
		character_voice_label: initial?.character_voice_label ?? "us Sierra",
		description: initial?.description ?? "",
		system_prompt: initial?.system_prompt ?? "",
		opening_line: initial?.opening_line ?? "",
		target_vocab: initial?.target_vocab ?? [],
		estimated_minutes: initial?.estimated_minutes ?? 5,
		expected_turns: initial?.expected_turns ?? 6,
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof SpeakingScenarioFormInput>(k: K, v: SpeakingScenarioFormInput[K]): void {
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
		<form onSubmit={handle}>
			<Flex vertical gap={16}>
				<Row gutter={12}>
					<Col span={12}>
						<FormField label="Slug" htmlFor="slug" required error={errors.slug}>
							<Input
								id="slug"
								value={state.slug}
								onChange={(e) => set("slug", e.target.value)}
								invalid={!!errors.slug}
								placeholder="greeting-a-new-colleague"
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Tiêu đề" htmlFor="title" required error={errors.title}>
							<Input
								id="title"
								value={state.title}
								onChange={(e) => set("title", e.target.value)}
								invalid={!!errors.title}
								placeholder="Greeting a new colleague"
							/>
						</FormField>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col span={8}>
						<FormField label="Tên nhân vật" htmlFor="character_name" required error={errors.character_name}>
							<Input
								id="character_name"
								value={state.character_name}
								onChange={(e) => set("character_name", e.target.value)}
								invalid={!!errors.character_name}
								placeholder="Patricia"
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Giọng nói" htmlFor="character_voice_label" required error={errors.character_voice_label}>
							<Select
								id="character_voice_label"
								value={state.character_voice_label}
								onChange={(e) => set("character_voice_label", e.target.value)}
							>
								{VOICE_OPTIONS.map((v) => (
									<option key={v.value} value={v.value}>
										{v.label}
									</option>
								))}
							</Select>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Level" htmlFor="level" required error={errors.level}>
							<Select
								id="level"
								value={state.level}
								onChange={(e) => set("level", e.target.value as SpeakingScenarioFormInput["level"])}
							>
								{LEVELS.map((l) => (
									<option key={l} value={l}>
										{l}
									</option>
								))}
							</Select>
						</FormField>
					</Col>
				</Row>

				<FormField label="Mô tả tình huống" htmlFor="description" required error={errors.description}>
					<Textarea
						id="description"
						value={state.description}
						onChange={(e) => set("description", e.target.value)}
						rows={3}
						placeholder="Patricia is your new colleague. Today is her first day at the company..."
					/>
				</FormField>

				<FormField label="Câu mở đầu (AI nói trước)" htmlFor="opening_line" required error={errors.opening_line}>
					<Textarea
						id="opening_line"
						value={state.opening_line}
						onChange={(e) => set("opening_line", e.target.value)}
						rows={2}
						placeholder="Hi there! I just started working here today. It is nice to meet you!"
					/>
				</FormField>

				<FormField label="System Prompt (cho AI)" htmlFor="system_prompt" required error={errors.system_prompt}>
					<Textarea
						id="system_prompt"
						value={state.system_prompt}
						onChange={(e) => set("system_prompt", e.target.value)}
						rows={4}
						placeholder="You are Patricia, a friendly new employee. Respond naturally and keep the conversation going..."
					/>
				</FormField>

				<FormField label="Từ vựng mục tiêu" htmlFor="target_vocab" error={errors.target_vocab}>
					<TagInput
						value={state.target_vocab}
						onChange={(v) => set("target_vocab", v)}
						placeholder="Nhập từ/cụm từ và nhấn Enter"
					/>
				</FormField>

				<Row gutter={12}>
					<Col span={8}>
						<FormField label="Thời lượng (phút)" htmlFor="estimated_minutes" required error={errors.estimated_minutes}>
							<Input
								id="estimated_minutes"
								type="number"
								min={1}
								value={state.estimated_minutes}
								onChange={(e) => set("estimated_minutes", Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Số lượt nói dự kiến" htmlFor="expected_turns" required error={errors.expected_turns}>
							<Input
								id="expected_turns"
								type="number"
								min={2}
								value={state.expected_turns}
								onChange={(e) => set("expected_turns", Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<Flex align="end" style={{ height: "100%", paddingBottom: 8 }}>
							<Switch
								checked={state.is_published}
								onChange={(v) => set("is_published", v)}
								label="Đã xuất bản"
							/>
						</Flex>
					</Col>
				</Row>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo kịch bản"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
