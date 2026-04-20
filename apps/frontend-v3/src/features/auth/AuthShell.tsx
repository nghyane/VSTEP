import { Icon } from "#/components/Icon"

interface Props {
	onClose: () => void
	children: React.ReactNode
}

export function AuthShell({ onClose, children }: Props) {
	return (
		<div className="fixed inset-0 z-50 bg-surface flex flex-col">
			<div className="flex items-center px-6 py-4">
				<button type="button" onClick={onClose} className="p-2 hover:opacity-70">
					<Icon name="close" size="sm" />
				</button>
			</div>
			<div className="flex-1 flex items-center justify-center px-6">
				<div className="w-full max-w-[400px] text-center">
					{children}
					<p className="text-xs text-subtle mt-8">
						Khi sử dụng, bạn đồng ý với <strong className="text-muted">Điều khoản</strong> và{" "}
						<strong className="text-muted">Chính sách bảo mật</strong>
					</p>
				</div>
			</div>
		</div>
	)
}
