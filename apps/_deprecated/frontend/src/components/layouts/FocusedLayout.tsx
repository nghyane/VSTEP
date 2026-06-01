import { Outlet } from "@tanstack/react-router"

export function FocusedLayout() {
	return (
		<div className="flex h-screen flex-col bg-background">
			<main className="flex-1 overflow-hidden">
				<Outlet />
			</main>
		</div>
	)
}
