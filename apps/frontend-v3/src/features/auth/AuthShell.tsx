import { useEffect } from "react"
import { Icon } from "#/components/Icon"
import { Logo } from "#/components/Logo"

interface Props {
	onClose: () => void
	children: React.ReactNode
}

export function AuthShell({ onClose, children }: Props) {
	useEffect(() => {
		const prev = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = prev
		}
	}, [])

	return (
		<div className="fixed inset-0 z-50 flex bg-surface">
			{/* Left — brand panel (desktop only) */}
			<aside className="hidden lg:flex w-[480px] shrink-0 relative flex-col items-center justify-center gap-8 bg-primary-tint px-12">
				<div className="absolute top-8 left-8">
					<Logo size="lg" />
				</div>
				<img
					src="/mascot/lac-wave.png"
					alt="Lạc"
					className="w-64 object-contain"
				/>
				<div className="text-center max-w-xs">
					<h2 className="font-extrabold text-2xl text-foreground mb-2">Học vui, thi giỏi!</h2>
					<p className="text-sm text-muted font-bold leading-relaxed">
						Luyện thi VSTEP cùng Lạc mỗi ngày, tiến bộ từng bước đến mục tiêu.
					</p>
				</div>
				<div className="flex gap-6 mt-2">
					<Stat value="10K+" label="Học viên" />
					<Stat value="4" label="Kỹ năng" />
					<Stat value="AI" label="Chấm bài" />
				</div>
			</aside>

			{/* Right — form column */}
			<main className="relative flex flex-col min-h-0 h-full flex-1">
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute top-5 right-5 p-2 rounded-full hover:bg-background transition z-10"
				>
					<Icon name="close" size="sm" />
				</button>

				{/* Mobile logo */}
				<div className="lg:hidden pt-6 px-6">
					<Logo size="lg" />
				</div>

				<div className="flex flex-col justify-center min-h-0 flex-1 w-full max-w-[400px] mx-auto px-6 lg:px-0 pt-8 pb-6 lg:py-12">
					{children}
					<p className="text-[11px] text-placeholder mt-6 shrink-0 text-center leading-relaxed">
						Khi sử dụng, bạn đồng ý với <span className="text-subtle">Điều khoản</span> và{" "}
						<span className="text-subtle">Chính sách bảo mật</span>
					</p>
				</div>
			</main>
		</div>
	)
}

function Stat({ value, label }: { value: string; label: string }) {
	return (
		<div className="text-center">
			<p className="font-extrabold text-xl text-primary">{value}</p>
			<p className="text-xs text-muted font-bold">{label}</p>
		</div>
	)
}
