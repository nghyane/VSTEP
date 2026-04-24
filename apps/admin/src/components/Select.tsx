import { ChevronDown } from "lucide-react"
import type { SelectHTMLAttributes } from "react"
import { forwardRef } from "react"
import { cn } from "#/lib/utils"

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
	invalid?: boolean
	children: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
	{ invalid, className, children, ...rest },
	ref,
) {
	return (
		<div className="relative">
			<select
				ref={ref}
				className={cn(
					"h-9 w-full appearance-none rounded-(--radius-input) border border-border bg-surface px-3 pr-8 text-sm text-foreground",
					"focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
					"disabled:bg-surface-muted disabled:text-subtle",
					invalid ? "border-danger" : "border-border",
					className,
				)}
				{...rest}
			>
				{children}
			</select>
			<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
		</div>
	)
})
