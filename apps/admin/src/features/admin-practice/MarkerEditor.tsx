import { DeleteOutlined } from "@ant-design/icons"
import { Col, Collapse, Row } from "antd"
import { type FormEvent, useEffect, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { Input } from "#/components/Input"
import { Select } from "#/components/Select"
import { Textarea } from "#/components/Textarea"
import type { AdminWritingMarker, MarkerSide, WritingMarkerFormInput } from "#/features/admin-practice/types"

// Màu chính giống FE
const COLORS = [
	{ value: "yellow", label: "Vàng", bg: "#facc15" },
	{ value: "blue", label: "Xanh dương", bg: "#60a5fa" },
	{ value: "pink", label: "Hồng", bg: "#f472b6" },
]

interface Props {
	marker?: AdminWritingMarker | null
	initialSelection?: { text: string; occurrence: number } | null
	onSave: (input: WritingMarkerFormInput) => Promise<void>
	onDelete?: () => Promise<void>
	onCancel: () => void
	saving?: boolean
	deleting?: boolean
}

export function MarkerEditor({
	marker,
	initialSelection,
	onSave,
	onDelete,
	onCancel,
	saving,
	deleting,
}: Props) {
	const isEdit = !!marker
	const [match, setMatch] = useState("")
	const [occurrence, setOccurrence] = useState(1)
	const [side, setSide] = useState<MarkerSide>("right")
	const [color, setColor] = useState("blue")
	const [label, setLabel] = useState("")
	const [detail, setDetail] = useState("")
	const [displayOrder, setDisplayOrder] = useState(0)

	useEffect(() => {
		if (marker) {
			setMatch(marker.match)
			setOccurrence(marker.occurrence)
			setSide(marker.side)
			setColor(marker.color)
			setLabel(marker.label)
			setDetail(marker.detail ?? "")
			setDisplayOrder(marker.display_order)
		} else if (initialSelection) {
			setMatch(initialSelection.text)
			setOccurrence(initialSelection.occurrence)
			setSide("right")
			setColor("blue")
			setLabel("")
			setDetail("")
			setDisplayOrder(0)
		}
	}, [marker, initialSelection])

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()
		await onSave({
			match,
			occurrence,
			side,
			color,
			label,
			detail: detail || null,
			display_order: displayOrder,
		})
	}

	return (
		<form onSubmit={handleSubmit}>
			{/* Delete button */}
			{isEdit && onDelete && (
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						icon={<DeleteOutlined />}
						onClick={onDelete}
						loading={deleting}
						style={{ color: "#dc2626" }}
					>
						Xoá marker
					</Button>
				</div>
			)}

			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				<FormField label="Đoạn text" htmlFor="match" required>
					<Textarea
						id="match"
						value={match}
						onChange={(e) => setMatch(e.target.value)}
						rows={2}
						placeholder="Đoạn text cần highlight"
					/>
				</FormField>

				<FormField label="Nhãn" htmlFor="label" required>
					<Input
						id="label"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="VD: Câu mở đầu, Linking words..."
					/>
				</FormField>

				<FormField label="Chi tiết" htmlFor="detail">
					<Textarea
						id="detail"
						value={detail}
						onChange={(e) => setDetail(e.target.value)}
						rows={2}
						placeholder="Giải thích thêm (tuỳ chọn)"
					/>
				</FormField>

				<FormField label="Màu highlight" htmlFor="color">
					<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
						{COLORS.map((c) => (
							<button
								key={c.value}
								type="button"
								onClick={() => setColor(c.value)}
								style={{
									width: 28,
									height: 28,
									borderRadius: "50%",
									backgroundColor: c.bg,
									border: "none",
									cursor: "pointer",
									outline: color === c.value ? "3px solid #3b82f6" : "none",
									outlineOffset: 2,
									transition: "transform 0.15s",
								}}
								title={c.label}
								onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
								onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
							/>
						))}
					</div>
				</FormField>

				{/* Advanced options */}
				<Collapse
					ghost
					items={[
						{
							key: "advanced",
							label: <span style={{ fontSize: 13, color: "#6b7280" }}>Tuỳ chọn nâng cao</span>,
							children: (
								<Row gutter={12}>
									<Col span={8}>
										<FormField label="Lần xuất hiện" htmlFor="occurrence">
											<Input
												id="occurrence"
												type="number"
												min={1}
												value={occurrence}
												onChange={(e) => setOccurrence(Number(e.target.value))}
											/>
										</FormField>
									</Col>
									<Col span={8}>
										<FormField label="Thứ tự" htmlFor="display_order">
											<Input
												id="display_order"
												type="number"
												value={displayOrder}
												onChange={(e) => setDisplayOrder(Number(e.target.value))}
											/>
										</FormField>
									</Col>
									<Col span={8}>
										<FormField label="Vị trí" htmlFor="side">
											<Select id="side" value={side} onChange={(e) => setSide(e.target.value as MarkerSide)}>
												<option value="left">Trái</option>
												<option value="right">Phải</option>
											</Select>
										</FormField>
									</Col>
								</Row>
							),
						},
					]}
				/>

				<div
					style={{
						display: "flex",
						justifyContent: "flex-end",
						gap: 8,
						paddingTop: 12,
						borderTop: "1px solid #e5e7eb",
					}}
				>
					<Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
						Huỷ
					</Button>
					<Button type="submit" loading={saving}>
						{isEdit ? "Lưu thay đổi" : "Tạo marker"}
					</Button>
				</div>
			</div>
		</form>
	)
}
