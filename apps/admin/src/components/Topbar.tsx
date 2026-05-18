import { BellOutlined, LogoutOutlined, SearchOutlined, UserOutlined } from "@ant-design/icons"
import { Avatar, Badge, Button, Input, Space } from "antd"
import { useAuth } from "#/lib/auth"

export function Topbar() {
	const user = useAuth((s) => s.user)
	const clear = useAuth((s) => s.clear)

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
				<Badge dot>
					<Button type="text" icon={<BellOutlined />} />
				</Badge>
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
