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
	const [loading, setLoading] = useState(false)

	const [nickname, setNickname] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [targetLevel, setTargetLevel] = useState("B2")
	const [targetDeadline, setTargetDeadline] = useState("")

	function goStep2() {
		if (nickname && email && password) {
			setStep(2)
			setError("")
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError("")
		setLoading(true)
		try {
			const { data } = await api
				.post("auth/register", {
					json: { email, password, nickname, target_level: targetLevel, target_deadline: targetDeadline },
				})
				.json<
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
		} finally {
			setLoading(false)
		}
	}

	if (step === 1) {
		return (
			<>
				<h1 className="font-extrabold text-2xl text-foreground mb-2">Tạo tài khoản</h1>
				<p className="text-sm text-subtle mb-8">Bước 1/2 · Thông tin đăng nhập</p>
				<div className="space-y-3">
					<input
						type="text"
						placeholder="Nickname"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						required
						className={inputClass}
					/>
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
					<button type="button" onClick={goStep2} className="btn btn-primary w-full h-12 text-base">
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
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<p className="text-sm font-bold text-foreground mb-3 text-left">Mục tiêu trình độ</p>
					<div className="grid grid-cols-4 gap-2">
						{LEVELS.map((lv) => (
							<button
								key={lv}
								type="button"
								onClick={() => setTargetLevel(lv)}
								className={`h-12 rounded-(--radius-button) font-bold text-base transition ${
									targetLevel === lv
										? "bg-primary text-primary-foreground"
										: "bg-surface border-2 border-border text-foreground hover:border-primary"
								}`}
							>
								{lv}
							</button>
						))}
					</div>
				</div>
				<div>
					<p className="text-sm font-bold text-foreground mb-3 text-left">Ngày thi dự kiến</p>
					<input
						type="date"
						value={targetDeadline}
						onChange={(e) => setTargetDeadline(e.target.value)}
						required
						className={inputClass}
					/>
				</div>
				{error && <p className="text-sm text-destructive font-bold">{error}</p>}
				<button
					type="submit"
					disabled={loading}
					className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
				>
					{loading ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký"}
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
