import { Alert, Flex } from "antd"
import { type FormEvent, useState } from "react"
import { Button } from "#/components/Button"
import { FormField } from "#/components/FormField"
import { PasswordInput } from "#/components/Input"
import { Modal } from "#/components/Modal"
import { showSuccess } from "#/components/Toaster"
import { extractError, formatApiErrorBanner } from "#/lib/api"
import { useChangeMyPassword } from "./queries"

interface Props {
	open: boolean
	onClose: () => void
}

/**
 * Đổi mật khẩu của chính tài khoản đang đăng nhập. Yêu cầu current
 * password để xác thực — kẻ tấn công lấy được session token vẫn không
 * đổi được password.
 */
export function ChangeMyPasswordModal({ open, onClose }: Props) {
	const mutation = useChangeMyPassword()
	const [currentPw, setCurrentPw] = useState("")
	const [newPw, setNewPw] = useState("")
	const [confirmPw, setConfirmPw] = useState("")
	const [errors, setErrors] = useState<Record<string, string[]>>({})
	const [generic, setGeneric] = useState<string | null>(null)

	function reset(): void {
		setCurrentPw("")
		setNewPw("")
		setConfirmPw("")
		setErrors({})
		setGeneric(null)
	}

	async function handle(e: FormEvent<HTMLFormElement>): Promise<void> {
		e.preventDefault()
		setErrors({})
		setGeneric(null)

		if (newPw !== confirmPw) {
			setErrors({ new_password_confirm: ["Mật khẩu nhập lại không khớp."] })
			return
		}

		try {
			await mutation.mutateAsync({ current_password: currentPw, new_password: newPw })
			showSuccess("Đã đổi mật khẩu.")
			reset()
			onClose()
		} catch (err) {
			const x = await extractError(err)
			if (x.errors && Object.keys(x.errors).length > 0) setErrors(x.errors)
			setGeneric(formatApiErrorBanner(x))
		}
	}

	return (
		<Modal
			open={open}
			onClose={() => {
				reset()
				onClose()
			}}
			title="Đổi mật khẩu"
			size="md"
		>
			<form onSubmit={handle}>
				<Flex vertical gap={8}>
					{generic && <Alert type="error" showIcon message={generic} closable />}
					<FormField
						label="Mật khẩu hiện tại"
						htmlFor="current_password"
						required
						error={errors.current_password}
					>
						<PasswordInput
							id="current_password"
							value={currentPw}
							onChange={(e) => setCurrentPw(e.target.value)}
							invalid={!!errors.current_password}
							autoComplete="current-password"
						/>
					</FormField>
					<FormField
						label="Mật khẩu mới"
						htmlFor="new_password"
						required
						error={errors.new_password}
						helper="Tối thiểu 8 ký tự, khác mật khẩu hiện tại."
					>
						<PasswordInput
							id="new_password"
							value={newPw}
							onChange={(e) => setNewPw(e.target.value)}
							invalid={!!errors.new_password}
							autoComplete="new-password"
						/>
					</FormField>
					<FormField
						label="Nhập lại mật khẩu mới"
						htmlFor="new_password_confirm"
						required
						error={errors.new_password_confirm}
					>
						<PasswordInput
							id="new_password_confirm"
							value={confirmPw}
							onChange={(e) => setConfirmPw(e.target.value)}
							invalid={!!errors.new_password_confirm}
							autoComplete="new-password"
						/>
					</FormField>
					<Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
						<Button
							variant="ghost"
							onClick={() => {
								reset()
								onClose()
							}}
							disabled={mutation.isPending}
						>
							Huỷ
						</Button>
						<Button type="submit" loading={mutation.isPending}>
							Đổi mật khẩu
						</Button>
					</Flex>
				</Flex>
			</form>
		</Modal>
	)
}
