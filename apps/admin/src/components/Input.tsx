import { Input as AntdInput, type InputRef } from "antd"
import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
	invalid?: boolean
}

export const Input = forwardRef<InputRef, Props>(function Input({ invalid, className, ...rest }, ref) {
	return (
		<AntdInput
			ref={ref}
			status={invalid ? "error" : undefined}
			className={className}
			{...(rest as Record<string, unknown>)}
		/>
	)
})
