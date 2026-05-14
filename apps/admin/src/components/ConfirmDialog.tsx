import { Button } from "#/components/Button"
import { Modal } from "#/components/Modal"

interface Props {
	open: boolean
	onClose: () => void
	onConfirm: () => void
	title: string
	description?: string
	confirmLabel?: string
	cancelLabel?: string
	loading?: boolean
	variant?: "danger" | "primary"
}

export function ConfirmDialog({
	open,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Xác nhận",
	cancelLabel = "Huỷ",
	loading,
	variant = "danger",
}: Props) {
	return (
		<Modal open={open} onClose={onClose} title={title} description={description} size="sm">
			<div className="flex justify-end gap-2">
				<Button variant="ghost" onClick={onClose} disabled={loading}>
					{cancelLabel}
				</Button>
				<Button variant={variant} onClick={onConfirm} loading={loading}>
					{confirmLabel}
				</Button>
			</div>
		</Modal>
	)
}
