import { ChevronLeft, X } from "lucide-react"
import { useState } from "react"
import { Logo } from "#/components/common/Logo"
import { Button } from "#/shared/ui/button"
import { Dialog, DialogContent } from "#/shared/ui/dialog"
import { Input } from "#/shared/ui/input"

interface AuthDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
	const [step, setStep] = useState<"choose" | "login" | "register">("choose")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		// TODO: Implement auth logic
		setTimeout(() => setLoading(false), 1000)
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				if (!val) {
					setTimeout(() => setStep("choose"), 300)
				}
				onOpenChange(val)
			}}
		>
			<DialogContent showCloseButton={false} className="max-w-md border-0 p-0 sm:rounded-3xl">
				{/* Header */}
				<div className="relative p-6 text-center">
					{step !== "choose" && (
						<button
							type="button"
							onClick={() => setStep("choose")}
							className="absolute left-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
						>
							<ChevronLeft className="size-5" />
						</button>
					)}
					<Logo className="mx-auto h-8" />
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
					>
						<X className="size-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 pt-4">
					<h2 className="text-center text-xl font-bold leading-[1.4]">
						{step === "choose"
							? "Tham gia ngay cùng VSTEP - Nền tảng học và luyện thi thông minh"
							: step === "login"
								? "Đăng nhập"
								: "Đăng ký tài khoản mới"}
					</h2>

					{step === "choose" ? (
						<div className="mt-8 space-y-4">
							<Button
								size="lg"
								className="h-12 w-full rounded-xl border border-primary bg-primary text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
								onClick={() => setStep("login")}
							>
								Đăng nhập
							</Button>

							<Button
								variant="outline"
								size="lg"
								className="h-12 w-full rounded-xl border border-primary text-base font-bold text-primary hover:bg-primary/5"
								onClick={() => setStep("register")}
							>
								Đăng ký
							</Button>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="mt-8 space-y-4">
							{step === "register" && (
								<Input type="text" placeholder="Họ và tên" className="h-12 rounded-xl" />
							)}
							<Input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-12 rounded-xl"
								required
							/>
							<Input
								type="password"
								placeholder="Mật khẩu"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="h-12 rounded-xl"
								required
							/>

							<Button
								type="submit"
								size="lg"
								className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
								disabled={loading}
							>
								{loading ? "Đang xử lý..." : step === "login" ? "Đăng nhập" : "Đăng ký"}
							</Button>
						</form>
					)}

					<div className="mt-8 border-t px-4 pt-6">
						<p className="text-center text-xs leading-relaxed text-muted-foreground">
							Bằng cách tham gia, bạn xác nhận đã đọc và đồng ý với{" "}
							<a href="/" className="text-primary hover:underline">
								Điều khoản & Điều kiện
							</a>{" "}
							cùng{" "}
							<a href="/" className="text-primary hover:underline">
								Chính sách bảo mật
							</a>{" "}
							của VSTEP
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
