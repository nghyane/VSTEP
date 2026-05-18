import { Form } from "antd"
import type { ReactNode } from "react"

interface Props {
	label: string
	htmlFor?: string
	required?: boolean
	error?: string | string[]
	helper?: string
	children: ReactNode
	className?: string
	style?: React.CSSProperties
}

export function FormField({ label, htmlFor, required, error, helper, children, className, style }: Props) {
	const errorText = Array.isArray(error) ? error[0] : error
	return (
		<Form.Item
			className={className}
			label={label}
			htmlFor={htmlFor}
			required={required}
			validateStatus={errorText ? "error" : undefined}
			help={errorText ?? helper}
			style={{ marginBottom: 12, ...style }}
		>
			{children}
		</Form.Item>
	)
}
