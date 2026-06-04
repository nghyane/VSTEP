import {
	BookOutlined,
	CalendarOutlined,
	CheckSquareOutlined,
	DatabaseOutlined,
	DollarOutlined,
	EditOutlined,
	GiftOutlined,
	HomeOutlined,
	ProfileOutlined,
	ReadOutlined,
	ScheduleOutlined,
	SettingOutlined,
	SolutionOutlined,
	TeamOutlined,
} from "@ant-design/icons"
import { Link, useLocation } from "@tanstack/react-router"
import { Layout, Menu, type MenuProps } from "antd"
import { useMemo } from "react"
import { type AdminRole, useAuth } from "#/lib/auth"

type ItemType = NonNullable<MenuProps["items"]>[number]
type AnyTo = Parameters<typeof Link>[0]["to"]
const t = (s: string) => s as unknown as AnyTo

function buildTeacherItems(): ItemType[] {
	return [
		{
			type: "group",
			label: "Tổng quan",
			children: [
				{ key: "/teacher", icon: <HomeOutlined />, label: <Link to={t("/teacher")}>Dashboard</Link> },
			],
		},
		{
			type: "group",
			label: "Giảng dạy",
			children: [
				{
					key: "/teacher/schedule",
					icon: <CalendarOutlined />,
					label: <Link to={t("/teacher/schedule")}>Lịch dạy</Link>,
				},
				{
					key: "/teacher/bookings",
					icon: <ScheduleOutlined />,
					label: <Link to={t("/teacher/bookings")}>Buổi học</Link>,
				},
			],
		},
		{
			type: "group",
			label: "Cá nhân",
			children: [
				{
					key: "/teacher/leave-requests",
					icon: <EditOutlined />,
					label: <Link to={t("/teacher/leave-requests")}>Xin nghỉ</Link>,
				},
			],
		},
	]
}

function buildStaffItems(isAdmin: boolean): ItemType[] {
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
				{ key: "/courses", icon: <DatabaseOutlined />, label: <Link to={t("/courses")}>Khóa học</Link> },
				{
					key: "/leave-requests",
					icon: <SolutionOutlined />,
					label: <Link to={t("/leave-requests")}>Đơn nghỉ</Link>,
				},
			],
		},
	]

	if (isAdmin) {
		items.push({
			type: "group",
			label: "Quản trị",
			children: [
				{
					key: "/finance",
					icon: <DollarOutlined />,
					label: <Link to={t("/finance")}>Đơn hàng & dòng tiền</Link>,
				},
				{
					key: "/grading",
					icon: <CheckSquareOutlined />,
					label: <Link to={t("/grading")}>Tiêu chí chấm điểm</Link>,
				},
				{
					key: "/topup-packages",
					icon: <GiftOutlined />,
					label: <Link to={t("/topup-packages")}>Gói nạp</Link>,
				},
				{ key: "/users", icon: <TeamOutlined />, label: <Link to={t("/users")}>Người dùng</Link> },
				{ key: "/promo", icon: <GiftOutlined />, label: <Link to={t("/promo")}>Khuyến mãi</Link> },
				{ key: "/settings", icon: <SettingOutlined />, label: <Link to={t("/settings")}>Cấu hình</Link> },
			],
		})
	}

	return items
}

function buildItems(role: AdminRole): ItemType[] {
	if (role === "teacher") return buildTeacherItems()
	return buildStaffItems(role === "admin")
}

const STAFF_KEYS = [
	"/",
	"/vocab",
	"/grammar",
	"/exams",
	"/practice/listening",
	"/practice/reading",
	"/practice/writing",
	"/practice/speaking-drills",
	"/practice/speaking-scenarios",
	"/courses",
	"/finance",
	"/leave-requests",
	"/grading",
	"/topup-packages",
	"/users",
	"/promo",
	"/settings",
]

const TEACHER_KEYS = ["/teacher", "/teacher/schedule", "/teacher/bookings", "/teacher/leave-requests"]

export function Sidebar() {
	const { pathname } = useLocation()
	const role = useAuth((s) => s.user?.role)
	const items = useMemo(() => buildItems(role ?? "staff"), [role])

	const flatKeys = role === "teacher" ? TEACHER_KEYS : STAFF_KEYS
	const fallbackKey = role === "teacher" ? "/teacher" : "/"

	const selected =
		flatKeys
			.filter((k) => (k === "/" ? pathname === "/" : pathname.startsWith(k)))
			.sort((a, b) => b.length - a.length)[0] ?? fallbackKey

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
