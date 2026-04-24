import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "#/lib/utils"

interface Props extends HTMLAttributes<HTMLDivElement> {
	title: string
	subtitle?: string
	action?: ReactNode
}

export function PageHeader({ title, subtitle, action, className, children, ...rest }: Props) {
	return (
		<div
			className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}
			{...rest}
		>
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
				{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
			</div>
			{action}
			{children}
		</div>
	)
}
