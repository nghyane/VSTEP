import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useRef, useState } from "react"
import { Icon, StaticIcon, type StaticIconName } from "#/components/Icon"
import { readAllNotifications, readNotification } from "#/features/notifications/actions"
import { notificationsQuery, unreadCountQuery } from "#/features/notifications/queries"
import type { Notification, UnreadCount } from "#/features/notifications/types"
import type { ApiResponse, PaginatedResponse } from "#/lib/api"
import { useAuth, useSession } from "#/lib/auth"
import { useToast } from "#/lib/toast"
import { useClickOutside } from "#/lib/use-click-outside"

const NOTIF_ICON: Record<string, StaticIconName> = {
	coin: "coin",
	streak: "streak-sm",
	trophy: "trophy",
	target: "target-md",
}

const NOTIF_TINT: Record<string, string> = {
	coin: "bg-coin-tint",
	streak: "bg-streak-tint",
	trophy: "bg-warning-tint",
	target: "bg-primary-tint",
}

function timeAgo(date: string): string {
	const diff = Date.now() - new Date(date).getTime()
	const mins = Math.floor(diff / 60000)
	if (mins < 1) return "Vừa xong"
	if (mins < 60) return `${mins} phút trước`
	const hours = Math.floor(mins / 60)
	if (hours < 24) return `${hours} giờ trước`
	return `${Math.floor(hours / 24)} ngày trước`
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
	const icon = NOTIF_ICON[notif.icon_key ?? ""] ?? "coin"
	const tint = NOTIF_TINT[notif.icon_key ?? ""] ?? "bg-coin-tint"
	const isUnread = !notif.read_at
	return (
		<button
			type="button"
			onClick={() => {
				if (isUnread) onRead(notif.id)
			}}
			className={`relative flex w-full items-start gap-3 rounded-(--radius-card) p-3 text-left transition ${
				isUnread
					? "bg-primary-tint/40 hover:bg-primary-tint/70 cursor-pointer"
					: "hover:bg-background cursor-default"
			}`}
		>
			<span
				className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tint} border-2 border-border`}
			>
				<StaticIcon name={icon} size="sm" className="h-5 w-auto" />
			</span>
			<div className="min-w-0 flex-1 pt-0.5">
				<p
					className={`text-sm leading-snug ${isUnread ? "font-extrabold text-foreground" : "font-bold text-muted"}`}
				>
					{notif.title}
				</p>
				{notif.body && <p className="text-xs text-muted mt-0.5 leading-snug">{notif.body}</p>}
				<p className="text-[11px] font-bold text-subtle mt-1">{timeAgo(notif.created_at)}</p>
			</div>
			{isUnread && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary ring-2 ring-primary/30" />}
		</button>
	)
}

function MenuItem({
	iconNode,
	children,
	onClick,
	destructive,
	trailing,
}: {
	iconNode?: React.ReactNode
	children: React.ReactNode
	onClick: () => void
	destructive?: boolean
	trailing?: React.ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`group flex w-full items-center gap-3 rounded-(--radius-card) px-3 py-2.5 text-left transition hover:bg-background ${
				destructive ? "text-destructive" : "text-foreground"
			}`}
		>
			{iconNode}
			<span className="flex-1 text-sm font-extrabold">{children}</span>
			{trailing}
		</button>
	)
}

interface Props {
	unread: number
	initial: string
}

export function ProfileDropdown({ unread, initial }: Props) {
	const { profile, user } = useSession()
	const logout = useAuth((s) => s.logout)
	const { data: notifsData } = useQuery({ ...notificationsQuery, enabled: false })
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)
	const [tab, setTab] = useState<"menu" | "notifs">("menu")
	const menuRef = useRef<HTMLDivElement>(null)
	const qc = useQueryClient()

	useClickOutside(menuRef, () => setOpen(false))

	const readAll = useMutation({
		mutationFn: readAllNotifications,
		onMutate: async () => {
			await qc.cancelQueries({ queryKey: ["notifications"] })
			const prevList = qc.getQueryData<PaginatedResponse<Notification>>(notificationsQuery.queryKey)
			const prevCount = qc.getQueryData<ApiResponse<UnreadCount>>(unreadCountQuery.queryKey)
			const now = new Date().toISOString()
			if (prevList) {
				qc.setQueryData<PaginatedResponse<Notification>>(notificationsQuery.queryKey, {
					...prevList,
					data: prevList.data.map((n) => (n.read_at ? n : { ...n, read_at: now })),
				})
			}
			qc.setQueryData<ApiResponse<UnreadCount>>(unreadCountQuery.queryKey, { data: { count: 0 } })
			return { prevList, prevCount }
		},
		onError: (_e, _v, ctx) => {
			if (ctx?.prevList) qc.setQueryData(notificationsQuery.queryKey, ctx.prevList)
			if (ctx?.prevCount) qc.setQueryData(unreadCountQuery.queryKey, ctx.prevCount)
		},
		onSuccess: () => {
			useToast.getState().add("Đã đọc tất cả thông báo", "success")
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] })
		},
	})

	const readOne = useMutation({
		mutationFn: readNotification,
		onMutate: async (id: string) => {
			await qc.cancelQueries({ queryKey: ["notifications"] })
			const prevList = qc.getQueryData<PaginatedResponse<Notification>>(notificationsQuery.queryKey)
			const prevCount = qc.getQueryData<ApiResponse<UnreadCount>>(unreadCountQuery.queryKey)
			const now = new Date().toISOString()
			if (prevList) {
				qc.setQueryData<PaginatedResponse<Notification>>(notificationsQuery.queryKey, {
					...prevList,
					data: prevList.data.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)),
				})
			}
			if (prevCount) {
				const wasUnread = prevList?.data.find((n) => n.id === id)?.read_at === null
				if (wasUnread) {
					qc.setQueryData<ApiResponse<UnreadCount>>(unreadCountQuery.queryKey, {
						data: { count: Math.max(0, prevCount.data.count - 1) },
					})
				}
			}
			return { prevList, prevCount }
		},
		onError: (_e, _id, ctx) => {
			if (ctx?.prevList) qc.setQueryData(notificationsQuery.queryKey, ctx.prevList)
			if (ctx?.prevCount) qc.setQueryData(unreadCountQuery.queryKey, ctx.prevCount)
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: ["notifications"] })
		},
	})

	const notifs = notifsData ? notifsData.data : []

	function toggle() {
		const next = !open
		setOpen(next)
		setTab("menu")
		if (next) qc.prefetchQuery(notificationsQuery)
	}

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				onClick={toggle}
				className="relative w-10 h-10 rounded-full bg-primary text-primary-foreground font-display text-base flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition"
			>
				{initial}
				{unread > 0 && (
					<span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive border-2 border-background" />
				)}
			</button>

			{open && (
				<div className="absolute right-0 top-full mt-3 w-80 bg-surface rounded-(--radius-banner) border-2 border-border border-b-4 shadow-lg overflow-hidden animate-[menuIn_0.15s_ease-out]">
					{tab === "menu" ? (
						<div>
							<div className="bg-gradient-to-b from-primary-tint/60 to-transparent px-4 pt-5 pb-4">
								<div className="flex items-center gap-3">
									<div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-lg shrink-0">
										{initial}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-base font-extrabold text-foreground truncate">{profile.nickname}</p>
										<p className="text-xs text-subtle truncate">{user?.email}</p>
									</div>
									{profile.target_level && (
										<span className="inline-flex items-center gap-1 text-xs font-extrabold text-primary-dark bg-primary-tint border-2 border-primary/30 border-b-[3px] px-2.5 py-1 rounded-full">
											{profile.target_level}
										</span>
									)}
								</div>
							</div>
							<div className="p-2 space-y-0.5">
								<MenuItem
									onClick={() => setTab("notifs")}
									trailing={
										unread > 0 ? (
											<span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-extrabold text-primary-foreground bg-destructive rounded-full">
												{unread}
											</span>
										) : null
									}
								>
									Thông báo
								</MenuItem>
								<MenuItem
									onClick={() => {
										setOpen(false)
										navigate({ to: "/ho-so", search: { edit: true } })
									}}
								>
									Chỉnh sửa hồ sơ
								</MenuItem>
								<MenuItem
									onClick={() => {
										setOpen(false)
										navigate({ to: "/luyen-tap/ket-qua" })
									}}
								>
									Kết quả AI chấm
								</MenuItem>
								<div className="my-1 h-px bg-border" />
								<MenuItem
									iconNode={<Icon name="logout" size="xs" />}
									onClick={() => {
										logout()
										setOpen(false)
									}}
									destructive
								>
									Đăng xuất
								</MenuItem>
							</div>
						</div>
					) : (
						<div>
							<div className="flex items-center justify-between gap-3 bg-gradient-to-b from-primary-tint/50 to-transparent px-4 py-3">
								<button
									type="button"
									onClick={() => setTab("menu")}
									className="inline-flex items-center gap-1 text-sm font-extrabold text-primary-dark hover:text-primary transition"
								>
									<Icon name="back" size="xs" />
									Quay lại
								</button>
								<div className="flex items-center gap-2">
									<span className="text-xs font-extrabold uppercase tracking-wider text-subtle">
										Thông báo
									</span>
									{unread > 0 && (
										<button
											type="button"
											onClick={() => readAll.mutate()}
											className="text-[11px] font-extrabold uppercase tracking-wider text-primary-dark bg-primary-tint border-2 border-primary/30 border-b-[3px] hover:bg-primary/15 px-2 py-0.5 rounded-full transition"
										>
											Đọc tất cả
										</button>
									)}
								</div>
							</div>
							{notifs.length === 0 ? (
								<div className="px-6 py-10 text-center">
									<img
										src="/mascot/lac-think.png"
										alt=""
										className="w-20 h-20 mx-auto mb-3 object-contain opacity-90"
									/>
									<p className="text-sm font-extrabold text-foreground">Chưa có thông báo</p>
									<p className="text-xs text-subtle mt-1">Hộp thư trống — quay lại sau nhé!</p>
								</div>
							) : (
								<div className="max-h-80 overflow-y-auto p-2 space-y-1.5">
									{notifs.map((n) => (
										<NotifItem key={n.id} notif={n} onRead={(id) => readOne.mutate(id)} />
									))}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
