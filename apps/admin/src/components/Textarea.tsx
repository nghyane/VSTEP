import { Input as AntdInput } from "antd"
import type { TextAreaRef } from "antd/es/input/TextArea"
import type { TextareaHTMLAttributes } from "react"
import { forwardRef } from "react"

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "prefix"> {
	invalid?: boolean
}

export const Textarea = forwardRef<TextAreaRef, Props>(function Textarea(
	{ invalid, className, ...rest },
	ref,
) {
	return (
		<AntdInput.TextArea
			ref={ref}
			status={invalid ? "error" : undefined}
			autoSize={{ minRows: 3 }}
			className={className}
			{...(rest as Record<string, unknown>)}
		/>
	)
})
