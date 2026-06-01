import { Link } from "@tanstack/react-router"

export function Footer() {
	return (
		<footer className="border-t bg-background">
			<div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
				<p>© {new Date().getFullYear()} VSTEP Practice</p>
				<nav className="flex gap-6">
					<a href="#how-it-works" className="transition-colors hover:text-foreground">
						Cách hoạt động
					</a>
					<Link to="/luyen-tap" className="transition-colors hover:text-foreground">
						Luyện tập
					</Link>
				</nav>
			</div>
		</footer>
	)
}
