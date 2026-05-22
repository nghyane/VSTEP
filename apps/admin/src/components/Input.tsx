import { Input as AntdInput, type InputRef } from "antd"
import type { InputHTMLAttributes, ReactNode } from "react"
import { forwardRef } from "react"

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
	invalid?: boolean
	suffix?: ReactNode
}

export const Input = forwardRef<InputRef, Props>(function Input(
	{ invalid, className, suffix, ...rest },
	ref,
) {
	return (
		<AntdInput
			ref={ref}
			status={invalid ? "error" : undefined}
			className={className}
			suffix={suffix}
			{...(rest as Record<string, unknown>)}
		/>
	)
})

/**
 * Password input với icon mắt (visibilityToggle của antd) — dùng cho các
 * form đổi/khởi tạo mật khẩu. Cùng API `invalid` để show error border.
 */
export const PasswordInput = forwardRef<InputRef, Omit<Props, "type">>(function PasswordInput(
	{ invalid, className, ...rest },
	ref,
) {
	return (
		<AntdInput.Password
			ref={ref}
			status={invalid ? "error" : undefined}
			className={className}
			{...(rest as Record<string, unknown>)}
		/>
	)
})
