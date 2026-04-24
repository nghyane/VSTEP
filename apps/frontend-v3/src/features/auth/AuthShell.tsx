import { useEffect } from "react"
import { Icon } from "#/components/Icon"

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
		<div className="fixed inset-0 z-50 bg-surface grid md:grid-cols-2">
			{/* Left — brand panel (desktop only) */}
			<aside className="hidden md:flex relative flex-col items-center justify-center gap-6 bg-primary-tint px-12">
				<img src="/mascot/lac-wave.png" alt="Lạc" className="w-72 object-contain drop-shadow-sm" />
				<div className="text-center max-w-sm">
					<h2 className="font-extrabold text-3xl text-foreground mb-2">Chào mừng đến VSTEP!</h2>
					<p className="text-base text-muted font-bold">
						Luyện thi VSTEP vui vẻ cùng Lạc — học mỗi ngày, tiến bộ từng bước.
					</p>
				</div>
			</aside>

			{/* Right — form column */}
			<main className="relative flex flex-col min-h-0 h-full">
				{/* Close — top right */}
				<button
					type="button"
					onClick={onClose}
					aria-label="Đóng"
					className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-background transition z-10"
				>
					<Icon name="close" size="sm" />
				</button>

				<div className="flex flex-col justify-center min-h-0 flex-1 w-full max-w-[420px] mx-auto px-6 md:px-0 pt-16 pb-6 md:py-12">
					{children}
					<p className="text-xs text-subtle mt-4 shrink-0 text-center md:text-left">
						Khi sử dụng, bạn đồng ý với <strong className="text-muted">Điều khoản</strong> và{" "}
						<strong className="text-muted">Chính sách bảo mật</strong>
					</p>
				</div>
			</main>
		</div>
	)
}
