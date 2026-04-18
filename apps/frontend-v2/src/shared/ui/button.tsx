import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import type * as React from "react"

import { cn } from "#/shared/lib/utils"

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-bold whitespace-nowrap outline-none transition-[transform,filter,background-color,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border-2 border-[oklch(0.48_0.2_258)] border-b-4 border-b-[oklch(0.35_0.2_258)] bg-primary text-primary-foreground hover:brightness-105 active:translate-y-[3px] active:border-b active:pb-[3px]",
				destructive:
					"border-2 border-[oklch(0.50_0.2_27)] border-b-4 border-b-[oklch(0.38_0.2_27)] bg-destructive text-white hover:brightness-105 active:translate-y-[3px] active:border-b active:pb-[3px]",
				success:
					"border-2 border-[oklch(0.58_0.2_150)] border-b-4 border-b-[oklch(0.45_0.2_150)] bg-success text-white hover:brightness-105 active:translate-y-[3px] active:border-b active:pb-[3px]",
				outline:
					"border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card text-foreground hover:bg-muted active:translate-y-[3px] active:border-b active:pb-[3px]",
				secondary:
					"border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-muted text-foreground hover:bg-muted/80 active:translate-y-[3px] active:border-b active:pb-[3px]",
				ghost: "hover:bg-muted hover:text-foreground",
				link: "text-primary underline-offset-4 hover:underline",
				coin: "border-2 border-amber-600 border-b-4 border-b-amber-800 bg-amber-500 text-white hover:brightness-105 active:translate-y-[3px] active:border-b active:pb-[3px]",
			},
			size: {
				default: "h-11 px-6",
				xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm: "h-9 gap-1.5 px-4 text-xs",
				lg: "h-14 px-8 text-base",
				icon: "size-9",
				"icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
)

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean
	}) {
	const Comp = asChild ? Slot.Root : "button"

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	)
}

export { Button, buttonVariants }
