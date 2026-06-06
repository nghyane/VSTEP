import { createFileRoute, redirect } from "@tanstack/react-router"
import { FinancePage } from "#/features/admin-finance/FinancePage"
import { useAuth } from "#/lib/auth"

export const Route = createFileRoute("/_app/finance/")({
	beforeLoad: () => {
		if (useAuth.getState().user?.role !== "admin") throw redirect({ to: "/" })
	},
	component: FinancePage,
})
