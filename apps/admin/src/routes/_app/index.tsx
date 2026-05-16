import {
	BookOutlined,
	CheckCircleOutlined,
	ClockCircleOutlined,
	ExclamationCircleOutlined,
	FileTextOutlined,
	ReadOutlined,
	RiseOutlined,
	TeamOutlined,
	WarningOutlined,
} from "@ant-design/icons"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Alert, Col, Flex, Row, Space, Tag, Typography } from "antd"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "#/components/Badge"
import { Card } from "#/components/Card"
import { Skeleton } from "#/components/Skeleton"
import { type ApiResponse, api } from "#/lib/api"

export const Route = createFileRoute("/_app/")({
	component: DashboardPage,
})

interface StatsData {
	users_total: number
	users_today: number
	users_this_week: number
	exams_total: number
	exams_published: number
	exams_draft: number
	sessions_active: number
	sessions_today: number
	sessions_stuck: number
	grading_pending: number
	grading_failed: number
	grading_done_today: number
	vocab_topics: number
	grammar_points: number
	courses: number
}

interface AlertItem {
	type: "error" | "warning"
	message: string
}

interface ActionItem {
	label: string
	badge: number
}

interface ContentStatusItem {
	type: string
	published: number
	draft: number
}

interface ActivityItem {
	action: string
	detail: string | null
	happened_at: string
}

const PUBLISHED_COLOR = "#1677ff"
const DRAFT_COLOR = "#d9d9d9"
const MUTED_COLOR = "rgba(0,0,0,0.45)"
const BORDER_COLOR = "rgba(0,0,0,0.06)"

function DashboardPage() {
	const { data: stats, isLoading } = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => api.get("admin/stats").json<ApiResponse<StatsData>>(),
		select: (r) => r.data,
	})

	const { data: alerts } = useQuery({
		queryKey: ["admin", "alerts"],
		queryFn: () => api.get("admin/alerts").json<ApiResponse<AlertItem[]>>(),
		select: (r) => r.data,
	})

	const { data: actionItems } = useQuery({
		queryKey: ["admin", "action-items"],
		queryFn: () => api.get("admin/action-items").json<ApiResponse<ActionItem[]>>(),
		select: (r) => r.data,
	})

	const { data: contentStatus } = useQuery({
		queryKey: ["admin", "content-status"],
		queryFn: () => api.get("admin/content-status").json<ApiResponse<ContentStatusItem[]>>(),
		select: (r) => r.data,
	})

	const { data: recentActivity } = useQuery({
		queryKey: ["admin", "recent-activity"],
		queryFn: () => api.get("admin/recent-activity").json<ApiResponse<ActivityItem[]>>(),
		select: (r) => r.data,
	})

	const totalAlerts = actionItems?.reduce((sum, i) => sum + i.badge, 0) ?? 0

	return (
		<Flex vertical gap={24}>
			{alerts && alerts.length > 0 && <AlertsBanner alerts={alerts} />}

			<Flex justify="space-between" align="center">
				<div>
					<Typography.Title level={3} style={{ margin: 0 }}>
						Tổng quan
					</Typography.Title>
					<Typography.Text type="secondary" style={{ fontSize: 14 }}>
						Tình trạng hệ thống và hoạt động gần đây.
					</Typography.Text>
				</div>
				{totalAlerts > 0 && (
					<Tag color="error" icon={<WarningOutlined />} style={{ padding: "4px 10px", fontSize: 13 }}>
						{totalAlerts} việc cần xử lý
					</Tag>
				)}
			</Flex>

			<StatsRow stats={stats} loading={isLoading} />

			<Row gutter={[24, 24]}>
				<Col xs={24} lg={16}>
					<ContentChart data={contentStatus} />
				</Col>
				<Col xs={24} lg={8}>
					<ActionList items={actionItems} />
				</Col>
			</Row>

			<ActivityTimeline items={recentActivity} />
		</Flex>
	)
}

function AlertsBanner({ alerts }: { alerts: AlertItem[] }) {
	const hasError = alerts.some((a) => a.type === "error")
	return (
		<Alert
			type={hasError ? "error" : "warning"}
			showIcon
			icon={hasError ? <ExclamationCircleOutlined /> : <WarningOutlined />}
			message={
				<Flex vertical gap={4}>
					{alerts.map((a, i) => (
						<span key={i} style={{ fontSize: 14, fontWeight: 500 }}>
							{a.message}
						</span>
					))}
				</Flex>
			}
		/>
	)
}

