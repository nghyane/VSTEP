import {
	BookOutlined,
	DatabaseOutlined,
	EditOutlined,
	GiftOutlined,
	HomeOutlined,
	ProfileOutlined,
	ReadOutlined,
	SettingOutlined,
	TeamOutlined,
} from "@ant-design/icons"
import { Link, useLocation } from "@tanstack/react-router"
import { Layout, Menu, type MenuProps } from "antd"
import { useMemo } from "react"
import { useAuth } from "#/lib/auth"

type ItemType = NonNullable<MenuProps["items"]>[number]
type AnyTo = Parameters<typeof Link>[0]["to"]
const t = (s: string) => s as unknown as AnyTo

function buildItems(isAdmin: boolean): ItemType[] {
	const items: ItemType[] = [
		{
			type: "group",
			label: "Tổng quan",
			children: [{ key: "/", icon: <HomeOutlined />, label: <Link to={t("/")}>Dashboard</Link> }],
		},
		{
			type: "group",
			label: "Nội dung",
			children: [
				{ key: "/vocab", icon: <BookOutlined />, label: <Link to={t("/vocab")}>Từ vựng</Link> },
				{ key: "/grammar", icon: <EditOutlined />, label: <Link to={t("/grammar")}>Ngữ pháp</Link> },
			],
		},
		{
			type: "group",
			label: "Đề thi",
			children: [
				{ key: "/exams", icon: <ProfileOutlined />, label: <Link to={t("/exams")}>Danh sách đề</Link> },
			],
		},
		{
			type: "group",
			label: "Luyện tập",
			children: [
				{
					key: "practice",
					icon: <ReadOutlined />,
					label: "Kỹ năng",
					children: [
						{ key: "/practice/listening", label: <Link to={t("/practice/listening")}>Nghe</Link> },
						{ key: "/practice/reading", label: <Link to={t("/practice/reading")}>Đọc</Link> },
						{ key: "/practice/writing", label: <Link to={t("/practice/writing")}>Viết</Link> },
						{
							key: "/practice/speaking-drills",
							label: <Link to={t("/practice/speaking-drills")}>Phát âm</Link>,
						},
						{
							key: "/practice/speaking-scenarios",
							label: <Link to={t("/practice/speaking-scenarios")}>Hội thoại AI</Link>,
						},
					],
				},
			],
		},
		{
			type: "group",
			label: "Quản lý",
			children: [
				{
					key: "/users",
					icon: <TeamOutlined />,
					label: <Link to={t("/users")}>Người dùng</Link>,
				},
				{ key: "/courses", icon: <DatabaseOutlined />, label: <Link to={t("/courses")}>Khóa học</Link> },
				{
					key: "/promo",
					icon: <GiftOutlined />,
					label: <Link to={t("/promo")}>Khuyến mãi</Link>,
				},
			],
		},
	]

	// Hệ thống — Cấu hình: ADMIN ONLY (staff/teacher không thấy menu)
	if (isAdmin) {
		items.push({
			type: "group",
			label: "Hệ thống",
			children: [
				{ key: "/settings", icon: <SettingOutlined />, label: <Link to={t("/settings")}>Cấu hình</Link> },
			],
		})
	}

	return items
}

const FLAT_KEYS = [
	"/",
	"/vocab",
	"/grammar",
	"/exams",
	"/practice/listening",
	"/practice/reading",
	"/practice/writing",
	"/practice/speaking-drills",
	"/practice/speaking-scenarios",
	"/users",
	"/courses",
	"/promo",
	"/settings",
]

export function Sidebar() {
	const { pathname } = useLocation()
	const role = useAuth((s) => s.user?.role)
	const items = useMemo(() => buildItems(role === "admin"), [role])

	const selected =
		FLAT_KEYS.filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k))).sort(
			(a, b) => b.length - a.length,
		)[0] ?? "/"

	const openKeys = pathname.startsWith("/practice") ? ["practice"] : []

	return (
		<Layout.Sider
			width={240}
			theme="light"
			style={{
				position: "sticky",
				top: 0,
				left: 0,
				height: "100vh",
				overflow: "auto",
				borderRight: "1px solid rgba(5,5,5,0.06)",
			}}
		>
			<div
				style={{
					display: "flex",
					height: 56,
					alignItems: "center",
					padding: "0 20px",
					borderBottom: "1px solid rgba(5,5,5,0.06)",
					fontWeight: 600,
					fontSize: 14,
				}}
			>
				VSTEP Admin
			</div>
			<Menu
				mode="inline"
				selectedKeys={[selected]}
				defaultOpenKeys={openKeys}
				items={items}
				style={{ borderInlineEnd: "none" }}
			/>
		</Layout.Sider>
	)
}
