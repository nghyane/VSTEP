import { Modal } from "antd"

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
		<Modal
			open={open}
			title={title}
			onCancel={onClose}
			onOk={onConfirm}
			okText={confirmLabel}
			cancelText={cancelLabel}
			confirmLoading={loading}
			okButtonProps={{ danger: variant === "danger" }}
			destroyOnHidden
		>
			{description}
		</Modal>
	)
}
