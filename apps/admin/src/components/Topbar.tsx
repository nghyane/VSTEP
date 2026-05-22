import {
	BellOutlined,
	LogoutOutlined,
	SearchOutlined,
	UserOutlined,
	WarningOutlined,
} from "@ant-design/icons"
import { useNavigate } from "@tanstack/react-router"
import { Avatar, Badge, Button, Dropdown, Empty, Input, Space, Spin, Tag, Typography } from "antd"
import { useAuth } from "#/lib/auth"
import { useAlerts } from "#/routes/_app/-dashboard/queries"
import type { AlertItem } from "#/routes/_app/-dashboard/types"

export function Topbar() {
	const user = useAuth((s) => s.user)
	const clear = useAuth((s) => s.clear)
	const navigate = useNavigate()
	const { data: alerts, isLoading } = useAlerts()
	const count = alerts?.length ?? 0

	function logout() {
		clear()
		window.location.href = "/login"
	}

	return (
		<header
			style={{
				position: "sticky",
				top: 0,
				zIndex: 30,
				display: "flex",
				height: 56,
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0 24px",
				borderBottom: "1px solid rgba(5,5,5,0.06)",
				background: "rgba(255,255,255,0.85)",
				backdropFilter: "blur(8px)",
			}}
		>
			<Input prefix={<SearchOutlined />} placeholder="Tìm kiếm…" allowClear style={{ width: 280 }} />
			<Space size="middle" align="center">
				<Dropdown
					trigger={["click"]}
					placement="bottomRight"
					popupRender={() => (
						<AlertsPanel
							alerts={alerts}
							isLoading={isLoading}
							onSelect={(action) => {
								if (action) navigate({ to: action })
							}}
						/>
					)}
				>
					<Badge count={count} size="small" offset={[-2, 4]} overflowCount={9}>
						<Button type="text" icon={<BellOutlined />} aria-label="Cảnh báo hệ thống" />
					</Badge>
				</Dropdown>
				<Space size={8}>
					<Avatar size="small" icon={<UserOutlined />} style={{ background: "#2563eb" }} />
					<div style={{ lineHeight: 1.2 }}>
						<div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name ?? "—"}</div>
						<div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)" }}>{roleLabel(user?.role)}</div>
					</div>
				</Space>
				<Button type="text" icon={<LogoutOutlined />} onClick={logout}>
					Đăng xuất
				</Button>
			</Space>
		</header>
	)
}

function AlertsPanel({
	alerts,
	isLoading,
	onSelect,
}: {
	alerts: AlertItem[] | undefined
	isLoading: boolean
	onSelect: (action: string | undefined) => void
}) {
	return (
		<div
			style={{
				width: 360,
				maxHeight: 420,
				overflowY: "auto",
				background: "#fff",
				borderRadius: 8,
				boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
				padding: 12,
			}}
		>
			<Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
				Cảnh báo hệ thống
			</Typography.Text>
			{isLoading ? (
				<div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
					<Spin size="small" />
				</div>
			) : !alerts || alerts.length === 0 ? (
				<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có cảnh báo" />
			) : (
				<Space orientation="vertical" size={8} style={{ width: "100%" }}>
					{alerts.map((a, idx) => (
						<button
							key={`${a.message}-${idx}`}
							type="button"
							onClick={() => onSelect(a.action)}
							style={{
								display: "flex",
								gap: 10,
								alignItems: "flex-start",
								width: "100%",
								padding: "8px 10px",
								background: a.type === "error" ? "#fff1f0" : "#fffbe6",
								border: `1px solid ${a.type === "error" ? "#ffa39e" : "#ffe58f"}`,
								borderRadius: 6,
								cursor: a.action ? "pointer" : "default",
								textAlign: "left",
							}}
						>
							<WarningOutlined
								style={{
									color: a.type === "error" ? "#cf1322" : "#d48806",
									marginTop: 2,
								}}
							/>
							<div style={{ flex: 1, minWidth: 0 }}>
								<Typography.Text style={{ fontSize: 13 }}>{a.message}</Typography.Text>
								<div style={{ marginTop: 4 }}>
									<Tag color={a.type === "error" ? "red" : "gold"} style={{ marginInlineEnd: 0 }}>
										{a.type === "error" ? "Lỗi" : "Cảnh báo"}
									</Tag>
								</div>
							</div>
						</button>
					))}
				</Space>
			)}
		</div>
	)
}

function roleLabel(role: string | undefined) {
	switch (role) {
		case "admin":
			return "Quản trị viên"
		case "staff":
			return "Nhân viên"
		case "teacher":
			return "Giáo viên"
		default:
			return ""
	}
}
