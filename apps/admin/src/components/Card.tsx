import type { HTMLAttributes } from "react"
import { cn } from "#/lib/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	title?: string | JSX.Element | null
	description?: string
	action?: JSX.Element | null
	padded?: boolean
}

export function Card({ title, description, action, padded = true, className, children, ...rest }: CardProps) {
	return (
		<div
			className={cn(
				"rounded-(--radius-card) border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
				className,
			)}
			{...rest}
		>
			{(title || action) && (
				<div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
					<div>
						{title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
						{description && <p className="mt-1 text-xs text-muted">{description}</p>}
					</div>
					{action}
				</div>
			)}
			<div className={cn(padded && "p-5")}>{children}</div>
		</div>
	)
}
