import { Link } from "@tanstack/react-router"
import { useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import { DatePicker } from "#/features/auth/DatePicker"
import { GoogleButton } from "#/features/auth/GoogleButton"
import { PasswordInput } from "#/features/auth/PasswordInput"
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
	onNext: (data: Step1Data) => Promise<string | null>
	onGoogleToken: (idToken: string) => void
	googleLoading: boolean
}

function Step1({ initial, onNext, onGoogleToken, googleLoading }: Step1Props) {
	const [email, setEmail] = useState(initial.email)
	const [password, setPassword] = useState(initial.password)
	const [confirm, setConfirm] = useState(initial.confirm)
	const [error, setError] = useState<string | null>(null)
	const [submitting, setSubmitting] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
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
		setSubmitting(true)
		try {
			const message = await onNext({ email, password, confirm })
			if (message) setError(message)
		} finally {
			setSubmitting(false)
		}
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
					<label htmlFor="reg-email" className="text-xs font-bold text-muted uppercase">
						Email
					</label>
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
					<label htmlFor="reg-password" className="text-xs font-bold text-muted uppercase">
						Mật khẩu
					</label>
					<PasswordInput
						id="reg-password"
						placeholder="Tối thiểu 8 ký tự"
						required
						autoComplete="new-password"
						value={password}
						onChange={setPassword}
					/>
				</div>
				<div className="space-y-1">
					<label htmlFor="reg-confirm" className="text-xs font-bold text-muted uppercase">
						Nhập lại mật khẩu
					</label>
					<PasswordInput
						id="reg-confirm"
						placeholder="Nhập lại mật khẩu"
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
					{submitting ? "Đang gửi mã..." : "Tiếp tục"}
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

const ENTRY_LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const
type EntryLevel = (typeof ENTRY_LEVELS)[number]

const LEVEL_RANK: Record<EntryLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 }

/** Min months giữa hôm nay và ngày thi, theo độ chênh entry → target. */
const MIN_PREP_MONTHS = [1, 3, 6, 12, 18] as const

const LEVEL_INFO: Record<Level, string> = {
	B1: "Giao tiếp cơ bản",
	B2: "Phổ biến nhất",
	C1: "Nâng cao",
}

function computeMinDate(entry: EntryLevel, target: Level): string {
	const gap = LEVEL_RANK[target] - LEVEL_RANK[entry]
	const months = MIN_PREP_MONTHS[Math.max(0, gap)] ?? MIN_PREP_MONTHS[MIN_PREP_MONTHS.length - 1]
	const d = new Date()
	d.setMonth(d.getMonth() + months)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

interface Step2Props {
	onBack: () => void
	onSubmit: (nickname: string, entryLevel: EntryLevel, level: Level, deadline: string) => Promise<void>
	submitting: boolean
	initialNickname?: string
	googleMode: boolean
}

function Step2({ onBack, onSubmit, submitting, initialNickname, googleMode }: Step2Props) {
	const [nickname, setNickname] = useState(initialNickname ?? "")
	const [entryLevel, setEntryLevel] = useState<EntryLevel>("A2")
	const [level, setLevel] = useState<Level>("B2")
	const [deadline, setDeadline] = useState("")
	const [error, setError] = useState<string | null>(null)

	const entryRank = LEVEL_RANK[entryLevel]
	const availableTargets = LEVELS.filter((l) => LEVEL_RANK[l] >= entryRank)

	function handlePickEntry(next: EntryLevel) {
		setEntryLevel(next)
		setDeadline("")
		if (LEVEL_RANK[level] < LEVEL_RANK[next]) {
			const fallback = LEVELS.find((l) => LEVEL_RANK[l] >= LEVEL_RANK[next])
			if (fallback) setLevel(fallback)
		}
	}

	function handlePickLevel(next: Level) {
		setLevel(next)
		setDeadline("")
	}

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
		await onSubmit(nickname.trim(), entryLevel, level, deadline)
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
					<div className="space-y-5 pb-1 pr-3">
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
							<p className="text-xs font-bold text-muted uppercase">Trình độ hiện tại (tự đánh giá)</p>
							<div className="grid grid-cols-5 gap-2">
								{ENTRY_LEVELS.map((l) => (
									<button
										type="button"
										key={l}
										onClick={() => handlePickEntry(l)}
										className={cn(
											"h-11 rounded-(--radius-button) font-bold text-sm border-2 border-b-4 transition",
											entryLevel === l
												? "bg-primary text-primary-foreground border-primary-dark"
												: "bg-surface border-border text-foreground hover:border-primary/40",
										)}
									>
										{l}
									</button>
								))}
							</div>
							<p className="text-[11px] text-subtle">
								Dùng để gợi ý lộ trình ban đầu. Bạn sẽ được cập nhật "Dự đoán" sau khi làm đủ 5 bài thi thử.
							</p>
						</div>

						<div className="space-y-2">
							<p className="text-xs font-bold text-muted uppercase">Mục tiêu trình độ</p>
							<div
								className="grid gap-2"
								style={{ gridTemplateColumns: `repeat(${availableTargets.length}, minmax(0, 1fr))` }}
							>
								{availableTargets.map((l) => (
									<button
										type="button"
										key={l}
										onClick={() => handlePickLevel(l)}
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
							<p className="text-[11px] text-subtle">
								Tối thiểu {MIN_PREP_MONTHS[Math.max(0, LEVEL_RANK[level] - LEVEL_RANK[entryLevel])]} tháng để
								đạt {entryLevel} → {level}.
							</p>
							<DatePicker
								value={deadline}
								onChange={setDeadline}
								minDate={computeMinDate(entryLevel, level)}
							/>
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
	const checkEmail = useAuth((s) => s.checkEmail)
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

	async function handleFinalSubmit(nickname: string, entryLevel: EntryLevel, level: Level, deadline: string) {
		setSubmitting(true)
		try {
			if (flow === "google") {
				await completeOnboarding({
					nickname,
					entry_level: entryLevel,
					target_level: level,
					target_deadline: deadline,
				})
			} else {
				await register({
					email: credentials.email,
					password: credentials.password,
					nickname,
					entry_level: entryLevel,
					target_level: level,
					target_deadline: deadline,
				})
			}
		} finally {
			setSubmitting(false)
		}
	}

	async function handleStep1Next(data: Step1Data) {
		const result = await checkEmail(data.email)
		if (!result.ok) return result.message
		setCredentials(data)
		setFlow("password")
		setStep(2)
		return null
	}

	if (step === 1) {
		return (
			<Step1
				initial={credentials}
				onNext={handleStep1Next}
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
