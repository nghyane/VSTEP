import { Link, useMatchRoute } from "@tanstack/react-router"
import { Icon, type IconName } from "#/components/Icon"
import { Logo } from "#/components/Logo"
import { SkillIcon } from "#/components/SkillIcon"
import { useSession } from "#/lib/auth"
import { cn } from "#/lib/utils"

type NavItem =
	| { label: string; to: string; kind: "icon"; icon: IconName }
	| { label: string; to: string; kind: "png"; png: string }

const NAV_ITEMS: NavItem[] = [
	{ label: "Tổng quan", to: "/dashboard", kind: "icon", icon: "house" },
	{ label: "Luyện tập", to: "/luyen-tap", kind: "icon", icon: "weights" },
	{ label: "Thi thử", to: "/thi-thu", kind: "png", png: "mock-exam" },
	{ label: "Khóa học", to: "/khoa-hoc", kind: "png", png: "course" },
]

export function Sidebar() {
	const matchRoute = useMatchRoute()
	const { profile } = useSession()
	const initial = profile.nickname.charAt(0).toUpperCase()
	const profileActive = matchRoute({ to: "/ho-so", fuzzy: true })

	return (
		<aside className="w-[260px] shrink-0 bg-surface border-r border-border flex flex-col sticky top-0 h-screen">
			<div className="px-7 py-7">
				<Link to="/dashboard">
					<Logo size="lg" />
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
								{item.kind === "icon" ? (
									<Icon name={item.icon} size="sm" />
								) : (
									<SkillIcon name={item.png} size="md" className="-my-1" />
								)}
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
