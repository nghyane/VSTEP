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
}

function Step1({ initial, onNext }: Step1Props) {
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
			<h1 className="font-extrabold text-3xl text-foreground mb-1">Tạo tài khoản</h1>
			<p className="text-sm text-subtle mb-5">Bắt đầu hành trình VSTEP của bạn hôm nay.</p>
			<GoogleButton />
			<div className="flex items-center gap-3 my-4">
				<div className="flex-1 h-px bg-border" />
				<span className="text-xs text-subtle font-bold">HOẶC</span>
				<div className="flex-1 h-px bg-border" />
			</div>
			<form onSubmit={handleSubmit} className="space-y-3">
				<input
					type="email"
					placeholder="Email"
					required
					autoComplete="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className={inputClass}
				/>
				<input
					type="password"
					placeholder="Mật khẩu"
					required
					autoComplete="new-password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className={inputClass}
				/>
				<input
					type="password"
					placeholder="Nhập lại mật khẩu"
					required
					autoComplete="new-password"
					value={confirm}
					onChange={(e) => setConfirm(e.target.value)}
					className={inputClass}
				/>
				{error && <p className="text-sm font-bold text-destructive">{error}</p>}
				<button type="submit" className="btn btn-primary w-full h-12 text-base">
					Tiếp tục
				</button>
			</form>
			<p className="text-sm font-bold text-muted mt-4">
				Đã có tài khoản?{" "}
				<Link to="/" search={{ auth: "login" }} className="text-primary hover:underline">
					Đăng nhập
				</Link>
			</p>
		</>
	)
}

// ─── Step 2: onboarding ────────────────────────────────────────────────────

const LEVELS = ["B1", "B2", "C1"] as const
type Level = (typeof LEVELS)[number]

interface Step2Props {
	onBack: () => void
	onSubmit: (nickname: string, level: Level, deadline: string) => Promise<void>
	submitting: boolean
}

function LevelButton({
	value,
	current,
	onChange,
}: {
	value: Level
	current: Level
	onChange: (v: Level) => void
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(value)}
			className={cn(
				"h-12 rounded-(--radius-button) font-bold text-base border-2 transition",
				current === value
					? "bg-primary text-primary-foreground border-primary-dark"
					: "bg-surface border-border text-foreground hover:border-primary",
			)}
		>
			{value}
		</button>
	)
}

function Step2({ onBack, onSubmit, submitting }: Step2Props) {
	const [nickname, setNickname] = useState("")
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
			{/* Fixed top — back + title */}
			<div className="shrink-0">
				<button
					type="button"
					onClick={onBack}
					className="flex items-center gap-1 text-sm font-bold text-muted hover:text-foreground transition mb-4"
				>
					← Quay lại
				</button>
				<h1 className="font-extrabold text-3xl text-foreground mb-1">Gần xong rồi!</h1>
				<p className="text-sm text-subtle mb-5">Hãy cho chúng mình biết thêm về bạn.</p>
			</div>

			{/* Scrollable middle — nickname → date picker */}
			<form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 gap-4">
				<ScrollArea className="flex-1 min-h-0">
					<div className="space-y-4 pb-1">
						<div className="space-y-1.5">
							<label htmlFor="reg-nickname" className="text-sm font-bold text-foreground">
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

						<div className="space-y-1.5">
							<p className="text-sm font-bold text-foreground">Mục tiêu trình độ</p>
							<div className="grid grid-cols-3 gap-2">
								{LEVELS.map((l) => (
									<LevelButton key={l} value={l} current={level} onChange={setLevel} />
								))}
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-bold text-foreground">Ngày thi dự kiến</p>
							<DatePicker value={deadline} onChange={setDeadline} />
						</div>
					</div>
				</ScrollArea>

				{/* Fixed bottom — error + submit */}
				<div className="shrink-0 space-y-3 pt-2">
					{error && <p className="text-sm font-bold text-destructive">{error}</p>}
					<button
						type="submit"
						disabled={submitting}
						className="btn btn-primary w-full h-12 text-base disabled:opacity-50"
					>
						{submitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
					</button>
				</div>
			</form>
		</div>
	)
}

// ─── Main component ────────────────────────────────────────────────────────

export function RegisterForm() {
	const register = useAuth((s) => s.register)
	const [step, setStep] = useState<1 | 2>(1)
	const [submitting, setSubmitting] = useState(false)
	const [credentials, setCredentials] = useState<Step1Data>({
		email: "",
		password: "",
		confirm: "",
	})

	async function handleFinalSubmit(nickname: string, level: Level, deadline: string) {
		setSubmitting(true)
		try {
			await register({
				email: credentials.email,
				password: credentials.password,
				nickname,
				target_level: level,
				target_deadline: deadline,
			})
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
					setStep(2)
				}}
			/>
		)
	}

	return <Step2 onBack={() => setStep(1)} onSubmit={handleFinalSubmit} submitting={submitting} />
}
