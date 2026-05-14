import type { TextareaHTMLAttributes } from "react"
import { forwardRef } from "react"
import { cn } from "#/lib/utils"

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
	invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
	{ invalid, className, ...rest },
	ref,
) {
	return (
		<textarea
			ref={ref}
			className={cn(
				"min-h-[80px] w-full rounded-(--radius-input) border bg-surface px-3 py-2 text-sm text-foreground",
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
