import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	AlertTriangle,
	BookOpen,
	CheckCircle,
	Clock,
	FileText,
	GraduationCap,
	TrendingUp,
	Users,
} from "lucide-react"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Badge } from "#/components/Badge"
import { Card } from "#/components/Card"
import { Skeleton } from "#/components/Skeleton"
import { type ApiResponse, api } from "#/lib/api"
import { cn } from "#/lib/utils"

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

const COLORS = ["oklch(0.58 0.18 255)", "oklch(0.5 0.18 255)", "oklch(0.45 0.15 255)"]

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
		<div className="flex flex-col gap-6">
			{alerts && alerts.length > 0 && <AlertsBanner alerts={alerts} />}

			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">Tổng quan</h1>
					<p className="mt-1 text-sm text-muted">Tình trạng hệ thống và hoạt động gần đây.</p>
				</div>
				{totalAlerts > 0 && (
					<div className="flex items-center gap-2 rounded-md bg-danger-tint px-3 py-1.5 text-sm text-danger">
						<AlertTriangle className="size-4" />
						<span>{totalAlerts} việc cần xử lý</span>
					</div>
				)}
			</div>

			<StatsRow stats={stats} loading={isLoading} />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<ContentChart data={contentStatus} />
				</div>
				<ActionList items={actionItems} />
			</div>

			<ActivityTimeline items={recentActivity} />
		</div>
	)
}

/* ─── Alerts Banner ─────────────────────────────────── */

function AlertsBanner({ alerts }: { alerts: AlertItem[] }) {
	const hasError = alerts.some((a) => a.type === "error")
	return (
		<div
			className={cn(
				"flex items-start gap-3 rounded-(--radius-card) border p-4",
				hasError ? "border-danger/30 bg-danger-tint" : "border-warning/30 bg-warning-tint",
			)}
		>
			<AlertTriangle className={cn("mt-0.5 size-5 shrink-0", hasError ? "text-danger" : "text-warning")} />
			<div className="flex flex-col gap-1">
				{alerts.map((a, i) => (
					<span key={i} className="text-sm font-medium text-foreground">
						{a.message}
					</span>
				))}
			</div>
		</div>
	)
}

/* ─── Stats Row ─────────────────────────────────────── */

function StatsRow({ stats, loading }: { stats: StatsData | undefined; loading: boolean }) {
	if (loading) return <StatsSkeleton />
	if (!stats) return null

	const items = [
		{
			title: "Người dùng",
			value: formatNum(stats.users_total),
			trend: `${stats.users_today} hôm nay`,
			trendPositive: true,
			icon: Users,
			color: "text-primary",
		},
		{
			title: "Phiên đang hoạt động",
			value: formatNum(stats.sessions_active),
			trend: `${stats.sessions_stuck} quá hạn`,
			trendPositive: stats.sessions_stuck === 0,
			icon: GraduationCap,
			color: stats.sessions_stuck > 0 ? "text-danger" : "text-success",
		},
		{
			title: "Chấm bài hôm nay",
			value: formatNum(stats.grading_done_today),
			trend: `${stats.grading_pending} chờ · ${stats.grading_failed} lỗi`,
			trendPositive: stats.grading_failed === 0,
			icon: FileText,
			color: stats.grading_failed > 0 ? "text-warning" : "text-success",
		},
		{
			title: "Nội dung",
			value: formatNum(stats.exams_published),
			trend: `${stats.vocab_topics} từ vựng · ${stats.grammar_points} ngữ pháp`,
			trendPositive: true,
			icon: BookOpen,
			color: "text-primary",
		},
	]

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{items.map((item) => (
				<div key={item.title} className="rounded-(--radius-card) border border-border bg-surface p-5">
					<div className="flex items-start justify-between">
						<div>
							<p className="text-xs font-medium text-muted">{item.title}</p>
							<p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
							<div className="mt-2 flex items-center gap-1.5">
								<TrendingUp className={cn("size-3.5", item.trendPositive ? "text-success" : "text-danger")} />
								<span className="text-xs text-muted">{item.trend}</span>
							</div>
						</div>
						<div
							className={cn(
								"flex size-10 items-center justify-center rounded-lg bg-surface-muted",
								item.color,
							)}
						>
							<item.icon className="size-5" />
						</div>
					</div>
				</div>
			))}
		</div>
	)
}

function StatsSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{[0, 1, 2, 3].map((i) => (
				<div key={i} className="rounded-(--radius-card) border border-border bg-surface p-5">
					<Skeleton className="h-3 w-16" />
					<Skeleton className="mt-2 h-8 w-20" />
					<Skeleton className="mt-2 h-3 w-32" />
				</div>
			))}
		</div>
	)
}

/* ─── Content Chart ─────────────────────────────────── */

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
			<div className="mt-4 flex h-56">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData} barGap={2}>
						<XAxis
							dataKey="name"
							tick={{ fontSize: 11, fill: "oklch(0.45 0.01 260)" }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis
							tick={{ fontSize: 11, fill: "oklch(0.45 0.01 260)" }}
							axisLine={false}
							tickLine={false}
							width={30}
						/>
						<Tooltip
							cursor={{ fill: "oklch(0.97 0.005 260)" }}
							contentStyle={{
								background: "oklch(1 0 0)",
								border: "1px solid oklch(0.92 0.005 260)",
								borderRadius: "8px",
								fontSize: "12px",
								boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
							}}
						/>
						<Bar dataKey="published" name="Đã XB" radius={[4, 4, 0, 0]}>
							{chartData.map((_entry, index) => (
								<Cell key={index} fill={COLORS[index % COLORS.length]} />
							))}
						</Bar>
						<Bar dataKey="draft" name="Nháp" fill="oklch(0.92 0.005 260)" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<div className="mt-3 flex items-center gap-4 text-xs text-muted">
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-sm bg-primary" />
					Đã xuất bản
				</div>
				<div className="flex items-center gap-1.5">
					<span className="size-2.5 rounded-sm bg-border" />
					Nháp
				</div>
			</div>
		</Card>
	)
}

/* ─── Action List ───────────────────────────────────── */

function ActionList({ items }: { items: ActionItem[] | undefined }) {
	if (!items || items.length === 0) {
		return (
			<Card title="Cần xử lý" description="Không có việc nào tồn đọng">
				<div className="flex flex-col items-center justify-center py-10 text-center">
					<CheckCircle className="size-8 text-success" />
					<p className="mt-2 text-sm text-muted">Tất cả đã ổn.</p>
				</div>
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
			<ul className="mt-1 flex flex-col gap-1">
				{items.map((item, i) => (
					<li
						key={i}
						className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-surface-muted"
					>
						<div className="flex items-center gap-2">
							<Clock className="size-4 text-muted" />
							<span className="text-foreground">{item.label}</span>
						</div>
						<Badge variant="warning">{item.badge}</Badge>
					</li>
				))}
			</ul>
		</Card>
	)
}

/* ─── Activity Timeline ─────────────────────────────── */

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
				<div className="flex flex-col items-center justify-center py-10 text-center">
					<Clock className="size-8 text-subtle" />
					<p className="mt-2 text-sm text-muted">Chưa có hoạt động nào.</p>
				</div>
			) : (
				<div className="mt-4 flex flex-col gap-0">
					{items.map((item, i) => {
						const meta = ACTION_META[item.action] ?? { label: item.action, variant: "default" as const }
						return (
							<div key={i} className="flex gap-4">
								<div className="flex flex-col items-center">
									<div className="mt-1.5 size-2.5 rounded-full bg-border ring-4 ring-surface" />
									{i < items.length - 1 && <div className="w-px flex-1 bg-border" />}
								</div>
								<div className="flex-1 pb-6">
									<div className="flex items-center gap-2">
										<Badge variant={meta.variant}>{meta.label}</Badge>
										<span className="text-sm text-foreground">{item.detail}</span>
									</div>
									<p className="mt-1 text-xs text-muted">{formatDate(item.happened_at)}</p>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</Card>
	)
}

/* ─── Helpers ───────────────────────────────────────── */

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
