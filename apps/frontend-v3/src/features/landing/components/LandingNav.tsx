import { Link } from "@tanstack/react-router"
import { Logo } from "#/components/Logo"

interface LandingNavProps {
	showCta: boolean
}

export function LandingNav({ showCta }: LandingNavProps) {
	return (
		<nav
			className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-transparent transition-colors"
			style={showCta ? { borderBottomColor: "var(--color-border)" } : undefined}
		>
			<div className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
				<Logo size="lg" />
				<div
					className={`transition-all duration-300 ${showCta ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
				>
					<Link to="/" search={{ auth: "register" }} className="btn btn-primary text-sm px-6 py-2.5">
						Bắt đầu
					</Link>
				</div>
			</div>
		</nav>
	)
}
