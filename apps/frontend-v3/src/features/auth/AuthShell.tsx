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
		<div className="fixed inset-0 z-50 bg-surface flex flex-col">
			{/* Header — cố định */}
			<div className="flex items-center px-6 py-4 shrink-0">
				<button type="button" onClick={onClose} className="p-2 hover:opacity-70">
					<Icon name="close" size="sm" />
				</button>
			</div>

			{/* Body */}
			<div className="flex flex-1 min-h-0 items-end justify-center gap-12 px-6">
				{/* Mascot — cố định bên trái */}
				<img
					src="/mascot/lac-wave.png"
					alt="Lạc"
					className="hidden md:block w-80 object-contain self-end shrink-0"
				/>

				{/* Form column — flex col, fill height, children tự quản lý scroll */}
				<div className="w-full md:w-[400px] md:shrink-0 flex flex-col min-h-0 h-full py-8 text-center md:text-left">
					{children}
					<p className="text-xs text-subtle mt-4 shrink-0 pb-2">
						Khi sử dụng, bạn đồng ý với <strong className="text-muted">Điều khoản</strong> và{" "}
						<strong className="text-muted">Chính sách bảo mật</strong>
					</p>
				</div>
			</div>
		</div>
	)
}