function StatsRow({ stats, loading }: { stats: StatsData | undefined; loading: boolean }) {
	if (loading) return <StatsSkeleton />
	if (!stats) return null

	const items = [
		{
			title: "Người dùng",
			value: formatNum(stats.users_total),
			trend: `${stats.users_today} hôm nay`,
			trendPositive: true,
			icon: <TeamOutlined />,
			iconColor: "#1677ff",
		},
		{
			title: "Phiên đang hoạt động",
			value: formatNum(stats.sessions_active),
			trend: `${stats.sessions_stuck} quá hạn`,
			trendPositive: stats.sessions_stuck === 0,
			icon: <ReadOutlined />,
			iconColor: stats.sessions_stuck > 0 ? "#ff4d4f" : "#52c41a",
		},
		{
			title: "Chấm bài hôm nay",
			value: formatNum(stats.grading_done_today),
			trend: `${stats.grading_pending} chờ · ${stats.grading_failed} lỗi`,
			trendPositive: stats.grading_failed === 0,
			icon: <FileTextOutlined />,
			iconColor: stats.grading_failed > 0 ? "#faad14" : "#52c41a",
		},
		{
			title: "Nội dung",
			value: formatNum(stats.exams_published),
			trend: `${stats.vocab_topics} từ vựng · ${stats.grammar_points} ngữ pháp`,
			trendPositive: true,
			icon: <BookOutlined />,
			iconColor: "#1677ff",
		},
	]

	return (
		<Row gutter={[16, 16]}>
			{items.map((item) => (
				<Col key={item.title} xs={24} sm={12} xl={6}>
					<div
						style={{
							border: `1px solid ${BORDER_COLOR}`,
							borderRadius: 8,
							background: "#fff",
							padding: 20,
						}}
					>
						<Flex justify="space-between" align="flex-start">
							<div>
								<Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
									{item.title}
								</Typography.Text>
								<div style={{ marginTop: 8, fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
									{item.value}
								</div>
								<Flex align="center" gap={6} style={{ marginTop: 8 }}>
									<RiseOutlined
										style={{
											fontSize: 13,
											color: item.trendPositive ? "#52c41a" : "#ff4d4f",
										}}
									/>
									<Typography.Text type="secondary" style={{ fontSize: 12 }}>
										{item.trend}
									</Typography.Text>
								</Flex>
							</div>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 40,
									height: 40,
									borderRadius: 8,
									background: "#fafafa",
									color: item.iconColor,
									fontSize: 20,
								}}
							>
								{item.icon}
							</div>
						</Flex>
					</div>
				</Col>
			))}
		</Row>
	)
}

function StatsSkeleton() {
	return (
		<Row gutter={[16, 16]}>
			{[0, 1, 2, 3].map((i) => (
				<Col key={i} xs={24} sm={12} xl={6}>
					<div
						style={{
							border: `1px solid ${BORDER_COLOR}`,
							borderRadius: 8,
							background: "#fff",
							padding: 20,
						}}
					>
						<div style={{ marginBottom: 8 }}>
							<Skeleton />
						</div>
						<div style={{ marginBottom: 8 }}>
							<Skeleton />
						</div>
						<Skeleton />
					</div>
				</Col>
			))}
		</Row>
	)
}

function ContentChart({ data }: { data: ContentStatusItem[] | undefined }) {
	const chartData =
		data?.map((item) => ({
			name: item.type,
			published: item.published,
			draft: item.draft,
			total: item.published + item.draft,
		})) ?? []

	return (
		<Card title="Trạng thái nội dung" description="Số lượng đã xuất bản so với bản nháp">
			<div style={{ marginTop: 16, height: 224, display: "flex" }}>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData} barGap={2}>
						<XAxis
							dataKey="name"
							tick={{ fontSize: 11, fill: MUTED_COLOR }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis tick={{ fontSize: 11, fill: MUTED_COLOR }} axisLine={false} tickLine={false} width={30} />
						<Tooltip
							cursor={{ fill: "#fafafa" }}
							contentStyle={{
								background: "#fff",
								border: `1px solid ${BORDER_COLOR}`,
								borderRadius: "8px",
								fontSize: "12px",
								boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
							}}
						/>
						<Bar dataKey="published" name="Đã XB" radius={[4, 4, 0, 0]}>
							{chartData.map((_entry, index) => (
								<Cell key={index} fill={PUBLISHED_COLOR} />
							))}
						</Bar>
						<Bar dataKey="draft" name="Nháp" fill={DRAFT_COLOR} radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<Flex align="center" gap={16} style={{ marginTop: 12, fontSize: 12, color: MUTED_COLOR }}>
				<Flex align="center" gap={6}>
					<span
						style={{
							width: 10,
							height: 10,
							borderRadius: 2,
							background: PUBLISHED_COLOR,
							display: "inline-block",
						}}
					/>
					Đã xuất bản
				</Flex>
				<Flex align="center" gap={6}>
					<span
						style={{
							width: 10,
							height: 10,
							borderRadius: 2,
							background: DRAFT_COLOR,
							display: "inline-block",
						}}
					/>
					Nháp
				</Flex>
			</Flex>
		</Card>
	)
}

