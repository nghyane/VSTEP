import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import type { AdminScheduleItem, ScheduleItemFormInput } from "#/features/admin-courses/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminScheduleItem
	defaultSessionNumber?: number
	/** course.start_date (YYYY-MM-DD hoặc ATOM) — chặn chọn ngày trước khóa. */
	minDate?: string
	/** course.end_date — chặn chọn ngày sau khóa. */
	maxDate?: string
	onSubmit: (input: ScheduleItemFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

function toDateInput(value: string | undefined): string {
	if (!value) return ""
	return value.length >= 10 ? value.slice(0, 10) : value
}

export function ScheduleItemForm({
	initial,
	defaultSessionNumber,
	minDate,
	maxDate,
	onSubmit,
	onCancel,
	submitting,
}: Props) {
	const [state, setState] = useState<ScheduleItemFormInput>({
		session_number: initial?.session_number ?? defaultSessionNumber ?? 1,
		date: toDateInput(initial?.date),
		start_time: initial?.start_time ?? "19:00",
		end_time: initial?.end_time ?? "21:00",
		topic: initial?.topic ?? "",
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof ScheduleItemFormInput>(k: K, v: ScheduleItemFormInput[K]): void {
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
			if (x.errors && Object.keys(x.errors).length > 0) {
				setErrors(x.errors)
				setGeneric("Vui lòng kiểm tra các trường được đánh dấu đỏ.")
			} else {
				setGeneric(x.message)
			}
		}
	}

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={4}>
				<Row gutter={16}>
					<Col span={8}>
						<FormField label="Số buổi" htmlFor="session_number" error={errors.session_number}>
							<Input
								id="session_number"
								type="number"
								min={1}
								value={state.session_number ?? ""}
								onChange={(e) => set("session_number", e.target.value === "" ? null : Number(e.target.value))}
								invalid={!!errors.session_number}
							/>
						</FormField>
					</Col>
					<Col span={16}>
						<FormField
							label="Ngày"
							htmlFor="date"
							required
							error={errors.date}
							helper={
								minDate && maxDate
									? `Phải nằm trong khoảng ${toDateInput(minDate)} đến ${toDateInput(maxDate)}`
									: undefined
							}
						>
							<Input
								id="date"
								type="date"
								min={toDateInput(minDate)}
								max={toDateInput(maxDate)}
								value={state.date}
								onChange={(e) => set("date", e.target.value)}
								invalid={!!errors.date}
							/>
						</FormField>
					</Col>
				</Row>

				<Row gutter={16}>
					<Col span={12}>
						<FormField label="Giờ bắt đầu" htmlFor="start_time" required error={errors.start_time}>
							<Input
								id="start_time"
								type="time"
								value={state.start_time}
								onChange={(e) => set("start_time", e.target.value)}
								invalid={!!errors.start_time}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Giờ kết thúc" htmlFor="end_time" required error={errors.end_time}>
							<Input
								id="end_time"
								type="time"
								value={state.end_time}
								min={state.start_time || undefined}
								onChange={(e) => set("end_time", e.target.value)}
								invalid={!!errors.end_time}
							/>
						</FormField>
					</Col>
				</Row>

				<FormField label="Chủ đề" htmlFor="topic" required error={errors.topic}>
					<Input
						id="topic"
						value={state.topic}
						onChange={(e) => set("topic", e.target.value)}
						invalid={!!errors.topic}
						placeholder="VD: Listening Part 1 - Short conversations"
					/>
				</FormField>

				{generic && <Alert type="error" message={generic} showIcon style={{ marginTop: 8 }} />}

				<Flex justify="end" gap={8} style={{ paddingTop: 12 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Thêm buổi"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
