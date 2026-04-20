import { Link, useMatchRoute } from "@tanstack/react-router"
import { Icon, type IconName } from "#/components/Icon"
import { useAuth } from "#/lib/auth"
import { cn } from "#/lib/utils"

const NAV_ITEMS: { label: string; icon: IconName; to: string }[] = [
	{ label: "Tổng quan", icon: "house", to: "/dashboard" },
	{ label: "Luyện tập", icon: "weights", to: "/luyen-tap" },
	{ label: "Thi thử", icon: "target", to: "/thi-thu" },
	{ label: "Khóa học", icon: "guidebook", to: "/khoa-hoc" },
]

export function Sidebar() {
	const matchRoute = useMatchRoute()
	const profile = useAuth((s) => s.profile)
	const initial = profile?.nickname?.charAt(0).toUpperCase() ?? "?"
	const profileActive = matchRoute({ to: "/ho-so", fuzzy: true })

	return (
		<aside className="w-[260px] shrink-0 bg-surface border-r border-border flex flex-col sticky top-0 h-screen">
			<div className="px-7 py-7">
				<Link to="/dashboard" className="font-display text-3xl text-primary">
					VSTEP
				</Link>
			</div>

			<nav className="flex-1 px-4 py-2 space-y-1">
				{NAV_ITEMS.map((item) => {
					const active = matchRoute({ to: item.to, fuzzy: true })
					return (
						<Link
							key={item.to}
							to={item.to}
							className={cn(
								"flex items-center gap-4 px-4 py-3 rounded-xl font-bold",
								active ? "bg-primary-tint text-primary" : "text-muted hover:bg-background",
							)}
						>
							<span className="w-8 h-6 flex items-center justify-center shrink-0">
								<Icon name={item.icon} size="sm" />
							</span>
							<span className="text-base">{item.label}</span>
						</Link>
					)
				})}

				<Link
					to="/ho-so"
					className={cn(
						"flex items-center gap-4 px-4 py-3 rounded-xl font-bold",
						profileActive ? "bg-primary-tint text-primary" : "text-muted hover:bg-background",
					)}
				>
					<span className="w-8 h-6 flex items-center justify-center shrink-0">
						<span
							className={cn(
								"w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center font-display text-sm",
								profileActive ? "border-primary text-primary" : "border-subtle text-subtle",
							)}
						>
							{initial}
						</span>
					</span>
					<span className="text-base">Hồ sơ</span>
				</Link>

				<button
					type="button"
					className="flex items-center gap-4 px-4 py-3 rounded-xl text-muted font-bold w-full opacity-50 cursor-not-allowed"
					disabled
					title="Sắp ra mắt"
				>
					<span className="w-8 h-6 flex items-center justify-center shrink-0">
						<Icon name="more" size="sm" className="text-more" />
					</span>
					<span className="text-base">Xem thêm</span>
				</button>
			</nav>
		</aside>
	)
}
