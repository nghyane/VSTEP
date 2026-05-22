import { Modal as AntdModal } from "antd"

interface Props {
	open: boolean
	onClose: () => void
	title?: string
	description?: string
	children: React.ReactNode
	size?: "sm" | "md" | "lg" | "xl"
}

const widthMap = { sm: 400, md: 560, lg: 720, xl: 960 } as const

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
			// Cap theo viewport: nhỏ hơn cửa sổ thì co lại bề ngang, không phình ra ngoài.
			width={`min(${widthMap[size]}px, calc(100vw - 32px))`}
			centered
			destroyOnHidden
			mask={{ closable: true }}
			styles={{
				body: {
					maxHeight: "calc(100vh - 180px)",
					overflowY: "auto",
					paddingRight: 8,
				},
			}}
		>
			{children}
		</AntdModal>
	)
}
