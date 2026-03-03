import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { login } from "@/lib/api"
import { save } from "@/lib/auth"

export const Route = createFileRoute("/_auth/login")({
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			const res = await login(email, password)
			save(res.accessToken, res.refreshToken, res.user)
			const dest = res.user.role === "admin" ? "/admin" : "/dashboard"
			navigate({ to: dest })
		} catch (err) {
			setError(err instanceof Error ? err.message : "Đăng nhập thất bại")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight">Đăng nhập</h2>
				<p className="mt-1 text-sm text-muted-foreground">Nhập email và mật khẩu để tiếp tục</p>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="you@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Mật khẩu</Label>
					<PasswordInput
						id="password"
						placeholder="••••••••"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Đang đăng nhập..." : "Đăng nhập"}
				</Button>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				Chưa có tài khoản?{" "}
				<Link to="/register" className="text-primary hover:underline">
					Đăng ký
				</Link>
			</p>
		</div>
	)
}
