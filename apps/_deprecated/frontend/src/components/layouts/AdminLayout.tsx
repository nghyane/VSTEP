import { Outlet } from "@tanstack/react-router"
import { AppSidebar } from "@/components/layouts/AppSidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export function AdminLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-14 shrink-0 items-center gap-3 border-b px-6">
					<SidebarTrigger className="-ml-2" />
					<Separator orientation="vertical" className="h-4" />
					<span className="text-sm text-muted-foreground">Quản trị</span>
				</header>
				<main className="p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
