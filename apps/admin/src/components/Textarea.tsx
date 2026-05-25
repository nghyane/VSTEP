import { Input as AntdInput } from "antd"
import type { TextAreaRef } from "antd/es/input/TextArea"
import type { TextareaHTMLAttributes } from "react"
import { forwardRef } from "react"

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "prefix"> {
	invalid?: boolean
	autoSize?: boolean | { minRows?: number; maxRows?: number }
}

export const Textarea = forwardRef<TextAreaRef, Props>(function Textarea(
	{ invalid, className, autoSize = { minRows: 3 }, ...rest },
	ref,
) {
	return (
		<AntdInput.TextArea
			ref={ref}
			status={invalid ? "error" : undefined}
			autoSize={autoSize}
			className={className}
			{...(rest as Record<string, unknown>)}
		/>
	)
})
