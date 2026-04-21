import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { Icon, StaticIcon, type StaticIconName } from "#/components/Icon"
import { readAllNotifications } from "#/features/notifications/actions"
import { notificationsQuery } from "#/features/notifications/queries"
import type { Notification } from "#/features/notifications/types"
import { useAuth, useSession } from "#/lib/auth"
import { useClickOutside } from "#/lib/use-click-outside"

const NOTIF_ICON: Record<string, StaticIconName> = {
	coin: "gem-color",
	streak: "streak-sm",
	trophy: "trophy",
	target: "target-md",
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

function NotifItem({ notif }: { notif: Notification }) {
	const icon = NOTIF_ICON[notif.icon_key ?? ""] ?? "gem-color"
	return (
		<div className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${!notif.read_at ? "bg-background" : ""}`}>
			<StaticIcon name={icon} size="sm" className="shrink-0 mt-0.5" />
			<div className="min-w-0 flex-1">
				<p className="text-sm font-bold text-foreground leading-snug">{notif.title}</p>
				{notif.body && <p className="text-xs text-muted mt-0.5 leading-snug">{notif.body}</p>}
				<p className="text-xs text-subtle mt-1">{timeAgo(notif.created_at)}</p>
			</div>
			{!notif.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
		</div>
	)
}

function MenuItem({ children, onClick, destructive }: { children: React.ReactNode; onClick: () => void; destructive?: boolean }) {
	return (
		<button type="button" onClick={onClick}
			className={`w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-wide transition hover:bg-background ${destructive ? "text-subtle" : "text-muted"}`}>
			{children}
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
	const [open, setOpen] = useState(false)
	const [tab, setTab] = useState<"menu" | "notifs">("menu")
	const menuRef = useRef<HTMLDivElement>(null)
	const qc = useQueryClient()

	useClickOutside(menuRef, () => setOpen(false))

	const readAll = useMutation({
		mutationFn: readAllNotifications,
		onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
	})

	const notifs = notifsData?.data ?? []

	function toggle() {
		const next = !open
		setOpen(next)
		setTab("menu")
		if (next) qc.prefetchQuery(notificationsQuery)
	}

	return (
		<div className="relative" ref={menuRef}>
			<button type="button" onClick={toggle}
				className="relative w-10 h-10 rounded-full bg-primary text-primary-foreground font-display text-base flex items-center justify-center hover:ring-2 hover:ring-primary/40 transition">
				{initial}
				{unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive border-2 border-background" />}
			</button>

			{open && (
				<div className="absolute right-0 top-full mt-3 w-72 bg-surface rounded-(--radius-banner) border-2 border-border overflow-hidden animate-[menuIn_0.15s_ease-out]">
					{tab === "menu" ? (
						<div className="p-2">
							<div className="flex items-center gap-3 px-4 py-3">
								<div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-display text-base shrink-0">
									{initial}
								</div>
								<div className="min-w-0">
									<p className="text-sm font-bold text-foreground truncate">{profile.nickname}</p>
									<p className="text-xs text-subtle truncate">{user?.email}</p>
								</div>
								{profile.target_level && (
									<span className="ml-auto text-xs font-bold text-primary bg-primary-tint px-2.5 py-1 rounded-full">{profile.target_level}</span>
								)}
							</div>
							<div className="h-px bg-border mx-3 my-1" />
							<MenuItem onClick={() => setTab("notifs")}>
								Thông báo
								{unread > 0 && (
									<span className="ml-1 text-xs font-bold text-primary-foreground bg-destructive px-2 py-0.5 rounded-full inline-flex items-center justify-center">{unread}</span>
								)}
							</MenuItem>
							<MenuItem onClick={() => setOpen(false)}>Chỉnh sửa hồ sơ</MenuItem>
							<MenuItem onClick={() => { logout(); setOpen(false) }} destructive>Đăng xuất</MenuItem>
						</div>
					) : (
						<div>
							<div className="flex items-center justify-between px-4 py-3">
								<button type="button" onClick={() => setTab("menu")} className="flex items-center gap-1 text-sm font-bold text-primary">
									<Icon name="back" size="xs" />
									Quay lại
								</button>
								{unread > 0 && (
									<button type="button" onClick={() => readAll.mutate()} className="text-xs font-bold text-primary">Đọc tất cả</button>
								)}
							</div>
							<div className="h-px bg-border" />
							{notifs.length === 0 ? (
								<div className="px-4 py-10 text-center">
									<img src="/mascot/lac-think.png" alt="" className="w-16 h-16 mx-auto mb-2 object-contain" />
									<p className="text-sm font-bold text-subtle">Chưa có thông báo</p>
								</div>
							) : (
								<div className="max-h-72 overflow-y-auto p-2 space-y-1">
									{notifs.map((n) => <NotifItem key={n.id} notif={n} />)}
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
