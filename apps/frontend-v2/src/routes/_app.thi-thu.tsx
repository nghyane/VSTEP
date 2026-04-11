import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_app/thi-thu")({
	component: ThiThuPage,
})

function ThiThuPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold">Thi thử</h1>
			<p className="mt-1 text-muted-foreground">Trang thi thử — đang xây dựng</p>
		</div>
	)
}
