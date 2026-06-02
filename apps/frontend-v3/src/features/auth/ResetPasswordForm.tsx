import { Link } from "@tanstack/react-router"
import { HTTPError } from "ky"
import { useState } from "react"
import { resetPassword } from "#/features/auth/actions"
import { PasswordInput } from "#/features/auth/PasswordInput"

function errorMessage(error: unknown) {
	if (error instanceof HTTPError) {
		const body = error.data as
			| { message?: string; errors?: { email?: string[]; password?: string[] } }
			| undefined
		return (
			body?.errors?.password?.[0] ??
			body?.errors?.email?.[0] ??
			body?.message ??
			"Không đặt lại được mật khẩu."
		)
	}
	return "Không đặt lại được mật khẩu."
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
	const [password, setPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [submitting, setSubmitting] = useState(false)
	const [completed, setCompleted] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (password !== confirm) {
			setError("Mật khẩu nhập lại không khớp.")
			return
		}
		setSubmitting(true)
		setError(null)
		try {
			await resetPassword({ email, token, password, password_confirmation: confirm })
			setCompleted(true)
		} catch (err) {
			setError(errorMessage(err))
		} finally {
			setSubmitting(false)
		}
	}

	if (!email || !token) {
		return (
			<>
				<div className="text-center mb-6">
					<h1 className="font-extrabold text-2xl text-foreground">Liên kết không hợp lệ</h1>
					<p className="text-sm text-subtle mt-1">Vui lòng yêu cầu email đặt lại mật khẩu mới.</p>
				</div>
				<Link to="/" search={{ auth: "forgot" }} className="btn btn-primary w-full h-12 text-base">
					Gửi lại email
				</Link>
			</>
		)
	}

	if (completed) {
		return (
			<>
				<div className="text-center mb-6">
					<h1 className="font-extrabold text-2xl text-foreground">Đã đổi mật khẩu</h1>
					<p className="text-sm text-subtle mt-1">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
				</div>
				<Link to="/" search={{ auth: "login" }} className="btn btn-primary w-full h-12 text-base">
					Đăng nhập
				</Link>
			</>
		)
	}

	return (
		<>
			<div className="text-center mb-6">
				<h1 className="font-extrabold text-2xl text-foreground">Đặt lại mật khẩu</h1>
				<p className="text-sm text-subtle mt-1">Tạo mật khẩu mới cho {email}.</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-3">
				<div className="space-y-1">
					<label htmlFor="reset-password" className="text-xs font-bold text-muted uppercase">
						Mật khẩu mới
					</label>
					<PasswordInput
						id="reset-password"
						placeholder="≥8 ký tự, có chữ hoa, chữ thường, số"
						required
						autoComplete="new-password"
						value={password}
						onChange={setPassword}
					/>
				</div>
				<div className="space-y-1">
					<label htmlFor="reset-confirm" className="text-xs font-bold text-muted uppercase">
						Nhập lại mật khẩu
					</label>
					<PasswordInput
						id="reset-confirm"
						placeholder="Nhập lại mật khẩu mới"
						required
						autoComplete="new-password"
						value={confirm}
						onChange={setConfirm}
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
					{submitting ? "Đang đổi..." : "Đổi mật khẩu"}
				</button>
			</form>
		</>
	)
}
