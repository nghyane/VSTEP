import { DeleteOutlined, EditOutlined, TrophyFilled } from "@ant-design/icons"
import { Flex, Popconfirm, Switch, Tag, Typography } from "antd"
import type { ColumnsType } from "antd/es/table"
import { Button } from "#/components/Button"
import type { AdminTopupPackage } from "#/features/admin-topup/types"

interface ColumnActions {
	onEdit: (p: AdminTopupPackage) => void
	onToggle: (p: AdminTopupPackage) => void
	onDelete: (id: string) => void
}

export function getTopupPackageColumns({
	onEdit,
	onToggle,
	onDelete,
}: ColumnActions): ColumnsType<AdminTopupPackage> {
	return [
		{
			title: "Gói",
			dataIndex: "label",
			key: "label",
			render: (v: string, p) => (
				<Flex vertical gap={2}>
					<Flex gap={8} align="center">
						<Typography.Text strong style={p.is_best_value ? { color: "#ad6800" } : undefined}>
							{v}
						</Typography.Text>
						{p.is_best_value && (
							<Tag
								icon={<TrophyFilled />}
								color="gold"
								style={{ marginInlineEnd: 0, fontWeight: 600, letterSpacing: 0.3 }}
							>
								BEST VALUE
							</Tag>
						)}
					</Flex>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						#{p.display_order}
					</Typography.Text>
				</Flex>
			),
		},
		{
			title: "Giá",
			dataIndex: "amount_vnd",
			key: "amount_vnd",
			width: 160,
			render: (v: number) => <Typography.Text strong>{v.toLocaleString("vi-VN")} đ</Typography.Text>,
		},
		{
			title: "Coin nhận",
			key: "coins",
			width: 200,
			render: (_: unknown, p) => (
				<Flex gap={6} align="center">
					<Typography.Text strong>{p.total_coins.toLocaleString("vi-VN")}</Typography.Text>
					{p.bonus_coins > 0 && (
						<Tag color="success" style={{ marginInlineEnd: 0 }}>
							+{p.bonus_coins} bonus
						</Tag>
					)}
				</Flex>
			),
		},
		{
			title: "Trạng thái",
			key: "is_active",
			width: 120,
			render: (_: unknown, p) => (
				<Switch
					checked={p.is_active}
					onChange={() => onToggle(p)}
					checkedChildren="Đang bán"
					unCheckedChildren="Tạm ẩn"
				/>
			),
		},
		{
			title: "",
			key: "actions",
			width: 100,
			align: "right",
			render: (_: unknown, p) => (
				<Flex gap={4} justify="end">
					<Button variant="ghost" icon={<EditOutlined />} onClick={() => onEdit(p)} aria-label="Sửa" />
					<Popconfirm
						title="Xoá gói nạp này?"
						description="Hành động không thể hoàn tác."
						onConfirm={() => onDelete(p.id)}
						okText="Xoá"
						cancelText="Huỷ"
						okButtonProps={{ danger: true }}
					>
						<Button variant="ghost" icon={<DeleteOutlined />} aria-label="Xoá" />
					</Popconfirm>
				</Flex>
			),
		},
	]
}
