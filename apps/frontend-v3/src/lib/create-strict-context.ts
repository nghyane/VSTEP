import { createContext, type Provider, useContext } from "react"

/**
 * Factory tạo type-safe context + hook.
 * Throw error rõ ràng nếu dùng hook ngoài Provider.
 *
 * Usage:
 *   const [AuthProvider, useAuth] = createStrictContext<AuthValue>("Auth")
 */
export function createStrictContext<T>(name: string): [Provider<T>, () => T] {
	const Ctx = createContext<T | undefined>(undefined)

	function useStrictContext(): T {
		const value = useContext(Ctx)
		if (value === undefined) {
			throw new Error(`use${name} must be used within ${name}Provider`)
		}
		return value
	}

	return [Ctx.Provider as Provider<T>, useStrictContext]
}
