import { createFileRoute } from "@tanstack/react-router"
import { FinancePage } from "#/features/admin-finance/FinancePage"

export const Route = createFileRoute("/_app/finance/")({
	component: FinancePage,
})
