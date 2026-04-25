import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { DatePicker } from "#/features/auth/DatePicker"
import { GoogleButton } from "#/features/auth/GoogleButton"
import { inputClass } from "#/features/auth/styles"
import { useAuth } from "#/lib/auth"
import { cn } from "#/lib/utils"

// ─── Step 1: credentials ───────────────────────────────────────────────────

interface Step1Data {
	email: string
	password: string
	confirm: string
}

interface Step1Props {
	initial: Step1Data
	onNext: (data: Step1Data) => void
	onGoogleToken: (idToken: string) => void
	googleLoading: boolean
}

function Step1({ initial, onNext, onGoogleToken, googleLoading }: Step1Props) {
	const [email, setEmail] = useState(initial.email)
	const [password, setPassword] = useState(initial.password)
	const [confirm, setConfirm] = useState(initial.confirm)
	const [error, setError] = useState<string | null>(null)

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (password.length < 8) {
			setError("Mật khẩu tối thiểu 8 ký tự.")
			return
		}
		if (password !== confirm) {
			setError("Mật khẩu nhập lại không khớp.")
			return
		}
		setError(null)
		onNext({ email, password, confirm })
	}

	return (
		<>
			<div className="text-center mb-6">
				<h1 className="font-extrabold text-2xl text-foreground">Tạo tài khoản</h1>
				<p className="text-sm text-subtle mt-1">Bắt đầu hành trình VSTEP của bạn.</p>
			</div>

			<GoogleButton onToken={onGoogleToken} text="signup_with" disabled={googleLoading} />

			<div className="flex items-center gap-3 my-5">
				<div className="flex-1 h-px bg-border" />
				<span className="text-[11px] text-placeholder font-bold uppercase">hoặc</span>
				<div className="flex-1 h-px bg-border" />
			</div>

			<form onSubmit={handleSubmit} className="space-y-3">
				<div className="space-y-1">
					<label htmlFor="reg-email" className="text-xs font-bold text-muted uppercase">Email</label>
					<input
						id="reg-email"
						type="email"
						placeholder="email@example.com"
						required
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className={inputClass}
					/>
				</div>
				<div className="space-y-1">
					<label htmlFor="reg-password" className="text-xs font-bold text-muted uppercase">Mật khẩu</label>
					<input
						id="reg-password"
						type="password"
						placeholder="Tối thiểu 8 ký tự"
						required
						autoComplete="new-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={inputClass}
					/>
				</div>
				<div className="space-y-1">
					<label htmlFor="reg-confirm" className="text-xs font-bold text-muted uppercase">Nhập lại mật khẩu</label>
					<input
						id="reg-confirm"
						type="password"
						placeholder="Nhập lại mật khẩu"
						required
						autoComplete="new-password"
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						className={inputClass}
					/>
				</div>
				{error && (
					<p className="text-sm font-bold text-destructive text-center bg-destructive/10 rounded-(--radius-button) py-2">
						{error}
					</p>
				)}
				<button type="submit" className="btn btn-primary w-full h-12 text-base">
					Tiếp tục
				</button>
			</form>

			<p className="text-sm text-muted mt-5 text-center">
				Đã có tài khoản?{" "}
				<Link to="/" search={{ auth: "login" }} className="font-bold text-primary hover:underline">
					Đăng nhập
				</Link>
			</p>
		</>
	)
}

// ─── Step 2: onboarding ────────────────────────────────────────────────────

const LEVELS = ["B1", "B2", "C1"] as const
type Level = (typeof LEVELS)[number]

const LEVEL_INFO: Record<Level, string> = {
	B1: "Giao tiếp cơ bản",
	B2: "Phổ biến nhất",
	C1: "Nâng cao",
}

interface Step2Props {
	onBack: () => void
	onSubmit: (nickname: string, level: Level, deadline: string) => Promise<void>
	submitting: boolean
	initialNickname?: string
	googleMode: boolean
}

