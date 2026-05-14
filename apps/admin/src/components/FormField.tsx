import type { ReactNode } from "react"
import { cn } from "#/lib/utils"

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
		<div className={cn("flex flex-col gap-1.5", className)}>
			<label htmlFor={htmlFor} className="text-xs font-medium text-muted">
				{label}
				{required && <span className="ml-1 text-danger">*</span>}
			</label>
			{children}
			{errorText ? (
				<p className="text-xs text-danger">{errorText}</p>
			) : helper ? (
				<p className="text-xs text-subtle">{helper}</p>
			) : null}
		</div>
	)
}
