import { createFileRoute } from "@tanstack/react-router"
import { Result } from "antd"

export const Route = createFileRoute("/_app/promo/")({
	component: PromoPage,
})

function PromoPage() {
	return (
		<Result
			status="info"
			title="Khuyến mãi"
			subTitle="Trang đang được xây dựng. Backend chưa có endpoint Promo codes CRUD."
		/>
	)
}
