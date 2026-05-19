import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import type { AdminTeacherSlot, SlotFormInput } from "#/features/admin-courses/types"
import {
	isoToLocalDateTimeInput,
	localDateTimeInputToIso,
	nowPlusHoursLocalInput,
} from "#/features/admin-courses/utils"
import { extractError, formatApiErrorBanner } from "#/lib/api"

interface Props {
	initial?: AdminTeacherSlot
	courseStartDate: string
	courseEndDate: string
	onSubmit: (input: SlotFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

// "YYYY-MM-DDTHH:mm" theo local TZ — phục vụ thuộc tính min/max của datetime-local.
function dateOnlyToLocalInputBound(date: string, endOfDay: boolean): string {
	const slice = date.length >= 10 ? date.slice(0, 10) : date
	return endOfDay ? `${slice}T23:59` : `${slice}T00:00`
}

// So sánh string "YYYY-MM-DDTHH:mm" cùng format → string compare đúng thứ tự thời gian.
function maxLocalInput(a: string, b: string): string {
	return a > b ? a : b
}

export function SlotForm({ initial, courseStartDate, courseEndDate, onSubmit, onCancel, submitting }: Props) {
	const [startsAtLocal, setStartsAtLocal] = useState<string>(
		initial ? isoToLocalDateTimeInput(initial.starts_at) : nowPlusHoursLocalInput(24),
	)
	const [duration, setDuration] = useState<number>(initial?.duration_minutes ?? 30)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({
				starts_at: localDateTimeInputToIso(startsAtLocal),
				duration_minutes: duration,
			})
		} catch (err) {
			const x = await extractError(err)
			if (x.errors && Object.keys(x.errors).length > 0) {
				setErrors(x.errors)
			}
			setGeneric(formatApiErrorBanner(x))
		}
	}

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={4}>
				<Row gutter={16}>
					<Col span={14}>
						<FormField label="Bắt đầu lúc" htmlFor="starts_at" required error={errors.starts_at}>
							<Input
								id="starts_at"
								type="datetime-local"
								value={startsAtLocal}
								onChange={(e) => setStartsAtLocal(e.target.value)}
								// Slot phải nằm trong [course.start_date, course.end_date]; tránh
								// admin pick ngày ngoài range rồi BE reject.
								min={
									initial
										? dateOnlyToLocalInputBound(courseStartDate, false)
										: maxLocalInput(
												nowPlusHoursLocalInput(0),
												dateOnlyToLocalInputBound(courseStartDate, false),
											)
								}
								max={dateOnlyToLocalInputBound(courseEndDate, true)}
								invalid={!!errors.starts_at}
							/>
						</FormField>
					</Col>
					<Col span={10}>
						<FormField
							label="Thời lượng (phút)"
							htmlFor="duration_minutes"
							required
							error={errors.duration_minutes}
						>
							<Input
								id="duration_minutes"
								type="number"
								min={15}
								max={180}
								step={5}
								value={duration}
								onChange={(e) => setDuration(Number(e.target.value))}
								invalid={!!errors.duration_minutes}
							/>
						</FormField>
					</Col>
				</Row>

				{generic && <Alert type="error" message={generic} showIcon style={{ marginTop: 8 }} />}

				<Flex justify="end" gap={8} style={{ paddingTop: 12 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo slot"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