function Step2({ onBack, onSubmit, submitting, initialNickname, googleMode }: Step2Props) {
	const [nickname, setNickname] = useState(initialNickname ?? "")
	const [level, setLevel] = useState<Level>("B2")
	const [deadline, setDeadline] = useState("")
	const [error, setError] = useState<string | null>(null)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!nickname.trim()) {
			setError("Nickname không được để trống.")
			return
		}
		if (!deadline) {
			setError("Vui lòng chọn ngày thi dự kiến.")
			return
		}
		setError(null)
		await onSubmit(nickname.trim(), level, deadline)
	}

	return (
		<div className="flex flex-col h-full">
			<div className="shrink-0">
				{!googleMode && (
					<button
						type="button"
						onClick={onBack}
						className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-foreground transition mb-4"
					>
						<span className="text-lg leading-none">←</span>
						Quay lại
					</button>
				)}
				<div className="text-center mb-6">
					<div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-3">
						<span className="text-3xl">🎯</span>
					</div>
					<h1 className="font-extrabold text-2xl text-foreground">
						{googleMode ? "Chào mừng!" : "Thiết lập mục tiêu"}
					</h1>
					<p className="text-sm text-subtle mt-1">
						{googleMode ? "Chọn nickname và mục tiêu." : "Cho chúng mình biết thêm về bạn."}
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 gap-4">
				<ScrollArea className="flex-1 min-h-0">
					<div className="space-y-5 pb-1">
						<div className="space-y-1">
							<label htmlFor="reg-nickname" className="text-xs font-bold text-muted uppercase">
								Nickname
							</label>
							<input
								id="reg-nickname"
								type="text"
								placeholder="Bạn muốn được gọi là gì?"
								required
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
								className={inputClass}
							/>
						</div>

						<div className="space-y-2">
							<p className="text-xs font-bold text-muted uppercase">Mục tiêu trình độ</p>
							<div className="grid grid-cols-3 gap-2">
								{LEVELS.map((l) => (
									<button
										type="button"
										key={l}
										onClick={() => setLevel(l)}
										className={cn(
											"relative h-14 rounded-(--radius-button) font-bold text-lg border-2 border-b-4 transition",
											level === l
												? "bg-primary text-primary-foreground border-primary-dark"
												: "bg-surface border-border text-foreground hover:border-primary/40",
										)}
									>
										{l}
										<span
											className={cn(
												"block text-[10px] font-bold mt-[-2px]",
												level === l ? "text-primary-foreground/80" : "text-subtle",
											)}
										>
											{LEVEL_INFO[l]}
										</span>
									</button>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-xs font-bold text-muted uppercase">Ngày thi dự kiến</p>
							<DatePicker value={deadline} onChange={setDeadline} />
						</div>
					</div>
				</ScrollArea>

				<div className="shrink-0 space-y-3 pt-2">
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
						{submitting ? "Đang tạo..." : "Bắt đầu học"}
					</button>
				</div>
			</form>
		</div>
	)
}

// ─── Main component ────────────────────────────────────────────────────────

type Flow = "password" | "google"

export function RegisterForm() {
	const register = useAuth((s) => s.register)
	const loginWithGoogle = useAuth((s) => s.loginWithGoogle)
	const completeOnboarding = useAuth((s) => s.completeOnboarding)
	const [step, setStep] = useState<1 | 2>(1)
	const [flow, setFlow] = useState<Flow>("password")
	const [submitting, setSubmitting] = useState(false)
	const [googleLoading, setGoogleLoading] = useState(false)
	const [suggestedNickname, setSuggestedNickname] = useState<string | null>(null)
	const [credentials, setCredentials] = useState<Step1Data>({
		email: "",
		password: "",
		confirm: "",
	})

	async function handleGoogleToken(idToken: string) {
		setGoogleLoading(true)
		try {
			const result = await loginWithGoogle(idToken)
			if (result?.needsOnboarding) {
				setFlow("google")
				setSuggestedNickname(result.suggestedNickname)
				setStep(2)
			}
		} finally {
			setGoogleLoading(false)
		}
	}

	async function handleFinalSubmit(nickname: string, level: Level, deadline: string) {
		setSubmitting(true)
		try {
			if (flow === "google") {
				await completeOnboarding({
					nickname,
					target_level: level,
					target_deadline: deadline,
				})
			} else {
				await register({
					email: credentials.email,
					password: credentials.password,
					nickname,
					target_level: level,
					target_deadline: deadline,
				})
			}
		} finally {
			setSubmitting(false)
		}
	}

	if (step === 1) {
		return (
			<Step1
				initial={credentials}
				onNext={(data) => {
					setCredentials(data)
					setFlow("password")
					setStep(2)
				}}
				onGoogleToken={handleGoogleToken}
				googleLoading={googleLoading}
			/>
		)
	}

	return (
		<Step2
			onBack={() => setStep(1)}
			onSubmit={handleFinalSubmit}
			submitting={submitting}
			googleMode={flow === "google"}
			initialNickname={suggestedNickname ?? undefined}
		/>
	)
}
