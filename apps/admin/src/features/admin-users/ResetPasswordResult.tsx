import { CopyOutlined } from "@ant-design/icons"
import { Alert, Input as AntInput, Flex, Typography } from "antd"
import { useState } from "react"
import { Button } from "#/components/Button"
import { Modal } from "#/components/Modal"

interface Props {
	open: boolean
	newPassword: string | null
	userEmail: string | null
	onClose: () => void
}

/**
 * Hiện password mới 1 lần — admin có trách nhiệm chuyển cho user qua
 * kênh an toàn (chưa có email tự động). Đóng modal là không lấy lại được.
 */
export function ResetPasswordResult({ open, newPassword, userEmail, onClose }: Props) {
	const [copied, setCopied] = useState(false)

	async function copy(): Promise<void> {
		if (!newPassword) return
		try {
			await navigator.clipboard.writeText(newPassword)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			// Clipboard không khả dụng trong context này — bỏ qua, user copy tay.
		}
	}

	return (
		<Modal open={open} onClose={onClose} title="Đặt lại mật khẩu" size="md">
			{!newPassword ? null : (
				<Flex vertical gap={12}>
					<Alert
						type="warning"
						showIcon
						message="Mật khẩu mới chỉ hiển thị 1 lần. Sao chép và gửi cho người dùng qua kênh an toàn — đóng cửa sổ là không xem lại được."
					/>

					{userEmail && (
						<Typography.Text>
							Tài khoản: <strong>{userEmail}</strong>
						</Typography.Text>
					)}

					<div>
						<Typography.Text strong>Mật khẩu mới</Typography.Text>
						<Flex gap={8} style={{ marginTop: 4 }}>
							<AntInput readOnly value={newPassword} style={{ fontFamily: "monospace", fontSize: 14 }} />
							<Button icon={<CopyOutlined />} onClick={copy} variant="secondary">
								{copied ? "Đã chép" : "Chép"}
							</Button>
						</Flex>
					</div>

					<Flex justify="flex-end">
						<Button onClick={onClose}>Đóng</Button>
					</Flex>
				</Flex>
			)}
		</Modal>
	)
}
