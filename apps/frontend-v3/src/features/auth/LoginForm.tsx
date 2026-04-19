import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { useAuth } from "#/features/auth/AuthProvider"
import { inputClass } from "#/features/auth/styles"

export function LoginForm() {
	const { login } = useAuth()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			await login(email, password)
		} catch {
			setError("Email hoặc mật khẩu không đúng")
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			<h1 className="font-extrabold text-2xl text-foreground mb-8">Đăng nhập</h1>
			<form onSubmit={handleSubmit} className="space-y-3">
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className={inputClass}
				/>
				<input
					type="password"
					placeholder="Mật khẩu"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					className={inputClass}
				/>
				{error && <p className="text-sm text-destructive font-bold">{error}</p>}
				<button
					type="submit"
					disabled={loading}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{loading ? "Đang đăng nhập..." : "Đăng nhập"}
				</button>
			</form>
			<Link
				to="/"
				search={{ auth: "choose" }}
				className="text-sm font-bold text-primary hover:underline mt-4 inline-block"
			>
				← Quay lại
			</Link>
		</>
	)
}
