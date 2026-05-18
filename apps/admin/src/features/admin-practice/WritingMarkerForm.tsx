import { Alert, Col, Flex, Row } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Textarea } from "#/components/Textarea"
import type { AdminWritingMarker, MarkerSide, WritingMarkerFormInput } from "#/features/admin-practice/types"
import { extractError } from "#/lib/api"

interface Props {
	initial?: AdminWritingMarker
	onSubmit: (input: WritingMarkerFormInput) => Promise<unknown>
	onCancel: () => void
	submitting?: boolean
}

const COLORS = ["blue", "green", "orange", "purple", "red", "teal"]

export function WritingMarkerForm({ initial, onSubmit, onCancel, submitting }: Props) {
	const [match, setMatch] = useState(initial?.match ?? "")
	const [occurrence, setOccurrence] = useState(initial?.occurrence ?? 1)
	const [side, setSide] = useState<MarkerSide>(initial?.side ?? "right")
	const [color, setColor] = useState(initial?.color ?? "blue")
	const [label, setLabel] = useState(initial?.label ?? "")
	const [detail, setDetail] = useState(initial?.detail ?? "")
	const [displayOrder, setDisplayOrder] = useState(initial?.display_order ?? 0)
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	async function handle(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setErrors({})
		setGeneric(null)
		try {
			await onSubmit({ match, occurrence, side, color, label, detail, display_order: displayOrder })
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
				<FormField
					label="Chuỗi cần annotate"
					htmlFor="match"
					required
					error={errors.match}
					helper="Tìm khớp trong sample_answer."
				>
					<Input
						id="match"
						value={match}
						onChange={(e) => setMatch(e.target.value)}
						invalid={!!errors.match}
					/>
				</FormField>
				<Row gutter={12}>
					<Col span={12}>
						<FormField label="Lần xuất hiện thứ" htmlFor="occurrence" error={errors.occurrence}>
							<Input
								id="occurrence"
								type="number"
								min={1}
								value={occurrence}
								onChange={(e) => setOccurrence(Number(e.target.value))}
							/>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Vị trí annotation" htmlFor="side" required error={errors.side}>
							<Select id="side" value={side} onChange={(e) => setSide(e.target.value as MarkerSide)}>
								<option value="left">Bên trái</option>
								<option value="right">Bên phải</option>
							</Select>
						</FormField>
					</Col>
				</Row>
				<Row gutter={12}>
					<Col span={12}>
						<FormField label="Màu" htmlFor="color" required error={errors.color}>
							<Select id="color" value={color} onChange={(e) => setColor(e.target.value)}>
								{COLORS.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
							</Select>
						</FormField>
					</Col>
					<Col span={12}>
						<FormField label="Thứ tự" htmlFor="display_order">
							<Input
								id="display_order"
								type="number"
								value={displayOrder}
								onChange={(e) => setDisplayOrder(Number(e.target.value))}
							/>
						</FormField>
					</Col>
				</Row>
				<FormField label="Nhãn" htmlFor="label" required error={errors.label}>
					<Input
						id="label"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						invalid={!!errors.label}
						placeholder="vd: Câu mở đầu"
					/>
				</FormField>
				<FormField label="Chi tiết" htmlFor="detail" error={errors.detail}>
					<Textarea id="detail" value={detail ?? ""} onChange={(e) => setDetail(e.target.value)} rows={2} />
				</FormField>

				{generic && <Alert type="error" message={generic} showIcon />}

				<Flex justify="end" gap={8} style={{ paddingTop: 8 }}>
					<Button variant="ghost" onClick={onCancel} disabled={submitting}>
						Huỷ
					</Button>
					<Button type="submit" loading={submitting}>
						{initial ? "Cập nhật" : "Thêm marker"}
					</Button>
				</Flex>
			</Flex>
		</form>
	)
}
