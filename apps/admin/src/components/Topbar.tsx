import {
	BellOutlined,
	CalendarOutlined,
	CheckOutlined,
	KeyOutlined,
	LinkOutlined,
	LogoutOutlined,
	UserOutlined,
	WarningOutlined,
} from "@ant-design/icons"
import { useNavigate } from "@tanstack/react-router"
import { Avatar, Badge, Button, Dropdown, Empty, Space, Spin, Tabs, Tag, Typography } from "antd"
import { useState } from "react"
import { ChangeMyPasswordModal } from "#/features/admin-users/ChangeMyPasswordModal"
import { api } from "#/lib/api"
import { useAuth } from "#/lib/auth"
import {
	useAdminNotifications,
	useAlerts,
	useMarkAllRead,
	useUnreadCount,
} from "#/routes/_app/-dashboard/queries"
import type { AdminNotificationItem, AlertItem } from "#/routes/_app/-dashboard/types"

export function Topbar() {
	const user = useAuth((s) => s.user)
	const clear = useAuth((s) => s.clear)
	const refreshToken = useAuth((s) => s.refreshToken)
	const isTeacher = user?.role === "teacher"
	const { data: alerts, isLoading: alertsLoading } = useAlerts(isTeacher)
	const { data: notifications, isLoading: notifsLoading } = useAdminNotifications()
	const { data: unreadCount } = useUnreadCount()
	const markAllRead = useMarkAllRead()
	const [changePwOpen, setChangePwOpen] = useState(false)

	const badgeCount = (unreadCount ?? 0) + (isTeacher ? 0 : (alerts?.length ?? 0))

	async function logout() {
		try {
			if (refreshToken) {
				await api.post("auth/logout", { json: { refresh_token: refreshToken } })
			}
		} finally {
			clear()
		}
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
				justifyContent: "flex-end",
				padding: "0 24px",
				borderBottom: "1px solid rgba(5,5,5,0.06)",
				background: "rgba(255,255,255,0.85)",
				backdropFilter: "blur(8px)",
			}}
		>
			<Space size="middle" align="center">
				<Dropdown
					trigger={["click"]}
					placement="bottomRight"
					popupRender={() => (
						<NotificationPanel
							alerts={alerts}
							alertsLoading={alertsLoading}
							notifications={notifications}
							notifsLoading={notifsLoading}
							onMarkAllRead={() => markAllRead.mutate()}
							hideAlerts={isTeacher}
						/>
					)}
				>
					<Badge count={badgeCount} size="small" offset={[-2, 4]} overflowCount={9}>
						<Button type="text" icon={<BellOutlined />} aria-label="Thông báo" />
					</Badge>
				</Dropdown>
				<Space size={8}>
					<Avatar size="small" icon={<UserOutlined />} style={{ background: "#2563eb" }} />
					<div style={{ lineHeight: 1.2 }}>
						<div style={{ fontSize: 13, fontWeight: 500 }}>{user?.name ?? "—"}</div>
						<div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)" }}>{roleLabel(user?.role)}</div>
					</div>
				</Space>
				<Button
					type="text"
					icon={<KeyOutlined />}
					onClick={() => setChangePwOpen(true)}
					title="Đổi mật khẩu"
					aria-label="Đổi mật khẩu"
				/>
				<Button type="text" icon={<LogoutOutlined />} onClick={logout}>
					Đăng xuất
				</Button>
			</Space>
			<ChangeMyPasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
		</header>
	)
}

function NotificationPanel({
	alerts,
	alertsLoading,
	notifications,
	notifsLoading,
	onMarkAllRead,
	hideAlerts,
}: {
	alerts: AlertItem[] | undefined
	alertsLoading: boolean
	notifications: AdminNotificationItem[] | undefined
	notifsLoading: boolean
	onMarkAllRead: () => void
	hideAlerts?: boolean
}) {
	const unreadNotifs = notifications?.filter((n) => !n.read_at) ?? []

	const tabs = [
		{
			key: "notifications",
			label: `Thông báo${unreadNotifs.length > 0 ? ` (${unreadNotifs.length})` : ""}`,
			children: (
				<NotificationsTab
					notifications={notifications}
					isLoading={notifsLoading}
					onMarkAllRead={onMarkAllRead}
				/>
			),
		},
	]

	if (!hideAlerts) {
		tabs.push({
			key: "alerts",
			label: `Cảnh báo${alerts?.length ? ` (${alerts.length})` : ""}`,
			children: <AlertsTab alerts={alerts} isLoading={alertsLoading} />,
		})
	}

	return (
		<div
			style={{
				width: 380,
				maxHeight: 480,
				background: "#fff",
				borderRadius: 8,
				boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
				padding: "8px 12px 12px",
			}}
		>
			<Tabs size="small" defaultActiveKey="notifications" items={tabs} />
		</div>
	)
}

