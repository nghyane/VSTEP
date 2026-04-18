// NotificationButton — bell trong topbar, mở popover list các notification.
// Data nguồn từ notifications/store (push từ streak events).

import { useQuery } from "@tanstack/react-query"
import { Bell, BellRing, Flame, Sparkles, Trash2, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { CoinIcon } from "#/components/common/CoinIcon"
import {
	type AppNotification,
	clearNotifications,
	markAllRead,
	type NotificationIcon,
	useNotifications,
	useUnreadCount,
} from "#/lib/notifications/store"
import { overviewQueryOptions } from "#/lib/queries/overview"
import { scanUnlockedMilestones } from "#/lib/streak/streak-rewards"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "#/shared/ui/popover"

const NOTIFICATION_GIF_SRC = "/notification-active.gif"

export function NotificationButton() {
	const [open, setOpen] = useState(false)
	const notifications = useNotifications()
	const unread = useUnreadCount()
	const { data } = useQuery(overviewQueryOptions())

	// Khi streak thay đổi (hoặc app mount) → scan milestone đã mở khoá nhưng
	// chưa claim và push notification tương ứng (dedup theo id).
	useEffect(() => {
		const streak = data?.activity.streak ?? 0
		if (streak > 0) scanUnlockedMilestones(streak)
	}, [data?.activity.streak])

	function handleOpenChange(next: boolean) {
		setOpen(next)
		if (next && unread > 0) markAllRead()
	}

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className="relative text-muted-foreground"
					aria-label={unread > 0 ? `${unread} thông báo chưa đọc` : "Thông báo"}
				>
					{unread > 0 ? (
						<img
							src={NOTIFICATION_GIF_SRC}
							alt=""
							className="size-5 object-contain mix-blend-multiply dark:mix-blend-screen"
						/>
					) : (
						<Bell className="size-4" />
					)}
					{unread > 0 && (
						<span className="absolute -top-0.5 -right-0.5 flex min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold leading-3.5 text-destructive-foreground">
							{unread > 9 ? "9+" : unread}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 overflow-hidden p-0">
				<Header
					count={notifications.length}
					onClearAll={() => {
						clearNotifications()
						setOpen(false)
					}}
				/>
				<div className="max-h-96 overflow-y-auto">
					{notifications.length === 0 ? (
						<EmptyState />
					) : (
						<ul>
							{notifications.map((n, i) => (
								<li key={n.id}>
									<NotificationRow notification={n} isFirst={i === 0} />
								</li>
							))}
						</ul>
					)}
				</div>
			</PopoverContent>
		</Popover>
	)
}

function Header({ count, onClearAll }: { count: number; onClearAll: () => void }) {
	return (
		<div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
			<div className="flex items-center gap-1.5">
				<BellRing className="size-3.5 text-muted-foreground" />
				<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Thông báo
				</span>
			</div>
			{count > 0 && (
				<button
					type="button"
					onClick={onClearAll}
					className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-destructive"
				>
					<Trash2 className="size-3" />
					Xoá tất cả
				</button>
			)}
		</div>
	)
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
			<Sparkles className="size-6 text-muted-foreground/60" />
			<p className="text-sm font-medium text-foreground">Chưa có thông báo nào</p>
			<p className="text-xs text-muted-foreground">
				Hoàn thành bài luyện tập để nhận thông báo chuỗi học và thưởng xu.
			</p>
		</div>
	)
}

function NotificationRow({
	notification,
	isFirst,
}: {
	notification: AppNotification
	isFirst: boolean
}) {
	const isUnread = notification.readAt === null
	return (
		<div
			className={cn(
				"flex gap-3 px-4 py-3 transition-colors",
				!isFirst && "border-t",
				isUnread && "bg-primary/5",
			)}
		>
			<IconSlot iconKey={notification.iconKey} />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold leading-snug text-foreground">{notification.title}</p>
				{notification.body && (
					<p className="mt-0.5 text-xs leading-snug text-muted-foreground">{notification.body}</p>
				)}
				<p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
					{formatRelative(notification.createdAt)}
				</p>
			</div>
			{isUnread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
		</div>
	)
}

function IconSlot({ iconKey }: { iconKey: NotificationIcon }) {
	const wrapperClass =
		"flex size-9 shrink-0 items-center justify-center rounded-full bg-skill-speaking/10"
	if (iconKey === "fire") {
		return (
			<span className={wrapperClass}>
				<Flame className="size-4 text-orange-500" />
			</span>
		)
	}
	if (iconKey === "trophy") {
		return (
			<span className={wrapperClass}>
				<Trophy className="size-4 text-amber-500" />
			</span>
		)
	}
	return (
		<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
			<CoinIcon size={18} />
		</span>
	)
}

function formatRelative(ts: number): string {
	const diffMin = Math.max(0, Math.round((Date.now() - ts) / 60000))
	if (diffMin < 1) return "Vừa xong"
	if (diffMin < 60) return `${diffMin} phút trước`
	const diffH = Math.floor(diffMin / 60)
	if (diffH < 24) return `${diffH} giờ trước`
	const diffD = Math.floor(diffH / 24)
	if (diffD < 7) return `${diffD} ngày trước`
	const d = new Date(ts)
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
}
