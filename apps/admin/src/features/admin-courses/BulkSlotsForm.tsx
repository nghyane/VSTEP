import { CloseOutlined, PlusOutlined } from "@ant-design/icons"
import { Alert, Col, Flex, Row, Space } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import type { BulkSlotsInput } from "#/features/admin-courses/types"
import { addDaysISO, todayISO } from "#/features/admin-courses/utils"
import { extractError, formatApiErrorBanner } from "#/lib/api"

interface Props {
	courseStartDate: string
	courseEndDate: string
	onSubmit: (input: BulkSlotsInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

// Course.start/end_date có thể là ATOM hoặc YYYY-MM-DD. Lấy 10 ký tự đầu để dùng với <input type="date">.
function toDateOnly(d: string): string {
	return d.length >= 10 ? d.slice(0, 10) : d
}

// max("2026-05-01", "2026-05-19") = "2026-05-19" — string ISO date so sánh đúng thứ tự.
function maxDateISO(a: string, b: string): string {
	return a > b ? a : b
}

// Hiển thị theo thứ tự tuần học: T2-T7-CN. Value khớp Carbon dayOfWeek (0=CN).
const WEEKDAYS: { label: string; value: number }[] = [
	{ label: "T2", value: 1 },
	{ label: "T3", value: 2 },
	{ label: "T4", value: 3 },
	{ label: "T5", value: 4 },
	{ label: "T6", value: 5 },
	{ label: "T7", value: 6 },
	{ label: "CN", value: 0 },
]

export function BulkSlotsForm({ courseStartDate, courseEndDate, onSubmit, onCancel, submitting }: Props) {
	// Default range = intersect course window với "từ hôm nay" — không có ý nghĩa tạo
	// slot trong quá khứ. Cap end_date theo course.end_date để admin không pick ngoài.
	const courseStart = toDateOnly(courseStartDate)
	const courseEnd = toDateOnly(courseEndDate)
	const defaultStart = maxDateISO(courseStart, todayISO())
	const defaultEnd = maxDateISO(
		defaultStart,
		courseEnd > addDaysISO(defaultStart, 28) ? addDaysISO(defaultStart, 28) : courseEnd,
	)
	const [startDate, setStartDate] = useState<string>(defaultStart)
	const [endDate, setEndDate] = useState<string>(defaultEnd)
	const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])
	const [times, setTimes] = useState<string[]>(["19:00", "19:30"])
	const [duration, setDuration] = useState<number>(30)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function toggleWeekday(v: number) {
		setWeekdays((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v].sort()))
	}

	function addTime() {
		setTimes((s) => [...s, "20:00"])
	}

	function updateTime(idx: number, value: string) {
		setTimes((s) => s.map((t, i) => (i === idx ? value : t)))
	}

	function removeTime(idx: number) {
		setTimes((s) => s.filter((_, i) => i !== idx))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({
				start_date: startDate,
				end_date: endDate,
				weekdays,
				times: times.filter((t) => t.trim()),
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

	// Tập thứ thật sự tồn tại trong [startDate, endDate]. Dùng để dim/disable button
	// thứ không khả thi → admin không phải đoán tại sao estimate = 0.
	const availableWeekdaySet = (() => {
		if (!startDate || !endDate || startDate > endDate) return new Set<number>()
		const s = new Date(`${startDate}T00:00:00`)
		const e = new Date(`${endDate}T00:00:00`)
		const set = new Set<number>()
		for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
			set.add(d.getDay())
			if (set.size === 7) break
		}
		return set
	})()

	// Chỉ đếm weekday vừa được chọn vừa có trong range — số slot ước tính chính xác.
	const dayCount = (() => {
		if (availableWeekdaySet.size === 0) return 0
		const s = new Date(`${startDate}T00:00:00`)
		const e = new Date(`${endDate}T00:00:00`)
		let count = 0
		for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
			if (weekdays.includes(d.getDay())) count++
		}
		return count
	})()
	const estimate = dayCount * times.length

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={4}>
				<Row gutter={16}>
					<Col span={12}>
						<FormField label="Từ ngày" htmlFor="start_date" required error={errors.start_date}>
							<Input
								id="start_date"
								type="date"
								min={maxDateISO(courseStart, todayISO())}
								max={courseEnd}
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								invalid={!!errors.start_date}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Đến ngày" htmlFor="end_date" required error={errors.end_date}>
							<Input
								id="end_date"
								type="date"
								min={startDate || maxDateISO(courseStart, todayISO())}
								max={courseEnd}
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								invalid={!!errors.end_date}
							/>
						</FormField>
					</Col>
				</Row>

				<FormField
					label="Các thứ trong tuần"
					required
					error={errors.weekdays}
					helper={
						availableWeekdaySet.size > 0 && availableWeekdaySet.size < 7
							? "Các thứ mờ không nằm trong khoảng ngày đã chọn."
							: undefined
					}
				>
					<Space size={8} wrap>
						{WEEKDAYS.map((d) => {
							const active = weekdays.includes(d.value)
							const inRange = availableWeekdaySet.has(d.value)
							const disabled = availableWeekdaySet.size > 0 && !inRange
							return (
								<button
									key={d.value}
									type="button"
									onClick={() => !disabled && toggleWeekday(d.value)}
									disabled={disabled}
									title={disabled ? "Thứ này không nằm trong khoảng ngày đã chọn" : undefined}
									style={{
										minWidth: 44,
										padding: "6px 12px",
										border: active ? "2px solid #1677ff" : "1px solid #d9d9d9",
										borderRadius: 8,
										background: active ? "#e6f4ff" : "#fff",
										color: active ? "#0958d9" : "rgba(0,0,0,0.65)",
										fontWeight: active ? 700 : 500,
										cursor: disabled ? "not-allowed" : "pointer",
										opacity: disabled ? 0.35 : 1,
									}}
								>
									{d.label}
								</button>
							)
						})}
					</Space>
				</FormField>

				<FormField
					label="Các khung giờ bắt đầu (mỗi entry = 1 slot trong ngày)"
					required
					error={errors.times}
					helper="VD: 19:00, 19:30, 20:00 cho buổi tối 3 slot liên tiếp"
				>
					<Flex vertical gap={6}>
						{times.map((t, idx) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: thứ tự ổn định trong UX edit list cơ bản
							<Flex key={idx} gap={8} align="center">
								<Input
									type="time"
									value={t}
									onChange={(e) => updateTime(idx, e.target.value)}
									style={{ maxWidth: 140 }}
								/>
								<button
									type="button"
									onClick={() => removeTime(idx)}
									disabled={times.length <= 1}
									style={{
										background: "none",
										border: 0,
										padding: 4,
										cursor: times.length <= 1 ? "not-allowed" : "pointer",
										color: times.length <= 1 ? "#cbd5e1" : "#ef4444",
									}}
									aria-label="Xóa giờ"
								>
									<CloseOutlined />
								</button>
							</Flex>
						))}
						<Button variant="ghost" icon={<PlusOutlined />} onClick={addTime} type="button">
							Thêm giờ
						</Button>
					</Flex>
				</FormField>

				<FormField
					label="Thời lượng mỗi slot (phút)"
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
						style={{ maxWidth: 140 }}
					/>
				</FormField>

				<Alert
					type="info"
					showIcon
					style={{ marginTop: 4 }}
					message={
						estimate > 0
							? `Sẽ tạo tối đa ${estimate} slot (${dayCount} ngày × ${times.length} giờ). Slot trùng giờ với slot cũ sẽ bị bỏ qua.`
							: "Chọn ít nhất 1 thứ và 1 giờ để xem số slot ước tính."
					}
				/>

				{generic && <Alert type="error" message={generic} showIcon style={{ marginTop: 8 }} />}

				<Flex justify="end" gap={8} style={{ paddingTop: 12 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting} disabled={estimate === 0}>
						Tạo hàng loạt
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