function NotificationsTab({
	notifications,
	isLoading,
	onMarkAllRead,
}: {
	notifications: AdminNotificationItem[] | undefined
	isLoading: boolean
	onMarkAllRead: () => void
}) {
	const navigate = useNavigate()

	if (isLoading) {
		return (
			<div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
				<Spin size="small" />
			</div>
		)
	}
	if (!notifications || notifications.length === 0) {
		return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />
	}
	const hasUnread = notifications.some((n) => !n.read_at)
	return (
		<div style={{ maxHeight: 340, overflowY: "auto" }}>
			{hasUnread && (
				<div style={{ textAlign: "right", marginBottom: 6 }}>
					<Button type="link" size="small" icon={<CheckOutlined />} onClick={onMarkAllRead}>
						Đánh dấu đã đọc
					</Button>
				</div>
			)}
			<Space orientation="vertical" size={6} style={{ width: "100%" }}>
				{notifications.map((n) => {
					const courseId = n.payload?.course_id
					const route = n.payload?.route
					return (
						<div
							key={n.id}
							style={{
								padding: "10px 12px",
								background: n.read_at ? "#fafafa" : "#e6f4ff",
								border: `1px solid ${n.read_at ? "#f0f0f0" : "#91caff"}`,
								borderRadius: 8,
							}}
						>
							<div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
								<CalendarOutlined style={{ color: "#1677ff", marginTop: 3, fontSize: 14 }} />
								<div style={{ flex: 1, minWidth: 0 }}>
									<Typography.Text strong style={{ fontSize: 13 }}>
										{n.title}
									</Typography.Text>
									<div style={{ fontSize: 12, color: "rgba(0,0,0,0.65)", marginTop: 3, lineHeight: 1.5 }}>
										{n.body}
									</div>
								</div>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									marginTop: 8,
								}}
							>
								<span style={{ fontSize: 11, color: "rgba(0,0,0,0.35)" }}>{formatTimeAgo(n.created_at)}</span>
								{route ? (
									<Button
										type="primary"
										size="small"
										icon={<LinkOutlined />}
										onClick={() => openNotificationRoute(route, navigate)}
										style={{ fontSize: 11 }}
									>
										Mở
									</Button>
								) : courseId ? (
									<Button
										type="primary"
										size="small"
										icon={<LinkOutlined />}
										onClick={() => navigate({ to: "/courses/$courseId", params: { courseId } })}
										style={{ fontSize: 11 }}
									>
										Xem khóa học
									</Button>
								) : null}
							</div>
						</div>
					)
				})}
			</Space>
		</div>
	)
}

type NavigateFn = ReturnType<typeof useNavigate>

function openNotificationRoute(route: string, navigate: NavigateFn): void {
	if (route === "/leave-requests") {
		navigate({ to: "/leave-requests" })
		return
	}

	const teacherRequestId = routeSegment(route, "/teacher/grading-requests/")
	if (teacherRequestId) {
		navigate({ to: "/teacher/grading-requests/$requestId", params: { requestId: teacherRequestId } })
		return
	}

	const staffRequestId = routeSegment(route, "/grading-requests/")
	if (staffRequestId) {
		navigate({ to: "/grading-requests/$requestId", params: { requestId: staffRequestId } })
	}
}

function routeSegment(route: string, prefix: string): string | null {
	if (!route.startsWith(prefix)) return null
	const id = route.slice(prefix.length)
	return id.length > 0 ? id : null
}

function AlertsTab({ alerts, isLoading }: { alerts: AlertItem[] | undefined; isLoading: boolean }) {
	if (isLoading) {
		return (
			<div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
				<Spin size="small" />
			</div>
		)
	}
	if (!alerts || alerts.length === 0) {
		return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có cảnh báo" />
	}
	return (
		<Space orientation="vertical" size={8} style={{ width: "100%" }}>
			{alerts.map((a, idx) => (
				<div
					key={`${a.message}-${idx}`}
					style={{
						display: "flex",
						gap: 10,
						alignItems: "flex-start",
						padding: "8px 10px",
						background: a.type === "error" ? "#fff1f0" : "#fffbe6",
						border: `1px solid ${a.type === "error" ? "#ffa39e" : "#ffe58f"}`,
						borderRadius: 6,
					}}
				>
					<WarningOutlined style={{ color: a.type === "error" ? "#cf1322" : "#d48806", marginTop: 2 }} />
					<div style={{ flex: 1, minWidth: 0 }}>
						<Typography.Text style={{ fontSize: 13 }}>{a.message}</Typography.Text>
						<div style={{ marginTop: 4 }}>
							<Tag color={a.type === "error" ? "red" : "gold"} style={{ marginInlineEnd: 0 }}>
								{a.type === "error" ? "Lỗi" : "Cảnh báo"}
							</Tag>
						</div>
					</div>
				</div>
			))}
		</Space>
	)
}

function formatTimeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 1) return "Vừa xong"
	if (mins < 60) return `${mins} phút trước`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours} giờ trước`
	const days = Math.floor(hours / 24)
	return `${days} ngày trước`
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
