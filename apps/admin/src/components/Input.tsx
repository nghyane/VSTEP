import type { InputHTMLAttributes } from "react"
import { forwardRef } from "react"
import { cn } from "#/lib/utils"

interface Props extends InputHTMLAttributes<HTMLInputElement> {
	invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
	{ invalid, className, ...rest },
	ref,
) {
	return (
		<input
			ref={ref}
			className={cn(
				"h-9 w-full rounded-(--radius-input) border bg-surface px-3 text-sm text-foreground",
				"placeholder:text-placeholder",
				"focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
				"disabled:bg-surface-muted disabled:text-subtle",
				invalid ? "border-danger" : "border-border",
				className,
			)}
			{...rest}
		/>
	)
})
