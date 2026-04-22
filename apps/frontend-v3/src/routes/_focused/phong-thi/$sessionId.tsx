import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_focused/phong-thi/$sessionId")({
	component: PhongThiPage,
})

function PhongThiPage() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="text-muted text-sm">Đang xây dựng phòng thi...</p>
		</div>
	)
}
