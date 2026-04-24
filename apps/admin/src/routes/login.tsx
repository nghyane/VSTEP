import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "#/components/Button"
import { Input } from "#/components/Input"
import { type ApiResponse, api, extractError } from "#/lib/api"
import { useAuth } from "#/lib/auth"

interface LoginResponse {
	access_token: string
	user: {
		id: string
		email: string
		full_name: string
		role: AdminRole
	}
}

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		const { token, user } = useAuth.getState()
		if (token && user) throw redirect({ to: "/" })
	},
	component: LoginPage,
})

function LoginPage() {
	const setSession = useAuth((s) => s.setSession)
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)

	const mutation = useMutation({
		mutationFn: async () => {
			const res = await api
				.post("auth/login", { json: { email, password } })
				.json<ApiResponse<LoginResponse>>()
			return res.data
		},
		onSuccess: (data) => {
			const user = data.user
			if (!["admin", "staff", "teacher"].includes(user.role)) {
				setError("Tài khoản không có quyền truy cập admin panel.")
				return
			}
			setSession(data.access_token, {
				id: user.id,
				email: user.email,
				name: user.full_name,
				role: user.role,
			})
			window.location.href = "/"
		},
		onError: (err) => {
			const { message } = extractError(err)
			setError(message || "Đăng nhập thất bại")
		},
	})

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<form
				onSubmit={(e) => {
					e.preventDefault()
					setError(null)
					mutation.mutate()
				}}
				className="w-full max-w-sm rounded-(--radius-card) border border-border bg-surface p-6 shadow-sm"
			>
				<div className="mb-5">
					<h1 className="text-lg font-semibold tracking-tight">VSTEP Admin</h1>
					<p className="mt-1 text-sm text-muted">Đăng nhập để tiếp tục.</p>
				</div>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<label htmlFor="email" className="text-xs font-medium text-muted">
							Email
						</label>
						<Input
							id="email"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="email"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<label htmlFor="password" className="text-xs font-medium text-muted">
							Mật khẩu
						</label>
						<Input
							id="password"
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
						/>
					</div>
					{error && <div className="rounded-md bg-danger-tint px-3 py-2 text-xs text-danger">{error}</div>}
					<Button type="submit" size="lg" loading={mutation.isPending}>
						Đăng nhập
					</Button>
				</div>
			</form>
		</div>
	)
}
