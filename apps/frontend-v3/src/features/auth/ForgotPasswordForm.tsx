import { Link } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { useState } from "react"
import { requestPasswordReset } from "#/features/auth/actions"
import { inputClass } from "#/features/auth/styles"

function errorMessage(error: unknown) {
	if (error instanceof HTTPError) {
		const body = error.data as { message?: string; errors?: { email?: string[] } } | undefined
		return body?.errors?.email?.[0] ?? body?.message ?? "Không gửi được email đặt lại mật khẩu."
	}
	return "Không gửi được email đặt lại mật khẩu."
}

export function ForgotPasswordForm() {
	const [email, setEmail] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [result, setResult] = useState<"sent" | "missing" | null>(null)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError(null)
		setResult(null)
		try {
			const response = await requestPasswordReset(email)
			setResult(response.data.success ? "sent" : "missing")
		} catch (err) {
			setError(errorMessage(err))
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<>
			<div className="text-center mb-6">
				<h1 className="font-extrabold text-2xl text-foreground">Quên mật khẩu</h1>
				<p className="text-sm text-subtle mt-1">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
			</div>

			{result ? (
				<div className="space-y-4 text-center">
					<p
						className={`text-sm font-bold rounded-(--radius-button) py-3 px-4 ${
							result === "sent" ? "text-primary bg-primary-tint" : "text-destructive bg-destructive/10"
						}`}
					>
						{result === "sent"
							? "Hệ thống đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư."
							: "Email này chưa tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc đăng ký tài khoản mới."}
					</p>
					{result === "sent" ? (
						<Link to="/" search={{ auth: "login" }} className="btn btn-primary w-full h-12 text-base">
							Quay lại đăng nhập
						</Link>
					) : (
						<button
							type="button"
							onClick={() => setResult(null)}
							className="btn btn-primary w-full h-12 text-base"
						>
							Nhập lại email
						</button>
					)}
				</div>
			) : (
				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="space-y-1">
						<label htmlFor="forgot-email" className="text-xs font-bold text-muted uppercase">
							Email
						</label>
						<input
							id="forgot-email"
							type="email"
							placeholder="email@example.com"
							required
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={inputClass}
						/>
					</div>
					{error && (
						<p className="text-sm font-bold text-destructive text-center bg-destructive/10 rounded-(--radius-button) py-2">
							{error}
						</p>
					)}
					<button
						type="submit"
						disabled={submitting}
						className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
					>
						{submitting ? "Đang gửi..." : "Gửi email đặt lại mật khẩu"}
					</button>
				</form>
			)}

			<p className="text-sm text-muted mt-5 text-center">
				Nhớ mật khẩu?{" "}
				<Link to="/" search={{ auth: "login" }} className="font-bold text-primary hover:underline">
					Đăng nhập
				</Link>
			</p>
		</>
	)
}
