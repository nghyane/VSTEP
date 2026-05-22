import { Alert, Col, Flex, Row } from "antd"
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

const LEVELS: SpeakingDrillFormInput["level"][] = ["A1", "A2", "B1", "B2", "C1"]

export function SpeakingDrillForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [state, setState] = useState<SpeakingDrillFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		description: initial?.description ?? "",
		level: initial?.level ?? "B1",
		estimated_minutes: initial?.estimated_minutes ?? 10,
		audio_url: initial?.audio_url ?? "",
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
							/>
						</FormField>
					</Col>
				</Row>

				<FormField label="Mô tả" htmlFor="description" error={errors.description}>
					<Textarea
						id="description"
						value={state.description ?? ""}
						onChange={(e) => set("description", e.target.value)}
						rows={2}
					/>
				</FormField>

				<FormField label="Audio URL" htmlFor="audio_url" error={errors.audio_url}>
					<Input
						id="audio_url"
						value={state.audio_url ?? ""}
						onChange={(e) => set("audio_url", e.target.value || null)}
						placeholder="https://cdn.example.com/audio.mp3"
					/>
				</FormField>

				<Row gutter={12}>
					<Col span={8}>
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
					</Col>
					<Col span={8}>
						<FormField label="Thời lượng (phút)" htmlFor="minutes" required error={errors.estimated_minutes}>
							<Input
								id="minutes"
								type="number"
								min={1}
								value={state.estimated_minutes}
								onChange={(e) => set("estimated_minutes", Number(e.target.value))}
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
						{initial ? "Cập nhật" : "Tạo bài phát âm"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
