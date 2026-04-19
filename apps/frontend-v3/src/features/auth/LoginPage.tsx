import { useState } from "react"
import closeIcon from "#/assets/icons/close-small.svg"
import { useAuth } from "#/features/auth/AuthProvider"

interface Props {
	onClose?: () => void
}

export function LoginPage({ onClose }: Props) {
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
		<div className="fixed inset-0 z-50 bg-surface flex flex-col">
			<div className="flex items-center justify-between px-6 py-4">
				{onClose ? (
					<button type="button" onClick={onClose} className="p-2 hover:opacity-70">
						<img src={closeIcon} className="w-5 h-5" alt="Đóng" />
					</button>
				) : (
					<div className="w-9" />
				)}
				<button type="button" className="btn btn-secondary text-xs">
					Đăng ký
				</button>
			</div>

			<div className="flex-1 flex items-center justify-center px-6">
				<div className="w-full max-w-[400px] text-center">
					<h1 className="font-extrabold text-2xl text-foreground mb-8">Đăng nhập</h1>

					<div className="w-16 h-16 rounded-full bg-primary mx-auto mb-2 flex items-center justify-center text-primary-foreground font-display text-2xl">
						V
					</div>
					<p className="text-sm text-subtle mb-8">VSTEP</p>

					<form onSubmit={handleSubmit} className="space-y-3">
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full h-12 px-4 rounded-(--radius-button) border-2 border-border bg-surface text-foreground text-base font-bold placeholder:text-placeholder placeholder:font-normal focus:border-primary focus:outline-none transition"
						/>
						<input
							type="password"
							placeholder="Mật khẩu"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full h-12 px-4 rounded-(--radius-button) border-2 border-border bg-surface text-foreground text-base font-bold placeholder:text-placeholder placeholder:font-normal focus:border-primary focus:outline-none transition"
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

					<p className="text-xs text-subtle mt-8">
						Khi đăng nhập, bạn đồng ý với <strong className="text-muted">Điều khoản</strong> và{" "}
						<strong className="text-muted">Chính sách bảo mật</strong>
					</p>
				</div>
			</div>
		</div>
	)
}
