import { Link, Outlet, useMatches } from "@tanstack/react-router"
import { Fragment } from "react"
import { AppSidebar } from "@/components/layouts/AppSidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const BREADCRUMB_LABELS: Record<string, string> = {
	"/dashboard": "Lớp học",
}

export function InstructorLayout() {
	const matches = useMatches()
	const crumbs = matches
		.filter((m) => m.pathname !== "/" && !m.id.startsWith("/_"))
		.map((m) => ({
			path: m.pathname,
			label: BREADCRUMB_LABELS[m.pathname] ?? m.pathname.split("/").pop() ?? "",
		}))

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center gap-3 border-b px-6">
					<SidebarTrigger className="-ml-2" />
					<Separator orientation="vertical" className="h-4" />
					<nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
						{crumbs.map((crumb, i) => (
							<Fragment key={crumb.path}>
								{i > 0 && <span>/</span>}
								{i < crumbs.length - 1 ? (
									<Link to={crumb.path} className="hover:text-foreground">
										{crumb.label}
									</Link>
								) : (
									<span>{crumb.label}</span>
								)}
							</Fragment>
						))}
					</nav>
				</header>
				<main className="p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
