import { useQuery } from "@tanstack/react-query"
import { Alert, Col, Divider, Flex, Row, Typography } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Switch } from "#/components/Switch"
import { Textarea } from "#/components/Textarea"
import { teacherOptionsQuery } from "#/features/admin-courses/queries"
import {
	type AdminCourse,
	COURSE_TARGET_LEVELS,
	type CourseFormInput,
	type CourseTargetLevel,
} from "#/features/admin-courses/types"
import { extractError, formatApiErrorBanner } from "#/lib/api"

interface Props {
	initial?: AdminCourse
	onSubmit: (input: CourseFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

function toDateInput(value: string | undefined): string {
	if (!value) return ""
	// API may return ATOM (with time) or YYYY-MM-DD. <input type="date"> needs YYYY-MM-DD.
	return value.length >= 10 ? value.slice(0, 10) : value
}

function todayISO(): string {
	return new Date().toISOString().slice(0, 10)
}

function addDaysISO(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00`)
	d.setDate(d.getDate() + days)
	return d.toISOString().slice(0, 10)
}

function formatMoney(value: number | null | undefined): string {
	if (value === null || value === undefined || Number.isNaN(value)) return ""
	return new Intl.NumberFormat("vi-VN").format(value)
}

function parseMoney(raw: string): number | null {
	const digits = raw.replace(/\D/g, "")
	if (digits === "") return null
	return Number(digits)
}

export function CourseForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const teachersQ = useQuery(teacherOptionsQuery())
	const teachers = teachersQ.data?.data ?? []

	const [state, setState] = useState<CourseFormInput>({
		slug: initial?.slug ?? "",
		title: initial?.title ?? "",
		target_level: initial?.target_level ?? "B1",
		target_exam_school: initial?.target_exam_school ?? "",
		description: initial?.description ?? "",
		rules: initial?.rules ?? "",
		bonus_coins: initial?.bonus_coins ?? 0,
		price_vnd: initial?.price_vnd ?? 0,
		original_price_vnd: initial?.original_price_vnd ?? null,
		max_slots: initial?.max_slots ?? 20,
		max_slots_per_student: initial?.max_slots_per_student ?? 2,
		booking_coin_cost: initial?.booking_coin_cost ?? 50,
		start_date: toDateInput(initial?.start_date),
		end_date: toDateInput(initial?.end_date),
		required_full_tests: initial?.required_full_tests ?? 3,
		commitment_window_days: initial?.commitment_window_days ?? 5,
		livestream_url: initial?.livestream_url ?? "",
		teacher_id: initial?.teacher_id ?? "",
		is_published: initial?.is_published ?? false,
	})
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function set<K extends keyof CourseFormInput>(k: K, v: CourseFormInput[K]): void {
		setState((s) => ({ ...s, [k]: v }))
	}

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({
				...state,
				target_exam_school: state.target_exam_school || null,
				description: state.description || null,
				rules: state.rules || null,
				livestream_url: state.livestream_url || null,
			})
		} catch (err) {
			const x = await extractError(err)
			if (x.errors && Object.keys(x.errors).length > 0) {
				setErrors(x.errors)
				// Scroll field lỗi đầu tiên vào tầm nhìn — modal có scroll riêng.
				const firstKey = Object.keys(x.errors)[0]
				if (firstKey) {
					requestAnimationFrame(() => {
						document.getElementById(firstKey)?.scrollIntoView({ behavior: "smooth", block: "center" })
					})
				}
			}
			setGeneric(formatApiErrorBanner(x))
		}
	}

	// Create mode: start_date không được trước hôm nay. Edit mode: cho phép giữ ngày cũ.
	const minStart = initial ? undefined : todayISO()
	// end_date phải sau start_date ít nhất 1 ngày, tối đa 90 ngày.
	const minEnd = state.start_date ? addDaysISO(state.start_date, 1) : undefined
	const maxEnd = state.start_date ? addDaysISO(state.start_date, 90) : undefined
	// Lock start_date nếu còn <= 10 ngày trước khóa bắt đầu (edit mode).
	const startDateLocked = (() => {
		if (!initial?.start_date) return false
		const startMs = new Date(initial.start_date).getTime()
		const nowMs = new Date(todayISO()).getTime()
		const daysUntil = Math.floor((startMs - nowMs) / 86_400_000)
		return daysUntil <= 10
	})()

	return (
		<form onSubmit={handle}>
			<Flex vertical gap={4}>
				<SectionTitle>Thông tin chung</SectionTitle>
				<Row gutter={16}>
					<Col span={12}>
						<FormField label="Slug" htmlFor="slug" required error={errors.slug}>
							<Input
								id="slug"
								value={state.slug}
								onChange={(e) => set("slug", e.target.value)}
								invalid={!!errors.slug}
								placeholder="vd: vstep-b2-cap-toc-k102"
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
						invalid={!!errors.description}
					/>
				</FormField>

				<FormField
					label="Nội quy khóa"
					htmlFor="rules"
					error={errors.rules}
					helper="Hiển thị trong dialog ghi danh, học viên đọc và ký xác nhận trước khi thanh toán. Để trống nếu không có nội quy riêng."
				>
					<Textarea
						id="rules"
						value={state.rules ?? ""}
						onChange={(e) => set("rules", e.target.value)}
						rows={5}
						invalid={!!errors.rules}
						placeholder="VD: Đi học đúng giờ, không quay/chụp tài liệu, vắng buổi học phải báo trước 1 ngày..."
					/>
				</FormField>

				<SectionTitle>Phân loại & giáo viên</SectionTitle>
				<Row gutter={16}>
					<Col span={6}>
						<FormField label="Target level" htmlFor="target_level" required error={errors.target_level}>
							<Select
								id="target_level"
								value={state.target_level}
								onChange={(e) => set("target_level", e.target.value as CourseTargetLevel)}
								invalid={!!errors.target_level}
							>
								{COURSE_TARGET_LEVELS.map((lv) => (
									<option key={lv} value={lv}>
										{lv}
									</option>
								))}
							</Select>
						</FormField>
					</Col>
					<Col span={9}>
						<FormField label="Trường thi" htmlFor="target_exam_school" error={errors.target_exam_school}>
							<Input
								id="target_exam_school"
								value={state.target_exam_school ?? ""}
								onChange={(e) => set("target_exam_school", e.target.value)}
								placeholder="VD: ULIS-VNU"
								invalid={!!errors.target_exam_school}
							/>
						</FormField>
					</Col>
					<Col span={9}>
						<FormField label="Giáo viên" htmlFor="teacher_id" required error={errors.teacher_id}>
							<Select
								id="teacher_id"
								value={state.teacher_id}
								onChange={(e) => set("teacher_id", e.target.value)}
								disabled={teachersQ.isLoading}
								invalid={!!errors.teacher_id}
							>
								<option value="">{teachersQ.isLoading ? "Đang tải…" : "— Chọn giáo viên —"}</option>
								{teachers.map((t) => (
									<option key={t.id} value={t.id}>
										{t.full_name} ({t.email})
									</option>
								))}
							</Select>
						</FormField>
					</Col>
				</Row>

				<SectionTitle>Lịch & sĩ số</SectionTitle>
				<Row gutter={16}>
					<Col span={12}>
						<FormField
							label="Ngày bắt đầu"
							htmlFor="start_date"
							required
							error={errors.start_date}
							helper={startDateLocked ? "Không thể đổi khi còn ≤ 10 ngày trước khóa bắt đầu" : undefined}
						>
							<Input
								id="start_date"
								type="date"
								min={minStart}
								value={state.start_date}
								disabled={startDateLocked}
								onChange={(e) => {
									const next = e.target.value
									set("start_date", next)
									if (state.end_date && next && state.end_date <= next) {
										set("end_date", addDaysISO(next, 1))
									} else if (state.end_date && next && state.end_date > addDaysISO(next, 90)) {
										set("end_date", addDaysISO(next, 90))
									}
								}}
								invalid={!!errors.start_date}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField
							label="Ngày kết thúc"
							htmlFor="end_date"
							required
							error={errors.end_date}
							helper="Tối đa 90 ngày kể từ ngày bắt đầu"
						>
							<Input
								id="end_date"
								type="date"
								min={minEnd}
								max={maxEnd}
								value={state.end_date}
								onChange={(e) => set("end_date", e.target.value)}
								invalid={!!errors.end_date}
							/>
						</FormField>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<FormField label="Slot tối đa" htmlFor="max_slots" required error={errors.max_slots}>
							<Input
								id="max_slots"
								type="number"
								min={1}
								value={state.max_slots}
								onChange={(e) => set("max_slots", Number(e.target.value))}
								invalid={!!errors.max_slots}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField
							label="Slot / học viên"
							htmlFor="max_slots_per_student"
							required
							error={errors.max_slots_per_student}
							helper="Số lần học viên có thể đặt lịch 1-1 trong khóa"
						>
							<Input
								id="max_slots_per_student"
								type="number"
								min={1}
								value={state.max_slots_per_student}
								onChange={(e) => set("max_slots_per_student", Number(e.target.value))}
								invalid={!!errors.max_slots_per_student}
							/>
						</FormField>
					</Col>
				</Row>

				<SectionTitle>Giá</SectionTitle>
				<Row gutter={16}>
					<Col span={12}>
						<FormField label="Giá (VND)" htmlFor="price_vnd" required error={errors.price_vnd}>
							<Input
								id="price_vnd"
								inputMode="numeric"
								value={formatMoney(state.price_vnd)}
								onChange={(e) => set("price_vnd", parseMoney(e.target.value) ?? 0)}
								suffix="₫"
								invalid={!!errors.price_vnd}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField
							label="Giá gốc (VND)"
							htmlFor="original_price_vnd"
							error={errors.original_price_vnd}
							helper="Để hiển thị % giảm; bỏ trống nếu không giảm"
						>
							<Input
								id="original_price_vnd"
								inputMode="numeric"
								value={formatMoney(state.original_price_vnd)}
								onChange={(e) => set("original_price_vnd", parseMoney(e.target.value))}
								suffix="₫"
								invalid={!!errors.original_price_vnd}
							/>
						</FormField>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<FormField
							label="Xu tặng khi ghi danh"
							htmlFor="bonus_coins"
							error={errors.bonus_coins}
							helper="Học viên nhận xu này sau khi thanh toán VND thành công"
						>
							<Input
								id="bonus_coins"
								type="number"
								min={0}
								value={state.bonus_coins}
								onChange={(e) => set("bonus_coins", Number(e.target.value))}
								invalid={!!errors.bonus_coins}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField
							label="Xu/buổi học 1-1"
							htmlFor="booking_coin_cost"
							error={errors.booking_coin_cost}
							helper="Xu trừ khi học viên đặt 1 buổi học riêng với giáo viên"
						>
							<Input
								id="booking_coin_cost"
								type="number"
								min={0}
								max={10000}
								value={state.booking_coin_cost}
								onChange={(e) => set("booking_coin_cost", Number(e.target.value))}
								invalid={!!errors.booking_coin_cost}
							/>
						</FormField>
					</Col>
				</Row>

				<SectionTitle>Cam kết & livestream</SectionTitle>
				<Row gutter={16}>
					<Col span={8}>
						<FormField
							label="Số bài thi bắt buộc"
							htmlFor="required_full_tests"
							required
							error={errors.required_full_tests}
						>
							<Input
								id="required_full_tests"
								type="number"
								min={0}
								value={state.required_full_tests}
								onChange={(e) => set("required_full_tests", Number(e.target.value))}
								invalid={!!errors.required_full_tests}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField
							label="Cam kết (ngày)"
							htmlFor="commitment_window_days"
							required
							error={errors.commitment_window_days}
							helper="Hạn hoàn thành số bài thi trên"
						>
							<Input
								id="commitment_window_days"
								type="number"
								min={0}
								value={state.commitment_window_days}
								onChange={(e) => set("commitment_window_days", Number(e.target.value))}
								invalid={!!errors.commitment_window_days}
							/>
						</FormField>
					</Col>
					<Col span={8}>
						<FormField label="Livestream URL" htmlFor="livestream_url" error={errors.livestream_url}>
							<Input
								id="livestream_url"
								value={state.livestream_url ?? ""}
								onChange={(e) => set("livestream_url", e.target.value)}
								placeholder="https://meet.google.com/…"
								invalid={!!errors.livestream_url}
							/>
						</FormField>
					</Col>
				</Row>

				<Divider style={{ margin: "8px 0 4px" }} />

				<Switch
					checked={state.is_published}
					onChange={(v) => set("is_published", v)}
					label="Mở ghi danh (cho học viên thấy & mua)"
				/>

				{generic && <Alert type="error" message={generic} showIcon style={{ marginTop: 8 }} />}

				<Flex justify="end" gap={8} style={{ paddingTop: 12 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Tạo khóa học"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<Typography.Text
			style={{
				fontSize: 12,
				fontWeight: 600,
				color: "rgba(0,0,0,0.55)",
				textTransform: "uppercase",
				letterSpacing: 0.4,
				marginTop: 8,
				marginBottom: 4,
			}}
		>
			{children}
		</Typography.Text>
	)
}
