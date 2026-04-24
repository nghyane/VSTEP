import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "#/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant
	size?: Size
	loading?: boolean
	icon?: ReactNode
}

const base =
	"inline-flex items-center justify-center gap-2 font-medium rounded-(--radius-button) " +
	"transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2"

const variants: Record<Variant, string> = {
	primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
	secondary: "bg-surface text-foreground border border-border hover:bg-surface-muted",
	ghost: "bg-transparent text-foreground hover:bg-surface-muted",
	danger: "bg-danger text-white hover:opacity-90",
}

const sizes: Record<Size, string> = {
	sm: "h-8 px-3 text-xs",
	md: "h-9 px-4 text-sm",
	lg: "h-11 px-6 text-sm",
}

export function Button({
	variant = "primary",
	size = "md",
	loading,
	icon,
	className,
	children,
	disabled,
	...rest
}: Props) {
	return (
		<button
			type="button"
			className={cn(base, variants[variant], sizes[size], className)}
			disabled={disabled || loading}
			{...rest}
		>
			{loading ? (
				<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
			) : (
				icon
			)}
			{children}
		</button>
	)
}
