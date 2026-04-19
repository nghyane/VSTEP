import { useForm } from "@tanstack/react-form"
import { Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { inputClass } from "#/features/auth/styles"
import { type ApiResponse, api } from "#/lib/api"
import { tokenStorage } from "#/lib/token-storage"
import type { Profile, User } from "#/types/auth"

const LEVELS = ["A2", "B1", "B2", "C1"] as const

export function RegisterForm() {
	const navigate = useNavigate()
	const [step, setStep] = useState<1 | 2>(1)
	const [error, setError] = useState("")

	const form = useForm({
		defaultValues: {
			nickname: "",
			email: "",
			password: "",
			target_level: "B2",
			target_deadline: "",
		},
		onSubmit: async ({ value }) => {
			setError("")
			try {
				const { data } = await api.post("auth/register", { json: value }).json<
					ApiResponse<{
						access_token: string
						refresh_token: string
						account: User
						active_profile: Profile | null
					}>
				>()
				tokenStorage.setAccess(data.access_token)
				tokenStorage.setRefresh(data.refresh_token)
				tokenStorage.setUser(data.account)
				tokenStorage.setProfile(data.active_profile)
				navigate({ to: "/dashboard" })
			} catch {
				setError("Không thể đăng ký. Email có thể đã được sử dụng.")
			}
		},
	})

	if (step === 1) {
		return (
			<>
				<h1 className="font-extrabold text-2xl text-foreground mb-2">Tạo tài khoản</h1>
				<p className="text-sm text-subtle mb-8">Bước 1/2 · Thông tin đăng nhập</p>
				<div className="space-y-3">
					<form.Field name="nickname">
						{(field) => (
							<input
								type="text"
								placeholder="Nickname"
								required
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<input
								type="email"
								placeholder="Email"
								required
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
					<form.Field name="password">
						{(field) => (
							<input
								type="password"
								placeholder="Mật khẩu"
								required
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
					<button
						type="button"
						onClick={() => {
							const v = form.state.values
							if (v.nickname && v.email && v.password) setStep(2)
						}}
						className="btn btn-primary w-full h-12 text-base"
					>
						Tiếp tục
					</button>
				</div>
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

	return (
		<>
			<h1 className="font-extrabold text-2xl text-foreground mb-2">Đặt mục tiêu</h1>
			<p className="text-sm text-subtle mb-8">Bước 2/2 · Trình độ và kỳ thi</p>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
				className="space-y-4"
			>
				<div>
					<p className="text-sm font-bold text-foreground mb-3 text-left">Mục tiêu trình độ</p>
					<form.Field name="target_level">
						{(field) => (
							<div className="grid grid-cols-4 gap-2">
								{LEVELS.map((lv) => (
									<button
										key={lv}
										type="button"
										onClick={() => field.handleChange(lv)}
										className={`h-12 rounded-(--radius-button) font-bold text-base transition ${
											field.state.value === lv
												? "bg-primary text-primary-foreground"
												: "bg-surface border-2 border-border text-foreground hover:border-primary"
										}`}
									>
										{lv}
									</button>
								))}
							</div>
						)}
					</form.Field>
				</div>
				<div>
					<p className="text-sm font-bold text-foreground mb-3 text-left">Ngày thi dự kiến</p>
					<form.Field name="target_deadline">
						{(field) => (
							<input
								type="date"
								required
								value={field.state.value}
								onChange={(e) => field.handleChange(e.target.value)}
								className={inputClass}
							/>
						)}
					</form.Field>
				</div>
				{error && <p className="text-sm text-destructive font-bold">{error}</p>}
				<button
					type="submit"
					disabled={form.state.isSubmitting}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{form.state.isSubmitting ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
				</button>
			</form>
			<button
				type="button"
				onClick={() => {
					setStep(1)
					setError("")
				}}
				className="text-sm font-bold text-primary hover:underline mt-4"
			>
				← Quay lại
			</button>
		</>
	)
}
