import type { HTMLAttributes } from "react"
import { cn } from "#/lib/utils"

type Variant = "default" | "success" | "warning" | "danger" | "info"

interface Props extends HTMLAttributes<HTMLSpanElement> {
	variant?: Variant
}

const variants: Record<Variant, string> = {
	default: "bg-surface-muted text-foreground",
	success: "bg-success-tint text-success",
	warning: "bg-warning-tint text-warning",
	danger: "bg-danger-tint text-danger",
	info: "bg-info-tint text-info",
}

export function Badge({ variant = "default", className, children }: Props) {
	return (
		<span
			className={cn(
				"inline-flex h-5 items-center rounded-md px-2 text-xs font-medium",
				variants[variant],
				className,
			)}
		>
			{children}
		</span>
	)
}
