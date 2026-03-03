import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, register } from "@/lib/api"
import { save } from "@/lib/auth"

export const Route = createFileRoute("/_auth/register")({
	component: RegisterPage,
})

function RegisterPage() {
	const navigate = useNavigate()
	const [fullName, setFullName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			await register(email, password, fullName || undefined)
			const res = await login(email, password)
			save(res.accessToken, res.refreshToken, res.user)
			navigate({ to: "/onboarding" })
		} catch (err) {
			setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-semibold tracking-tight">Tạo tài khoản</h2>
				<p className="mt-1 text-sm text-muted-foreground">Bắt đầu hành trình chinh phục VSTEP</p>
			</div>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="fullName">Họ và tên</Label>
					<Input
						id="fullName"
						type="text"
						placeholder="Nguyễn Văn A"
						value={fullName}
						onChange={(e) => setFullName(e.target.value)}
					/>
				</div>
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
					<Input
						id="password"
						type="password"
						placeholder="Tối thiểu 8 ký tự"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				{error && <p className="text-sm text-destructive">{error}</p>}
				<Button type="submit" className="w-full" disabled={loading}>
					{loading ? "Đang xử lý..." : "Tạo tài khoản"}
				</Button>
			</form>
			<p className="text-center text-sm text-muted-foreground">
				Đã có tài khoản?{" "}
				<Link to="/login" className="text-primary hover:underline">
					Đăng nhập
				</Link>
			</p>
		</div>
	)
}
