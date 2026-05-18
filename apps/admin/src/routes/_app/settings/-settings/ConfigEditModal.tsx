import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { Alert, App, Button, Form, Input, InputNumber, Modal, Select, Space, Switch, Typography } from "antd"
import { type FormEvent, useEffect, useMemo, useState } from "react"
import { extractError } from "#/lib/api"
import { useUpdateSystemConfig } from "./queries"
import type { ConfigSchema, Milestone, SystemConfigRow } from "./types"
import { keyDescription, keyLabel } from "./utils"

interface Props {
	open: boolean
	config: SystemConfigRow | null
	onClose: () => void
}

export function ConfigEditModal({ open, config, onClose }: Props) {
	const { message } = App.useApp()
	const mutation = useUpdateSystemConfig()
	const [draft, setDraft] = useState<unknown>(null)
	const [jsonText, setJsonText] = useState("")
	const [jsonError, setJsonError] = useState<string | null>(null)
	const [generic, setGeneric] = useState<string | null>(null)

	const schema: ConfigSchema = config?.schema ?? { type: "auto" }
	const isAuto = schema.type === "auto"

	useEffect(() => {
		if (!config) return
		setGeneric(null)
		setJsonError(null)
		if (isAuto) {
			setJsonText(JSON.stringify(config.value, null, 2))
		} else {
			setDraft(config.value)
		}
	}, [config, isAuto])

	const width = useMemo(() => {
		if (schema.type === "milestones" || schema.type === "level_costs" || isAuto) return 640
		return 480
	}, [schema.type, isAuto])

	if (!config) return null

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!config) return
		setGeneric(null)
		setJsonError(null)

		let value: unknown = draft
		if (isAuto) {
			try {
				value = JSON.parse(jsonText)
			} catch (err) {
				setJsonError(`JSON không hợp lệ: ${(err as Error).message}`)
				return
			}
		}

		try {
			await mutation.mutateAsync({ key: config.key, value })
			message.success("Đã cập nhật")
			onClose()
		} catch (err) {
			const x = await extractError(err)
			setGeneric(x.message || "Cập nhật thất bại")
		}
	}

	return (
		<Modal
			open={open}
			title={`Cập nhật: ${keyLabel(config.key)}`}
			onCancel={onClose}
			footer={null}
			destroyOnHidden
			centered
			width={width}
		>
			<form onSubmit={handle}>
				<Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
					{keyDescription(config.key, config.description)}
				</Typography.Paragraph>

				<Form layout="vertical" component="div">
					<Form.Item label="Giá trị">
						<SchemaEditor
							schema={schema}
							value={draft}
							onChange={setDraft}
							jsonText={jsonText}
							onJsonChange={setJsonText}
							jsonError={jsonError}
						/>
					</Form.Item>
				</Form>

				{jsonError && <Alert type="error" description={jsonError} style={{ marginBottom: 12 }} />}
				{generic && <Alert type="error" description={generic} style={{ marginBottom: 12 }} />}

				<div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
					<Button onClick={onClose} disabled={mutation.isPending}>
						Huỷ
					</Button>
					<Button type="primary" htmlType="submit" loading={mutation.isPending}>
						Lưu thay đổi
					</Button>
				</div>
			</form>
		</Modal>
	)
}

interface EditorProps {
	schema: ConfigSchema
	value: unknown
	onChange: (v: unknown) => void
	jsonText: string
	onJsonChange: (v: string) => void
	jsonError: string | null
}

function SchemaEditor({ schema, value, onChange, jsonText, onJsonChange, jsonError }: EditorProps) {
	if (schema.type === "boolean") {
		return <Switch checked={Boolean(value)} onChange={onChange} />
	}

	if (schema.type === "number") {
		return (
			<InputNumber
				value={value as number}
				onChange={(v) => onChange(v ?? 0)}
				min={schema.min}
				max={schema.max}
				step={schema.integer ? 1 : 0.1}
				precision={schema.integer ? 0 : undefined}
				style={{ width: "100%" }}
			/>
		)
	}

	if (schema.type === "string") {
		return <Input value={value as string} onChange={(e) => onChange(e.target.value)} />
	}

	if (schema.type === "timezone") {
		return (
			<Select
				showSearch
				value={value as string}
				onChange={onChange}
				options={schema.options.map((tz) => ({ value: tz, label: tz }))}
				style={{ width: "100%" }}
				placeholder="Chọn timezone..."
			/>
		)
	}

	if (schema.type === "milestones") {
		return <MilestonesEditor value={(value as Milestone[]) ?? []} onChange={onChange} />
	}

	if (schema.type === "level_costs") {
		return <LevelCostsEditor value={(value as Record<string, number>) ?? {}} onChange={onChange} />
	}

	return (
		<Input.TextArea
			value={jsonText}
			onChange={(e) => onJsonChange(e.target.value)}
			autoSize={{ minRows: 6, maxRows: 18 }}
			style={{ fontFamily: "monospace", fontSize: 13 }}
			status={jsonError ? "error" : undefined}
		/>
	)
}

function MilestonesEditor({ value, onChange }: { value: Milestone[]; onChange: (v: Milestone[]) => void }) {
	const update = (idx: number, patch: Partial<Milestone>) => {
		onChange(value.map((m, i) => (i === idx ? { ...m, ...patch } : m)))
	}
	const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))
	const add = () => onChange([...value, { days: 7, coins: 100 }])

	return (
		<Space direction="vertical" style={{ width: "100%" }} size={8}>
			{value.map((m, idx) => (
				<Space key={idx} align="center">
					<InputNumber
						value={m.days}
						onChange={(v) => update(idx, { days: Number(v) || 0 })}
						min={1}
						addonBefore="Ngày"
						style={{ width: 140 }}
					/>
					<span>→</span>
					<InputNumber
						value={m.coins}
						onChange={(v) => update(idx, { coins: Number(v) || 0 })}
						min={0}
						addonAfter="xu"
						style={{ width: 160 }}
					/>
					<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(idx)} />
				</Space>
			))}
			<Button type="dashed" icon={<PlusOutlined />} onClick={add} block>
				Thêm mốc
			</Button>
		</Space>
	)
}

function LevelCostsEditor({
	value,
	onChange,
}: {
	value: Record<string, number>
	onChange: (v: Record<string, number>) => void
}) {
	const entries = Object.entries(value)
	const update = (level: string, coins: number) => onChange({ ...value, [level]: coins })
	const remove = (level: string) => {
		const next = { ...value }
		delete next[level]
		onChange(next)
	}
	const add = () => {
		const next = String((entries.length ? Math.max(...entries.map(([k]) => Number(k) || 0)) : 0) + 1)
		onChange({ ...value, [next]: 1 })
	}

	return (
		<Space direction="vertical" style={{ width: "100%" }} size={8}>
			{entries.map(([level, coins]) => (
				<Space key={level} align="center">
					<InputNumber value={Number(level)} disabled addonBefore="Level" style={{ width: 140 }} />
					<span>→</span>
					<InputNumber
						value={coins}
						onChange={(v) => update(level, Number(v) || 0)}
						min={0}
						addonAfter="xu"
						style={{ width: 160 }}
					/>
					<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(level)} />
				</Space>
			))}
			<Button type="dashed" icon={<PlusOutlined />} onClick={add} block>
				Thêm level
			</Button>
		</Space>
	)
}