function ActionList({ items }: { items: ActionItem[] | undefined }) {
	if (!items || items.length === 0) {
		return (
			<Card title="Cần xử lý" description="Không có việc nào tồn đọng">
				<Flex vertical align="center" justify="center" style={{ padding: "40px 0", textAlign: "center" }}>
					<CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />
					<Typography.Text type="secondary" style={{ fontSize: 14, marginTop: 8 }}>
						Tất cả đã ổn.
					</Typography.Text>
				</Flex>
			</Card>
		)
	}

	const total = items.reduce((sum, i) => sum + i.badge, 0)

	return (
		<Card
			title="Cần xử lý"
			description="Nội dung chưa xuất bản hoặc có lỗi"
			action={<Badge variant="danger">{total}</Badge>}
		>
			<Space direction="vertical" size={4} style={{ width: "100%", marginTop: 4 }}>
				{items.map((item, i) => (
					<Flex
						key={i}
						justify="space-between"
						align="center"
						style={{
							padding: "10px 12px",
							borderRadius: 6,
							fontSize: 14,
						}}
					>
						<Flex align="center" gap={8}>
							<ClockCircleOutlined style={{ color: MUTED_COLOR }} />
							<span>{item.label}</span>
						</Flex>
						<Badge variant="warning">{item.badge}</Badge>
					</Flex>
				))}
			</Space>
		</Card>
	)
}

const ACTION_META: Record<string, { label: string; variant: "default" | "success" | "info" }> = {
	user_registered: { label: "Đăng ký mới", variant: "success" },
	exam_published: { label: "Xuất bản đề", variant: "info" },
	vocab_created: { label: "Từ vựng mới", variant: "default" },
	grammar_created: { label: "Ngữ pháp mới", variant: "default" },
}

function ActivityTimeline({ items }: { items: ActivityItem[] | undefined }) {
	return (
		<Card title="Hoạt động gần đây" description="5 sự kiện mới nhất">
			{!items || items.length === 0 ? (
				<Flex vertical align="center" justify="center" style={{ padding: "40px 0", textAlign: "center" }}>
					<ClockCircleOutlined style={{ fontSize: 32, color: MUTED_COLOR }} />
					<Typography.Text type="secondary" style={{ fontSize: 14, marginTop: 8 }}>
						Chưa có hoạt động nào.
					</Typography.Text>
				</Flex>
			) : (
				<Flex vertical style={{ marginTop: 16 }}>
					{items.map((item, i) => {
						const meta = ACTION_META[item.action] ?? { label: item.action, variant: "default" as const }
						return (
							<Flex key={i} gap={16}>
								<Flex vertical align="center">
									<div
										style={{
											marginTop: 6,
											width: 10,
											height: 10,
											borderRadius: "50%",
											background: "#d9d9d9",
											boxShadow: "0 0 0 4px #fff",
										}}
									/>
									{i < items.length - 1 && <div style={{ width: 1, flex: 1, background: "#f0f0f0" }} />}
								</Flex>
								<div style={{ flex: 1, paddingBottom: 24 }}>
									<Flex align="center" gap={8}>
										<Badge variant={meta.variant}>{meta.label}</Badge>
										<span style={{ fontSize: 14 }}>{item.detail}</span>
									</Flex>
									<Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
										{formatDate(item.happened_at)}
									</Typography.Text>
								</div>
							</Flex>
						)
					})}
				</Flex>
			)}
		</Card>
	)
}

function formatNum(n: number): string {
	return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function formatDate(iso: string): string {
	const d = new Date(iso)
	const diff = Date.now() - d.getTime()
	const mins = Math.floor(diff / 60_000)
	if (mins < 1) return "Vừa xong"
	if (mins < 60) return `${mins} phút trước`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours} giờ trước`
	const days = Math.floor(hours / 24)
	if (days < 7) return `${days} ngày trước`
	return d.toLocaleDateString("vi-VN")
}
