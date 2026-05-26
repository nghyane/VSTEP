import { redirect } from "@tanstack/react-router"
import { useAuth } from "#/lib/auth"

/**
 * Shared auth guard for layout routes.
 * Throws redirect to login modal if user is not authenticated.
 *
 * Usage:
 *   export const Route = createFileRoute("/_app")({ beforeLoad: requireAuth, ... })
 */
export function requireAuth({ location }: { location: { pathname: string } }) {
	const { status } = useAuth.getState()
	if (status !== "authenticated") {
		throw redirect({ to: "/", search: { auth: "login", redirect: location.pathname } })
	}
}
