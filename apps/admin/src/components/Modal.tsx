import { Modal as AntdModal } from "antd"

interface Props {
	open: boolean
	onClose: () => void
	title?: string
	description?: string
	children: React.ReactNode
	size?: "sm" | "md" | "lg"
}

const widthMap = { sm: 400, md: 560, lg: 720 } as const

export function Modal({ open, onClose, title, description, children, size = "md" }: Props) {
	return (
		<AntdModal
			open={open}
			onCancel={onClose}
			title={
				title ? (
					<div>
						<div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
						{description && (
							<div style={{ marginTop: 4, fontSize: 13, color: "rgba(0,0,0,0.45)", fontWeight: 400 }}>
								{description}
							</div>
						)}
					</div>
				) : null
			}
			footer={null}
			width={widthMap[size]}
			destroyOnHidden
			maskClosable
		>
			{children}
		</AntdModal>
	)
}
