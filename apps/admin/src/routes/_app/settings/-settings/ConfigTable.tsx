import { ClockCircleOutlined, EditOutlined, GiftOutlined } from "@ant-design/icons"
import { Button, Space, Table, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import type { Milestone, SystemConfigRow } from "./types"
import { keyDescription, keyLabel } from "./utils"

interface Props {
	items: SystemConfigRow[]
	onEdit: (config: SystemConfigRow) => void
}

export function ConfigTable({ items, onEdit }: Props) {
	const columns: ColumnsType<SystemConfigRow> = [
		{
			title: "Tên cấu hình",
			dataIndex: "key",
			width: 320,
			render: (key: string) => (
				<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
					<Typography.Text strong>{keyLabel(key)}</Typography.Text>
					<Typography.Text type="secondary" style={{ fontFamily: "monospace", fontSize: 11 }}>
						{key}
					</Typography.Text>
				</div>
			),
		},
		{
			title: "Giá trị",
			dataIndex: "value",
			render: (_, record) => <ValueDisplay row={record} />,
		},
		{
			title: "Mô tả",
			dataIndex: "description",
			render: (d: string | null, record) => (
				<Typography.Text type="secondary" style={{ fontSize: 13 }}>
					{keyDescription(record.key, d)}
				</Typography.Text>
			),
		},
		{
			title: "Hành động",
			width: 100,
			align: "right",
			render: (_, record) => (
				<Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)}>
					Sửa
				</Button>
			),
		},
	]

	return (
		<Table<SystemConfigRow>
			className="settings-table"
			rowKey="key"
			columns={columns}
			dataSource={items}
			pagination={false}
			size="middle"
		/>
	)
}

function ValueDisplay({ row }: { row: SystemConfigRow }) {
	const { value } = row
	const schema = row.schema ?? { type: "auto" as const }

	if (schema.type === "timezone") {
		return (
			<Tag icon={<ClockCircleOutlined />} color="geekblue">
				{String(value)}
			</Tag>
		)
	}

	if (schema.type === "milestones" && Array.isArray(value)) {
		return (
			<Space size={[6, 6]} wrap>
				{(value as Milestone[]).map((m) => (
					<Tag key={`${m.days}-${m.coins}`} icon={<GiftOutlined />} color="gold">
						{m.days} ngày → {m.coins} xu
					</Tag>
				))}
			</Space>
		)
	}

	if (schema.type === "level_costs" && value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, number>)
		return (
			<Space size={[6, 6]} wrap>
				{entries.map(([level, coins]) => (
					<Tag key={level} color="purple">
						Level {level}: {coins} xu
					</Tag>
				))}
			</Space>
		)
	}

	if (schema.type === "boolean") {
		return <Tag color={value ? "green" : "default"}>{value ? "Bật" : "Tắt"}</Tag>
	}

	if (schema.type === "number") {
		return <Typography.Text strong>{String(value)}</Typography.Text>
	}

	if (schema.type === "string") {
		return <Typography.Text>{String(value)}</Typography.Text>
	}

	return (
		<Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }} type="secondary">
			{JSON.stringify(value)}
		</Typography.Text>
	)
}
