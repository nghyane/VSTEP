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
}

export function FormField({ label, htmlFor, required, error, helper, children, className }: Props) {
	const errorText = Array.isArray(error) ? error[0] : error
	return (
		<Form.Item
			className={className}
			label={label}
			htmlFor={htmlFor}
			required={required}
			validateStatus={errorText ? "error" : undefined}
			help={errorText ?? helper}
			style={{ marginBottom: 12 }}
		>
			{children}
		</Form.Item>
	)
}
