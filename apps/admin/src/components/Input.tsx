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
